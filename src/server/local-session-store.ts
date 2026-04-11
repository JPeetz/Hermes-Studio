import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { getRedisClient, getRedisClientSync } from './redis-client'

const DATA_DIR = join(process.cwd(), '.runtime')
const SESSIONS_FILE = join(DATA_DIR, 'local-sessions.json')
const MAX_MESSAGES_PER_SESSION = 500

// Redis key prefix
const REDIS_PREFIX = 'hermes:studio'

export type LocalSession = {
  id: string
  title: string | null
  model: string | null
  createdAt: number
  updatedAt: number
  messageCount: number
}

export type LocalMessage = {
  id: string
  role: string
  content: string
  timestamp: number
  toolCalls?: unknown
  toolCallId?: string
  toolName?: string
}

type StoreData = {
  sessions: Record<string, LocalSession>
  messages: Record<string, Array<LocalMessage>>
}

// ─── In-memory cache ────────────────────────────────────────────────────────

let store: StoreData = { sessions: {}, messages: {} }

// ─── File-based persistence ─────────────────────────────────────────────────

function loadFromDisk(): void {
  try {
    if (existsSync(SESSIONS_FILE)) {
      const raw = readFileSync(SESSIONS_FILE, 'utf-8')
      const parsed = JSON.parse(raw) as StoreData
      if (parsed.sessions && parsed.messages) {
        store = parsed
      }
    }
  } catch {
    // ignore corrupt local cache
  }
}

function saveToDisk(): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
    writeFileSync(SESSIONS_FILE, JSON.stringify(store, null, 2))
  } catch {
    // ignore cache write failures
  }
}

// ─── Redis backend (optional) ────────────────────────────────────────────────
// Activated when REDIS_URL env var is set. Falls back to file store silently.

async function loadFromRedis(client: import('ioredis').Redis): Promise<void> {
  try {
    const sessionKeys = await client.hkeys(`${REDIS_PREFIX}:sessions`)
    const sessions: Record<string, LocalSession> = {}
    const messages: Record<string, Array<LocalMessage>> = {}

    for (const sid of sessionKeys) {
      const raw = await client.hget(`${REDIS_PREFIX}:sessions`, sid)
      if (raw) {
        try {
          sessions[sid] = JSON.parse(raw) as LocalSession
        } catch {
          // skip corrupt entry
        }
      }
      const msgs = await client.lrange(`${REDIS_PREFIX}:messages:${sid}`, 0, -1)
      messages[sid] = msgs.flatMap((m) => {
        try {
          return [JSON.parse(m) as LocalMessage]
        } catch {
          return []
        }
      })
    }

    // Merge: prefer Redis data (more recent) over file data
    store = {
      sessions: { ...store.sessions, ...sessions },
      messages: { ...store.messages, ...messages },
    }
  } catch {
    // Redis load failed — stick with file data
  }
}

async function saveSessionToRedis(
  client: import('ioredis').Redis,
  session: LocalSession,
): Promise<void> {
  try {
    await client.hset(
      `${REDIS_PREFIX}:sessions`,
      session.id,
      JSON.stringify(session),
    )
    // 30-day TTL on the sessions hash key
    await client.expire(`${REDIS_PREFIX}:sessions`, 60 * 60 * 24 * 30)
  } catch {
    // ignore Redis write failures
  }
}

async function appendMessageToRedis(
  client: import('ioredis').Redis,
  sessionId: string,
  message: LocalMessage,
): Promise<void> {
  try {
    const key = `${REDIS_PREFIX}:messages:${sessionId}`
    await client.rpush(key, JSON.stringify(message))
    await client.ltrim(key, -MAX_MESSAGES_PER_SESSION, -1)
    await client.expire(key, 60 * 60 * 24 * 30)
  } catch {
    // ignore Redis write failures
  }
}

async function deleteSessionFromRedis(
  client: import('ioredis').Redis,
  sessionId: string,
): Promise<void> {
  try {
    await client.hdel(`${REDIS_PREFIX}:sessions`, sessionId)
    await client.del(`${REDIS_PREFIX}:messages:${sessionId}`)
  } catch {
    // ignore
  }
}

// Bootstrap: load from file immediately, then connect shared Redis client
loadFromDisk()
void getRedisClient().then((client) => {
  if (client) void loadFromRedis(client).then(() => {
    console.log('[session-store] Redis backend active')
  })
})

// ─── Deferred write scheduler ───────────────────────────────────────────────

let saveTimer: ReturnType<typeof setTimeout> | null = null

function scheduleSave(): void {
  if (saveTimer) return
  saveTimer = setTimeout(() => {
    saveTimer = null
    saveToDisk()
  }, 2000)
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function listLocalSessions(): Array<LocalSession> {
  return Object.values(store.sessions).sort((a, b) => b.updatedAt - a.updatedAt)
}

export function getLocalSession(sessionId: string): LocalSession | null {
  return store.sessions[sessionId] ?? null
}

export function ensureLocalSession(
  sessionId: string,
  model?: string,
): LocalSession {
  if (!store.sessions[sessionId]) {
    store.sessions[sessionId] = {
      id: sessionId,
      title: null,
      model: model ?? null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 0,
    }
    store.messages[sessionId] = []
    saveToDisk()
    if (getRedisClientSync()) void saveSessionToRedis(getRedisClientSync()!, store.sessions[sessionId])
  }
  return store.sessions[sessionId]
}

export function updateLocalSessionTitle(
  sessionId: string,
  title: string,
): void {
  const session = store.sessions[sessionId]
  if (session) {
    session.title = title
    session.updatedAt = Date.now()
    saveToDisk()
    if (getRedisClientSync()) void saveSessionToRedis(getRedisClientSync()!, session)
  }
}

export function touchLocalSession(sessionId: string): void {
  const session = store.sessions[sessionId]
  if (session) session.updatedAt = Date.now()
}

export function deleteLocalSession(sessionId: string): void {
  delete store.sessions[sessionId]
  delete store.messages[sessionId]
  saveToDisk()
  if (getRedisClientSync()) void deleteSessionFromRedis(getRedisClientSync()!, sessionId)
}

export function getLocalMessages(sessionId: string): Array<LocalMessage> {
  return store.messages[sessionId] ?? []
}

export function appendLocalMessage(
  sessionId: string,
  message: LocalMessage,
): void {
  ensureLocalSession(sessionId)
  if (!store.messages[sessionId]) store.messages[sessionId] = []
  store.messages[sessionId].push(message)
  if (store.messages[sessionId].length > MAX_MESSAGES_PER_SESSION) {
    store.messages[sessionId] = store.messages[sessionId].slice(
      -MAX_MESSAGES_PER_SESSION,
    )
  }
  const session = store.sessions[sessionId]
  if (session) {
    session.messageCount = store.messages[sessionId].length
    session.updatedAt = Date.now()
  }
  scheduleSave()
  if (getRedisClientSync()) void appendMessageToRedis(getRedisClientSync()!, sessionId, message)
}

// ─── Client-format adapters ──────────────────────────────────────────────────

/** Convert a LocalSession → the session summary format the frontend expects */
export function toLocalSessionSummary(
  session: LocalSession,
): Record<string, unknown> {
  return {
    key: session.id,
    friendlyId: session.id,
    kind: 'chat',
    status: 'idle',
    model: session.model || '',
    label: session.title || session.id,
    title: session.title || session.id,
    derivedTitle: session.title || session.id,
    tokenCount: 0,
    totalTokens: 0,
    message_count: session.messageCount,
    messageCount: session.messageCount,
    createdAt: new Date(session.createdAt).toISOString(),
    updatedAt: new Date(session.updatedAt).toISOString(),
    source: 'local',
  }
}

/** Convert a LocalMessage → the ChatMessage format the frontend expects */
export function toLocalChatMessage(
  msg: LocalMessage,
  index: number,
): Record<string, unknown> {
  const content: Array<Record<string, unknown>> = []

  if (msg.role === 'tool') {
    content.push({
      type: 'tool_result',
      toolCallId: msg.toolCallId,
      toolName: msg.toolName,
      text: msg.content || '',
    })
  } else {
    if (msg.content) {
      content.push({ type: 'text', text: msg.content })
    }
  }

  return {
    id: `local-${msg.id}`,
    role: msg.role,
    content,
    text: msg.content || '',
    timestamp: msg.timestamp,
    createdAt: new Date(msg.timestamp).toISOString(),
    __historyIndex: index,
    source: 'local',
  }
}
