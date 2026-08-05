/**
 * POST /api/approvals/:approvalId/deny
 *
 * Denies a pending dangerous-command execution request.
 * Mirror of approvals.$approvalId.approve.ts — sends "/deny" to the session.
 */

import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../server/auth-middleware'
import { requireJsonContentType } from '../../server/rate-limit'
import {
  ensureGatewayProbed,
  getGatewayCapabilities,
  sendChat,
  HERMES_API,
} from '../../server/hermes-api'
import { BEARER_TOKEN } from '../../server/gateway-capabilities'

// Forward HERMES_API_TOKEN to the gateway so requests aren't rejected with 401
// when API_SERVER_KEY is configured. See issue #17.
const authHeaders = (): Record<string, string> =>
  BEARER_TOKEN ? { Authorization: `Bearer ${BEARER_TOKEN}` } : {}

export const Route = createFileRoute('/api/approvals/$approvalId/deny')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const csrfCheck = requireJsonContentType(request)
        if (csrfCheck) return csrfCheck

        const { approvalId } = params
        await ensureGatewayProbed()

        const colonIdx = approvalId.indexOf(':')
        const sessionKey = colonIdx > 0 ? approvalId.slice(0, colonIdx) : 'main'

        // Strategy 1: gateway native endpoint
        const caps = getGatewayCapabilities()
        if (caps.sessions) {
          try {
            const res = await fetch(
              `${HERMES_API}/api/sessions/${sessionKey}/deny`,
              {
                method: 'POST',
                headers: {
                  ...authHeaders(),
                  'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(5_000),
              },
            )
            if (res.ok) {
              return json({ ok: true, method: 'gateway-endpoint' })
            }
          } catch {
            // fall through
          }
        }

        // Strategy 2: chat command
        try {
          await sendChat(sessionKey, { message: '/deny' })
          return json({ ok: true, method: 'chat-command' })
        } catch (err) {
          return json(
            {
              ok: false,
              error:
                err instanceof Error ? err.message : 'Failed to send denial',
            },
            { status: 500 },
          )
        }
      },
    },
  },
})
