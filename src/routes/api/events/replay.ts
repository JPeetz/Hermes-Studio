/**
 * GET /api/events/replay?sessionKey=X&since=N[&limit=500]
 *
 * Returns a JSON array of stored events with seq > N for the given session.
 * Useful for one-shot catch-up when a client comes back after being offline
 * and wants to know what happened without opening an SSE stream.
 *
 * Also exposes the latest stored sequence number so clients can detect
 * whether they are behind without fetching the full event list.
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../server/auth-middleware'
import { getEventsSince, getLatestSeq } from '../../../server/event-store'

const MAX_LIMIT = 1_000

export const Route = createFileRoute('/api/events/replay')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }

        const url = new URL(request.url)
        const sessionKey = url.searchParams.get('sessionKey')?.trim()

        if (!sessionKey) {
          return json(
            { ok: false, error: 'sessionKey is required' },
            { status: 400 },
          )
        }

        const sinceParam = url.searchParams.get('since') ?? '0'
        const limitParam = url.searchParams.get('limit') ?? '500'

        const since = /^\d+$/.test(sinceParam) ? parseInt(sinceParam, 10) : 0
        const limit = Math.min(
          /^\d+$/.test(limitParam) ? parseInt(limitParam, 10) : 500,
          MAX_LIMIT,
        )

        const events = getEventsSince(sessionKey, since, limit)
        const latestSeq = getLatestSeq(sessionKey)

        return json({
          ok: true,
          sessionKey,
          since,
          latestSeq,
          count: events.length,
          events: events.map((ev) => ({
            seq: ev.seq,
            eventType: ev.eventType,
            runId: ev.runId,
            payload: ev.payload,
            ts: ev.ts,
          })),
        })
      },
    },
  },
})
