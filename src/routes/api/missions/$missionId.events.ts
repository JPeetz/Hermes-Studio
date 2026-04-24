/**
 * GET /api/missions/:missionId/events — get paginated mission event log
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../server/auth-middleware'
import { getMissionEvents } from '../../../server/mission-store'

export const Route = createFileRoute('/api/missions/$missionId/events')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }

        const url = new URL(request.url)

        const rawLimit = parseInt(url.searchParams.get('limit') ?? '50', 10)
        const limit = Number.isNaN(rawLimit) ? 50 : Math.min(Math.max(rawLimit, 1), 200)

        const rawOffset = parseInt(url.searchParams.get('offset') ?? '0', 10)
        const offset = Number.isNaN(rawOffset) ? 0 : Math.max(rawOffset, 0)

        const events = getMissionEvents(params.missionId, limit, offset)
        return json({ ok: true, events, limit, offset })
      },
    },
  },
})
