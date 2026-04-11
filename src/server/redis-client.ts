/**
 * Shared ioredis singleton.
 *
 * Lazily connects when REDIS_URL env var is present. Returns null if Redis
 * is unavailable — all callers MUST handle null gracefully so the server
 * works fine without Redis.
 */

let _client: import('ioredis').Redis | null = null
let _initPromise: Promise<import('ioredis').Redis | null> | null = null

export async function getRedisClient(): Promise<import('ioredis').Redis | null> {
  if (_client) return _client
  if (_initPromise) return _initPromise

  const url = process.env.REDIS_URL ?? 'redis://localhost:6379'

  _initPromise = (async () => {
    try {
      const { default: Redis } = await import('ioredis')
      const client = new Redis(url, {
        lazyConnect: true,
        connectTimeout: 3_000,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      })
      await client.connect()
      await client.ping()
      _client = client
      console.log('[redis] Connected')
      return client
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`[redis] Unavailable (${msg}) — using in-memory fallback`)
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
