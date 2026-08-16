/**
 * GET /api/audit — cross-session audit trail
 *
 * Query params:
 *   sessionKey  — filter to one session
 *   types       — comma-separated event types (default: tool,user_message,approval)
 *   since       — epoch ms lower bound
 *   until       — epoch ms upper bound
 *   limit       — max results (default 100, max 500)
 *   offset      — pagination offset
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import {
  getUserIdFromRequest,
  isAuthenticated,
} from '../../../server/auth-middleware'
import { queryAuditEvents } from '../../../server/event-store'
import { canSeeTaskEvent } from '../../../server/user-profiles'

const DEFAULT_TYPES = ['tool', 'user_message', 'approval']
const MAX_LIMIT = 500

export const Route = createFileRoute('/api/audit/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }

        const url = new URL(request.url)
        const sessionKey =
          url.searchParams.get('sessionKey')?.trim() || undefined

        const typesParam = url.searchParams.get('types')
        const eventTypes = typesParam
          ? typesParam
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : DEFAULT_TYPES

        const sinceParam = url.searchParams.get('since')
        const untilParam = url.searchParams.get('until')
        const limitParam = url.searchParams.get('limit') ?? '100'
        const offsetParam = url.searchParams.get('offset') ?? '0'

        const since =
          sinceParam && /^\d+$/.test(sinceParam)
            ? parseInt(sinceParam, 10)
            : undefined
        const until =
          untilParam && /^\d+$/.test(untilParam)
            ? parseInt(untilParam, 10)
            : undefined
        const limit = Math.min(
          /^\d+$/.test(limitParam) ? parseInt(limitParam, 10) : 100,
          MAX_LIMIT,
        )
        const offset = /^\d+$/.test(offsetParam) ? parseInt(offsetParam, 10) : 0

        const result = queryAuditEvents({
          sessionKey,
          eventTypes,
          since,
          until,
          limit,
          offset,
        })

        // Per-user task-event filtering (Issue #8 Phase 2) — task.* types are
        // queryable by any authenticated user, so drop foreign task events
        // for non-super admins. total still reflects the unfiltered count.
        const userId = getUserIdFromRequest(request)
        const visibleEvents = result.events.filter((ev) =>
          canSeeTaskEvent(userId, ev.eventType, ev.payload),
        )

        return json({
          ok: true,
          total: result.total,
          sessions: result.sessions,
          events: visibleEvents.map((ev) => ({
            seq: ev.seq,
            sessionKey: ev.sessionKey,
            runId: ev.runId,
            eventType: ev.eventType,
            payload: ev.payload,
            ts: ev.ts,
          })),
        })
      },
    },
  },
})
