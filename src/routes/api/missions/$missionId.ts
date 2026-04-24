/**
 * GET    /api/missions/:missionId  — get mission with workers
 * DELETE /api/missions/:missionId  — delete completed/aborted mission
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../server/auth-middleware'
import { getMission, deleteMission } from '../../../server/mission-store'

export const Route = createFileRoute('/api/missions/$missionId')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const mission = getMission(params.missionId)
        if (!mission) {
          return json({ ok: false, error: 'Mission not found' }, { status: 404 })
        }
        return json({ ok: true, mission })
      },

      DELETE: async ({ request, params }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const deleted = deleteMission(params.missionId)
        if (!deleted) {
          return json({ ok: false, error: 'Mission not found' }, { status: 404 })
        }
        return json({ ok: true })
      },
    },
  },
})
