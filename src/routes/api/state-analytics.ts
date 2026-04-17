/**
 * GET /api/state-analytics
 *
 * Returns pre-aggregated analytics computed directly in SQLite from the
 * Studio event store (.runtime/events.db). All heavy lifting happens in
 * SQL (GROUP BY, json_extract, date()) — the server never loads raw payloads
 * into JS memory.
 *
 * Auth-gated. Falls back to empty-but-valid data when the event store is
 * unavailable (better-sqlite3 native binding not present).
 */
import { createFileRoute } from '@tanstack/react-router'
import { isAuthenticated } from '../../server/auth-middleware'
import { getAnalytics } from '../../server/event-store'

export type StateAnalyticsResponse = ReturnType<typeof getAnalytics> & {
  ok: boolean
}

export const Route = createFileRoute('/api/state-analytics')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return Response.json({ ok: false }, { status: 401 })
        }
        const analytics = getAnalytics()
        return Response.json({ ok: true, ...analytics })
      },
    },
  },
})
