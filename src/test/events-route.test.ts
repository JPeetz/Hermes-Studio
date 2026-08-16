import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Route } from '@/routes/api/events'
import {
  generateSessionToken,
  revokeSessionToken,
  storeSessionToken,
} from '@/server/auth-middleware'
import { publishChatEvent } from '@/server/chat-event-bus'
import { updateUserProfile } from '@/server/user-profiles'

// Suppress Redis interactions triggered on module load (same approach as
// auth-middleware.test.ts) and keep the event store off the filesystem —
// the bus only needs appendEvent, and `null` means "no seq available".
// vi.mock calls are hoisted above the imports at transform time.
vi.mock('@/server/redis-client', () => ({
  getRedisClient: () => Promise.resolve(null),
  getRedisClientSync: () => null,
}))

vi.mock('@/server/event-store', () => ({
  appendEvent: vi.fn(() => null),
}))

const GET = (
  Route.options as unknown as {
    server: {
      handlers: { GET: (ctx: { request: Request }) => Promise<Response> }
    }
  }
).server.handlers.GET

function makeRequest(cookie?: string): Request {
  const headers: Record<string, string> = {}
  if (cookie) headers['cookie'] = cookie
  return new Request('http://localhost/api/events', { headers })
}

const decoder = new TextDecoder()

/** Read the next SSE chunk, failing fast instead of hanging the test. */
async function nextChunk(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): Promise<string> {
  const result = await Promise.race([
    reader.read(),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('timed out waiting for SSE chunk')),
        1_000,
      ),
    ),
  ])
  return result.done ? '' : decoder.decode(result.value, { stream: true })
}

beforeEach(() => {
  delete process.env.HERMES_PASSWORD
  delete process.env.HERMES_USER_ID
})

afterEach(() => {
  delete process.env.HERMES_PASSWORD
  delete process.env.HERMES_USER_ID
})

/** Open an authenticated stream for `userId` and consume the connected event. */
async function openStream(userId: string) {
  const token = generateSessionToken()
  storeSessionToken(token, userId)
  const res = await GET({ request: makeRequest(`hermes-auth=${token}`) })
  expect(res.status).toBe(200)
  const reader = res.body!.getReader()
  expect(await nextChunk(reader)).toContain('event: connected')
  return {
    reader,
    close: async () => {
      await reader.cancel()
      revokeSessionToken(token)
    },
  }
}

describe('GET /api/events', () => {
  it('returns 401 when password protection is enabled and request is unauthenticated', async () => {
    process.env.HERMES_PASSWORD = 'secret'
    const res = await GET({ request: makeRequest() })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ ok: false, error: 'Unauthorized' })
  })

  it('returns 401 for an invalid session token', async () => {
    process.env.HERMES_PASSWORD = 'secret'
    const res = await GET({
      request: makeRequest('hermes-auth=not-a-real-token'),
    })
    expect(res.status).toBe(401)
  })

  it('streams a connected event for an authenticated session', async () => {
    process.env.HERMES_PASSWORD = 'secret'
    const stream = await openStream('user-connected')
    // openStream already asserted status 200 + the connected event
    await stream.close()
  })

  it('streams task events unfiltered in single-user mode (no password, no user)', async () => {
    const res = await GET({ request: makeRequest() })
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('text/event-stream')
    const reader = res.body!.getReader()
    expect(await nextChunk(reader)).toContain('event: connected')

    publishChatEvent('task.created', {
      sessionKey: 'all',
      taskId: 'task-single',
      title: 'Anyone sees this',
      createdBy: 'somebody-else',
    })
    const chunk = await nextChunk(reader)
    expect(chunk).toContain('event: task.created')
    expect(chunk).toContain('task-single')
    await reader.cancel()
  })

  it('hides other users’ task events from regular admins', async () => {
    process.env.HERMES_PASSWORD = 'secret'
    // Regular admin by default (no profile stored for this user)
    const stream = await openStream('regular-user')

    publishChatEvent('task.created', {
      sessionKey: 'all',
      taskId: 'task-other',
      title: 'Not yours',
      createdBy: 'someone-else',
    })
    // Marker event proves the filtered event was dropped rather than delayed:
    // non-task events pass through, so the next chunk must be the marker.
    publishChatEvent('marker', { sessionKey: 'all' })

    const chunk = await nextChunk(stream.reader)
    expect(chunk).toContain('event: marker')
    expect(chunk).not.toContain('task-other')
    await stream.close()
  })

  it('delivers a regular admin’s own task events', async () => {
    process.env.HERMES_PASSWORD = 'secret'
    const stream = await openStream('owner-user')

    publishChatEvent('task.moved', {
      sessionKey: 'all',
      taskId: 'task-mine',
      column: 'done',
      createdBy: 'owner-user',
    })
    const chunk = await nextChunk(stream.reader)
    expect(chunk).toContain('event: task.moved')
    expect(chunk).toContain('task-mine')
    await stream.close()
  })

  it('hides task events without createdBy from regular admins', async () => {
    process.env.HERMES_PASSWORD = 'secret'
    const stream = await openStream('regular-user-2')

    // Legacy/orphan events carry no createdBy — same invisibility as the
    // /api/tasks list filter gives orphan tasks for non-super-admins.
    publishChatEvent('task.deleted', {
      sessionKey: 'all',
      taskId: 'task-orphan',
    })
    publishChatEvent('marker', { sessionKey: 'all' })

    const chunk = await nextChunk(stream.reader)
    expect(chunk).toContain('event: marker')
    expect(chunk).not.toContain('task-orphan')
    await stream.close()
  })

  it('delivers all task events to super admins', async () => {
    process.env.HERMES_PASSWORD = 'secret'
    updateUserProfile('super-user', { role: 'super_admin' })
    const stream = await openStream('super-user')

    publishChatEvent('task.deleted', {
      sessionKey: 'all',
      taskId: 'task-any',
      createdBy: 'someone-else',
    })
    const chunk = await nextChunk(stream.reader)
    expect(chunk).toContain('event: task.deleted')
    expect(chunk).toContain('task-any')
    await stream.close()
  })
})
