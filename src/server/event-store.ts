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

export interface AuditQuery {
  sessionKey?: string
  eventTypes?: string[]
  since?: number
  until?: number
  limit?: number
  offset?: number
}

export interface AuditResult {
  events: StoredEvent[]
  total: number
  sessions: string[]
}

/**
 * Return events across all (or a specific) session(s) for the audit trail.
 * Filters to meaningful action events by default (tool, user_message, approval).
 */
export function queryAuditEvents(query: AuditQuery = {}): AuditResult {
  const db = getDb()
  if (!db) return { events: [], total: 0, sessions: [] }

  const {
    sessionKey,
    eventTypes,
    since,
    until,
    limit = 100,
    offset = 0,
  } = query

  try {
    const conditions: string[] = []
    const params: (string | number)[] = []

    if (sessionKey) {
      conditions.push('session_key = ?')
      params.push(sessionKey)
    }
    if (eventTypes && eventTypes.length > 0) {
      conditions.push(`event_type IN (${eventTypes.map(() => '?').join(',')})`)
      params.push(...eventTypes)
    }
    if (since !== undefined) {
      conditions.push('ts >= ?')
      params.push(since)
    }
    if (until !== undefined) {
      conditions.push('ts <= ?')
      params.push(until)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const totalRow = db
      .prepare(`SELECT COUNT(*) AS c FROM events ${where}`)
      .get(...params) as { c: number }

    const rows = db
      .prepare(
        `SELECT seq, session_key, run_id, event_type, payload, ts
         FROM events ${where}
         ORDER BY seq DESC
         LIMIT ? OFFSET ?`,
      )
      .all(...params, limit, offset) as EventRow[]

    const sessionRows = db
      .prepare('SELECT DISTINCT session_key FROM events ORDER BY session_key ASC')
      .all() as Array<{ session_key: string }>

    return {
      events: rows.map((row) => ({
        seq: row.seq,
        sessionKey: row.session_key,
        runId: row.run_id,
        eventType: row.event_type,
        payload: JSON.parse(row.payload) as Record<string, unknown>,
        ts: row.ts,
      })),
      total: totalRow.c,
      sessions: sessionRows.map((r) => r.session_key),
    }
  } catch {
    return { events: [], total: 0, sessions: [] }
  }
}

export interface AnalyticsResult {
  totalEvents: number
  totalSessions: number
  eventTypeCounts: Record<string, number>
  /** Top 15 tool names by call count (complete phase only) */
  toolFrequency: Array<{ tool: string; count: number; errors: number }>
  /** Last 14 days of event activity, oldest first */
  dailyVolume: Array<{
    date: string
    tool: number
    user_message: number
    approval: number
  }>
  /** Oldest and newest event timestamps (ms), or null when empty */
  timeRange: { oldest: number; newest: number } | null
}

/**
 * Compute aggregate analytics from the event store in a single SQLite pass.
 * All aggregation is done in SQL so we never load raw event payloads into JS.
 */
export function getAnalytics(): AnalyticsResult {
  const db = getDb()
  const empty: AnalyticsResult = {
    totalEvents: 0,
    totalSessions: 0,
    eventTypeCounts: {},
    toolFrequency: [],
    dailyVolume: [],
    timeRange: null,
  }
  if (!db) return empty

  try {
    // ── Totals ──────────────────────────────────────────────────────────────
    const { total } = db
      .prepare('SELECT COUNT(*) AS total FROM events')
      .get() as { total: number }

    const { sessions } = db
      .prepare(
        'SELECT COUNT(DISTINCT session_key) AS sessions FROM events',
      )
      .get() as { sessions: number }

    // ── Per-type counts ──────────────────────────────────────────────────────
    const typeRows = db
      .prepare(
        `SELECT event_type, COUNT(*) AS cnt FROM events GROUP BY event_type`,
      )
      .all() as Array<{ event_type: string; cnt: number }>

    const eventTypeCounts: Record<string, number> = {}
    for (const row of typeRows) eventTypeCounts[row.event_type] = row.cnt

    // ── Tool frequency (complete + error phases via json_extract) ───────────
    const toolRows = db
      .prepare(
        `SELECT
           json_extract(payload, '$.name') AS tool,
           SUM(CASE WHEN json_extract(payload, '$.phase') = 'complete' THEN 1 ELSE 0 END) AS count,
           SUM(CASE WHEN json_extract(payload, '$.phase') = 'error'    THEN 1 ELSE 0 END) AS errors
         FROM events
         WHERE event_type = 'tool'
           AND json_extract(payload, '$.phase') IN ('complete', 'error')
           AND json_extract(payload, '$.name') IS NOT NULL
         GROUP BY tool
         ORDER BY count DESC
         LIMIT 15`,
      )
      .all() as Array<{ tool: string; count: number; errors: number }>

    // ── Daily volume — last 14 days ─────────────────────────────────────────
    const since14 = Date.now() - 14 * 24 * 60 * 60 * 1000
    const dayRows = db
      .prepare(
        `SELECT
           date(ts / 1000, 'unixepoch', 'localtime') AS d,
           SUM(CASE WHEN event_type = 'tool'         THEN 1 ELSE 0 END) AS tool,
           SUM(CASE WHEN event_type = 'user_message' THEN 1 ELSE 0 END) AS user_message,
           SUM(CASE WHEN event_type = 'approval'     THEN 1 ELSE 0 END) AS approval
         FROM events
         WHERE ts >= ?
         GROUP BY d
         ORDER BY d ASC`,
      )
      .all(since14) as Array<{
        d: string
        tool: number
        user_message: number
        approval: number
      }>

    // Pre-fill all 14 days so gaps show as zero
    const dailyMap = new Map<
      string,
      { tool: number; user_message: number; approval: number }
    >()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000)
        .toLocaleDateString('en-CA') // YYYY-MM-DD
      dailyMap.set(d, { tool: 0, user_message: 0, approval: 0 })
    }
    for (const row of dayRows) {
      const existing = dailyMap.get(row.d)
      if (existing) {
        existing.tool = row.tool
        existing.user_message = row.user_message
        existing.approval = row.approval
      }
    }
    const dailyVolume = Array.from(dailyMap.entries()).map(([date, v]) => ({
      date,
      ...v,
    }))

    // ── Time range ───────────────────────────────────────────────────────────
    const rangeRow = db
      .prepare('SELECT MIN(ts) AS oldest, MAX(ts) AS newest FROM events')
      .get() as { oldest: number | null; newest: number | null }

    return {
      totalEvents: total,
      totalSessions: sessions,
      eventTypeCounts,
      toolFrequency: toolRows,
      dailyVolume,
      timeRange:
        rangeRow.oldest !== null && rangeRow.newest !== null
          ? { oldest: rangeRow.oldest, newest: rangeRow.newest }
          : null,
    }
  } catch {
    return empty
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
