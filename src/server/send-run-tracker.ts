import { getRedisClient, getRedisClientSync } from './redis-client'

const ACTIVE_RUNS_KEY = '__hermes_active_send_runs__' as const
const RUN_KEY_PREFIX = 'hermes:studio:run:'
const RUN_TTL_S = 10 * 60 // 10 minutes — max expected run duration

function getActiveRuns(): Set<string> {
  const globalValue = globalThis as typeof globalThis & {
    [ACTIVE_RUNS_KEY]?: Set<string>
  }
  if (!globalValue[ACTIVE_RUNS_KEY]) {
    globalValue[ACTIVE_RUNS_KEY] = new Set<string>()
  }
  return globalValue[ACTIVE_RUNS_KEY]
}

// On startup load any surviving run keys from Redis into the in-memory Set
// (TTL-expired keys are automatically absent — no stale entries).
void getRedisClient().then(async (client) => {
  if (!client) return
  try {
    const keys = await client.keys(`${RUN_KEY_PREFIX}*`)
    const runs = getActiveRuns()
    for (const key of keys) {
      const runId = key.slice(RUN_KEY_PREFIX.length)
      runs.add(runId)
    }
  } catch {
    // Redis unavailable — in-memory store continues
  }
})

export function registerActiveSendRun(runId: string): void {
  if (!runId) return
  getActiveRuns().add(runId)
  const client = getRedisClientSync()
  if (client) void client.set(`${RUN_KEY_PREFIX}${runId}`, '1', 'EX', RUN_TTL_S)
}

export function unregisterActiveSendRun(runId: string): void {
  if (!runId) return
  getActiveRuns().delete(runId)
  const client = getRedisClientSync()
  if (client) void client.del(`${RUN_KEY_PREFIX}${runId}`)
}

export function hasActiveSendRun(runId: string | null | undefined): boolean {
  if (!runId) return false
  return getActiveRuns().has(runId)
}
