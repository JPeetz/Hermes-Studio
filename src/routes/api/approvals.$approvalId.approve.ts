/**
 * POST /api/approvals/:approvalId/approve
 *
 * Approves a pending dangerous-command execution request.
 *
 * Strategy: the hermes gateway resolves approvals via chat message commands
 * (/approve, /deny). We send "/approve" as a chat message to the session.
 * The approvalId encodes the sessionKey as a prefix: "<sessionKey>:<id>".
 * If no session prefix is found we fall back to the "main" session.
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

export const Route = createFileRoute('/api/approvals/$approvalId/approve')({
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

        // Parse optional body for scope (once | session | always)
        let scope: string = 'once'
        try {
          const body = (await request.json().catch(() => ({}))) as Record<
            string,
            unknown
          >
          if (
            typeof body.scope === 'string' &&
            ['once', 'session', 'always'].includes(body.scope)
          ) {
            scope = body.scope
          }
        } catch {
          // body is optional
        }

        // Build the /approve command with optional scope suffix
        const approveCommand =
          scope === 'always'
            ? '/approve always'
            : scope === 'session'
              ? '/approve session'
              : '/approve'

        // The approvalId may encode sessionKey as "<sessionKey>:<uuid>"
        const colonIdx = approvalId.indexOf(':')
        const sessionKey = colonIdx > 0 ? approvalId.slice(0, colonIdx) : 'main'

        // Strategy 1: try the gateway's native approval endpoint first
        const caps = getGatewayCapabilities()
        if (caps.sessions) {
          try {
            const res = await fetch(
              `${HERMES_API}/api/sessions/${sessionKey}/approve`,
              {
                method: 'POST',
                headers: {
                  ...authHeaders(),
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ scope }),
                signal: AbortSignal.timeout(5_000),
              },
            )
            if (res.ok) {
              return json({ ok: true, method: 'gateway-endpoint' })
            }
          } catch {
            // fall through to chat-message strategy
          }
        }

        // Strategy 2: send the approval as a chat command to the session.
        // The gateway already handles /approve and /deny as special commands.
        try {
          await sendChat(sessionKey, { message: approveCommand })
          return json({ ok: true, method: 'chat-command' })
        } catch (err) {
          return json(
            {
              ok: false,
              error:
                err instanceof Error ? err.message : 'Failed to send approval',
            },
            { status: 500 },
          )
        }
      },
    },
  },
})
