/**
 * GET    /api/crews/:crewId           — get crew
 * PATCH  /api/crews/:crewId           — update crew (name, goal, status)
 * DELETE /api/crews/:crewId           — delete crew (does NOT delete sessions)
 * POST   /api/crews/:crewId/dispatch  — dispatch a task to one or all members
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../server/auth-middleware'
import { requireJsonContentType } from '../../../server/rate-limit'
import {
  getCrew,
  updateCrew,
  updateMemberStatus,
  deleteCrew,
} from '../../../server/crew-store'

export const Route = createFileRoute('/api/crews/$crewId')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const crew = getCrew(params.crewId)
        if (!crew) {
          return json({ ok: false, error: 'Crew not found' }, { status: 404 })
        }
        return json({ ok: true, crew })
      },

      PATCH: async ({ request, params }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const csrfCheck = requireJsonContentType(request)
        if (csrfCheck) return csrfCheck

        const body = (await request.json().catch(() => ({}))) as Record<
          string,
          unknown
        >

        const updates: Parameters<typeof updateCrew>[1] = {}
        if (typeof body.name === 'string') updates.name = body.name.trim()
        if (typeof body.goal === 'string') updates.goal = body.goal.trim()
        if (
          body.status === 'draft' ||
          body.status === 'active' ||
          body.status === 'paused' ||
          body.status === 'complete'
        ) {
          updates.status = body.status
        }

        // Member status update — used by frontend SSE observer
        if (
          typeof body.memberSessionKey === 'string' &&
          (body.memberStatus === 'idle' ||
            body.memberStatus === 'running' ||
            body.memberStatus === 'done' ||
            body.memberStatus === 'error')
        ) {
          updateMemberStatus(
            params.crewId,
            body.memberSessionKey,
            body.memberStatus,
            typeof body.lastActivity === 'string'
              ? body.lastActivity
              : undefined,
          )
        }

        const crew = updateCrew(params.crewId, updates)
        if (!crew) {
          return json({ ok: false, error: 'Crew not found' }, { status: 404 })
        }
        return json({ ok: true, crew })
      },

      DELETE: async ({ request, params }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const deleted = deleteCrew(params.crewId)
        if (!deleted) {
          return json({ ok: false, error: 'Crew not found' }, { status: 404 })
        }
        return json({ ok: true })
      },
    },
  },
})
