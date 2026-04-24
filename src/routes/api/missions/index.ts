/**
 * GET  /api/missions  — list all missions
 * POST /api/missions  — create a mission (requires goal)
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../server/auth-middleware'
import { requireJsonContentType } from '../../../server/rate-limit'
import { listMissions, createMission } from '../../../server/mission-store'

export const Route = createFileRoute('/api/missions/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        return json({ ok: true, missions: listMissions() })
      },

      POST: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const csrfCheck = requireJsonContentType(request)
        if (csrfCheck) return csrfCheck

        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

        const goal = typeof body.goal === 'string' ? body.goal.trim() : ''
        if (!goal) {
          return json({ ok: false, error: 'goal is required' }, { status: 400 })
        }

        const input: Parameters<typeof createMission>[0] = { goal }

        if (typeof body.templateId === 'string') {
          input.templateId = body.templateId
        }

        const mission = createMission(input)
        return json({ ok: true, mission }, { status: 201 })
      },
    },
  },
})
