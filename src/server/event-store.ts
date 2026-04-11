/**
 * SQLite-backed deterministic event store.
 *
 * Every event published through the chat-event-bus is appended here with a
 * monotonic per-database sequence number. Reconnecting SSE clients can
 * replay missed events using the standard HTTP Last-Event-ID / `id:` field
 * protocol — the browser EventSource sends Last-Event-ID automatically on
 * reconnect, requiring zero client-side changes.
 *
 * Falls back gracefully (no-op) when better-sqlite3 is unavailable so the
 * server always starts without errors.
 *
 * Key design choices:
 *  - Synchronous better-sqlite3 API — no async overhead on the hot path
 *  - WAL journal mode for concurrent readers + one writer
 *  - Events expire after EVENT_TTL_DAYS days; per-session cap prevents unbounded growth
 *  - Only events that actually reach subscribers are stored (after hasActiveSendRun guard)
 */

import { join } from 'node:path'
import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'

const _require = createRequire(import.meta.url)

const DATA_DIR = join(process.cwd(), '.runtime')
const DB_PATH = join(DATA_DIR, 'events.db')

const EVENT_TTL_DAYS = 7
const MAX_EVENTS_PER_SESSION = 10_000

type SqliteDb = import('better-sqlite3').Database

interface EventRow {
  seq: number
  session_key: string
  run_id: string | null
  event_type: string
  payload: string
  ts: number
}

export interface StoredEvent {
  seq: number
  sessionKey: string
  runId: string | null
  eventType: string
  payload: Record<string, unknown>
  ts: number
}

// ─── Lazy singleton ──────────────────────────────────────────────────────────

let _db: SqliteDb | null = null
let _initAttempted = false

function getDb(): SqliteDb | null {
  if (_initAttempted) return _db
  _initAttempted = true

  try {
    mkdirSync(DATA_DIR, { recursive: true })

    // Dynamic require via createRequire so the native addon works in both
    // CJS and ESM contexts. better-sqlite3 is listed in vite.config
    // ssr.external so the bundler leaves this call alone in production builds.
    const Database = _require('better-sqlite3') as typeof import('better-sqlite3')
    const db = new Database(DB_PATH) as SqliteDb

    db.pragma('journal_mode = WAL')
    db.pragma('synchronous = NORMAL')
    db.pragma('foreign_keys = ON')
    // Keep the database from growing forever between cleanup runs
    db.pragma('auto_vacuum = INCREMENTAL')

    db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        seq         INTEGER PRIMARY KEY AUTOINCREMENT,
        session_key TEXT    NOT NULL,
        run_id      TEXT,
        event_type  TEXT    NOT NULL,
        payload     TEXT    NOT NULL,
        ts          INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_events_session_seq
        ON events (session_key, seq);
      CREATE INDEX IF NOT EXISTS idx_events_ts
        ON events (ts);
    `)

    // Expire old events on every cold start
    const cutoff = Date.now() - EVENT_TTL_DAYS * 24 * 60 * 60 * 1000
    db.prepare('DELETE FROM events WHERE ts < ?').run(cutoff)
    db.pragma('incremental_vacuum')

    _db = db
    console.log('[event-store] SQLite event store ready at', DB_PATH)
    return _db
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.log(`[event-store] SQLite unavailable (${msg}) — replay disabled`)
    return null
  }
}

// ─── Public write API ─────────────────────────────────────────────────────────

/**
 * Append an event to the store. Returns the assigned sequence number, or
 * null if the store is unavailable (caller can still emit the SSE event
 * without an id: field — graceful degradation).
 */
export function appendEvent(
  sessionKey: string,
  runId: string | undefined,
  eventType: string,
  payload: Record<string, unknown>,
): number | null {
  const db = getDb()
  if (!db) return null

  try {
    const result = db
      .prepare(
        `INSERT INTO events (session_key, run_id, event_type, payload, ts)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(sessionKey, runId ?? null, eventType, JSON.stringify(payload), Date.now())

    const seq = Number(result.lastInsertRowid)

    // Trim oldest events if the per-session cap is exceeded
    const { c } = db
      .prepare('SELECT COUNT(*) AS c FROM events WHERE session_key = ?')
      .get(sessionKey) as { c: number }

    if (c > MAX_EVENTS_PER_SESSION) {
      db.prepare(
        `DELETE FROM events WHERE session_key = ? AND seq IN (
           SELECT seq FROM events WHERE session_key = ? ORDER BY seq ASC LIMIT ?
         )`,
      ).run(sessionKey, sessionKey, c - MAX_EVENTS_PER_SESSION)
    }

    return seq
  } catch {
    return null
  }
}

// ─── Public read API ──────────────────────────────────────────────────────────

/**
 * Return all events for a session with seq > lastSeq, in order.
 * Used for Last-Event-ID replay on SSE reconnect.
 */
export function getEventsSince(
  sessionKey: string,
  lastSeq: number,
  limit = 500,
): StoredEvent[] {
  const db = getDb()
  if (!db) return []

  try {
    const rows = db
      .prepare(
        `SELECT seq, session_key, run_id, event_type, payload, ts
         FROM events
         WHERE session_key = ? AND seq > ?
         ORDER BY seq ASC
         LIMIT ?`,
      )
      .all(sessionKey, lastSeq, limit) as EventRow[]

    return rows.map((row) => ({
      seq: row.seq,
      sessionKey: row.session_key,
      runId: row.run_id,
      eventType: row.event_type,
      payload: JSON.parse(row.payload) as Record<string, unknown>,
      ts: row.ts,
    }))
  } catch {
    return []
  }
}

/**
 * Return the highest stored sequence number for a session.
 * Useful for clients to detect drift without opening an SSE stream.
 */
export function getLatestSeq(sessionKey: string): number {
  const db = getDb()
  if (!db) return 0

  try {
    const row = db
      .prepare(
        'SELECT MAX(seq) AS seq FROM events WHERE session_key = ?',
      )
      .get(sessionKey) as { seq: number | null }
    return row.seq ?? 0
  } catch {
    return 0
  }
}
