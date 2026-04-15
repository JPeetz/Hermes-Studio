/**
 * Shared ioredis singleton.
 *
 * Only connects when REDIS_URL env var is explicitly set. Returns null if
 * REDIS_URL is absent or Redis is unreachable — all callers MUST handle null
 * gracefully so the server works fine without Redis.
 *
 * Docker note: set REDIS_URL=redis://redis:6379 in docker-compose.yml when
 * running the optional Redis service. Without REDIS_URL, no connection is
 * attempted — the file-based session store is used instead.
 */

let _client: import('ioredis').Redis | null = null
let _initPromise: Promise<import('ioredis').Redis | null> | null = null

export async function getRedisClient(): Promise<import('ioredis').Redis | null> {
  if (_client) return _client
  if (_initPromise) return _initPromise

  // Do NOT default to localhost — only connect when explicitly configured.
  // Defaulting caused Docker containers to stall: ioredis would attempt
  // to connect to a non-existent localhost Redis and retry indefinitely,
  // flooding the event loop and preventing the server from settling.
  const url = process.env.REDIS_URL
  if (!url) return null

  _initPromise = (async () => {
    let client: import('ioredis').Redis | null = null
    try {
      const { default: Redis } = await import('ioredis')
      client = new Redis(url, {
        lazyConnect: true,
        connectTimeout: 5_000,      // Docker DNS + container startup needs headroom
        maxRetriesPerRequest: 0,
        enableOfflineQueue: false,
        retryStrategy: () => null,  // fail fast — no background reconnect storm
      })
      await client.connect()
      await client.ping()
      _client = client

      // Handle unexpected disconnects gracefully after initial connect
      client.on('error', (err: Error) => {
        console.warn('[redis] Connection error:', err.message)
      })
      client.on('close', () => {
        console.log('[redis] Connection closed — sessions will use file store')
        _client = null
        _initPromise = null // allow reconnect attempt on next request
      })

      console.log(`[redis] Connected to ${url}`)
      return client
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`[redis] Could not connect to ${url} (${msg}) — using file store`)
      // Explicitly destroy the client to cancel any internal ioredis timers
      // that would otherwise keep the event loop alive after a failed connect.
      if (client) {
        try { client.disconnect() } catch { /* ignore */ }
      }
      _initPromise = null // allow retry on next startup
      return null
    }
  })()

  return _initPromise
}

/**
 * Synchronous accessor for the already-initialised client.
 * Returns null if Redis has not yet connected (or is unavailable).
 */
export function getRedisClientSync(): import('ioredis').Redis | null {
  return _client
}
