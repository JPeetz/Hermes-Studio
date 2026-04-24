/**
 * POST /api/missions/:missionId/abort — abort a running mission
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../server/auth-middleware'
import { requireJsonContentType } from '../../../server/rate-limit'
import { abortMission, appendMissionEvent } from '../../../server/mission-store'
import { publishChatEvent } from '../../../server/chat-event-bus'

export const Route = createFileRoute('/api/missions/$missionId/abort')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const csrfCheck = requireJsonContentType(request)
        if (csrfCheck) return csrfCheck

        const mission = abortMission(params.missionId)
        if (!mission) {
          return json({ ok: false, error: 'Mission not found' }, { status: 404 })
        }

        appendMissionEvent(params.missionId, 'mission.aborted', { missionId: params.missionId })
        publishChatEvent('mission.aborted', { missionId: params.missionId })

        return json({ ok: true, mission })
      },
    },
  },
})
