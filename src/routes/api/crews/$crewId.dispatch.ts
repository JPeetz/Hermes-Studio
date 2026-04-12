/**
 * POST /api/crews/:crewId/dispatch
 *
 * Dispatches a task prompt to one or more crew members by POSTing to
 * /api/send-stream for each targeted session. The send-stream handler
 * runs the agent and emits events back to any SSE subscribers — the
 * crew detail UI picks these up via /api/chat-events automatically.
 *
 * Body:
 *   { task: string, target: 'all' | <memberId> }
 *
 * Response:
 *   { ok: true, dispatched: string[] }   — list of sessionKeys dispatched
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../server/auth-middleware'
import { requireJsonContentType } from '../../../server/rate-limit'
import {
  getCrew,
  updateCrew,
  updateMemberStatus,
} from '../../../server/crew-store'

export const Route = createFileRoute('/api/crews/$crewId/dispatch')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const csrfCheck = requireJsonContentType(request)
        if (csrfCheck) return csrfCheck

        const crew = getCrew(params.crewId)
        if (!crew) {
          return json({ ok: false, error: 'Crew not found' }, { status: 404 })
        }

        const body = (await request.json().catch(() => ({}))) as Record<
          string,
          unknown
        >

        const task = typeof body.task === 'string' ? body.task.trim() : ''
        if (!task) {
          return json({ ok: false, error: 'task is required' }, { status: 400 })
        }

        // Determine which members to target
        const target = body.target ?? 'all'
        const targets =
          target === 'all'
            ? crew.members
            : crew.members.filter((m) => m.id === target || m.sessionKey === target)

        if (targets.length === 0) {
          return json(
            { ok: false, error: 'no matching members found' },
            { status: 400 },
          )
        }

        const origin = new URL(request.url).origin

        // Mark crew as active and all targeted members as running
        updateCrew(params.crewId, { status: 'active' })
        for (const member of targets) {
          updateMemberStatus(params.crewId, member.sessionKey, 'running')
        }

        // Fire-and-forget — POST to send-stream for each target.
        // We don't await these because send-stream is a long-running SSE response.
        // The frontend subscribes to /api/chat-events and watches for run events.
        const dispatched: string[] = []
        for (const member of targets) {
          dispatched.push(member.sessionKey)
          // Non-streaming fire-and-forget to kick off the agent run
          void fetch(`${origin}/api/send-stream`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Forward auth cookie if present
              cookie: request.headers.get('cookie') ?? '',
            },
            body: JSON.stringify({
              message: task,
              sessionKey: member.sessionKey,
              model: member.model ?? undefined,
              stream: false,  // don't need the stream here — events flow via chat-event-bus
            }),
          }).catch(() => {
            // If send-stream fails, mark member as error
            updateMemberStatus(params.crewId, member.sessionKey, 'error')
          })
        }

        return json({ ok: true, dispatched, crewId: params.crewId })
      },
    },
  },
})
