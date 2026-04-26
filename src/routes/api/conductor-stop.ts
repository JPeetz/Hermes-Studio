/**
 * Conductor mission stop — kills worker session keys.
 */
import { createFileRoute } from '@tanstack/react-router'
import { isAuthenticated } from '../../server/auth-middleware'
import { requireJsonContentType } from '../../server/rate-limit'
import { deleteSession } from '../../server/hermes-api'
import { ensureGatewayProbed } from '../../server/gateway-capabilities'

export const Route = createFileRoute('/api/conductor-stop')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        const csrfCheck = requireJsonContentType(request)
        if (csrfCheck) return csrfCheck

        try {
          await ensureGatewayProbed()
          const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
          const sessionKeys = Array.isArray(body.sessionKeys)
            ? body.sessionKeys.filter(
                (value): value is string =>
                  typeof value === 'string' && value.trim().length > 0,
              )
            : []

          let deleted = 0
          for (const sessionKey of sessionKeys) {
            try {
              await deleteSession(sessionKey)
              deleted += 1
            } catch {
              // Ignore per-session delete errors so one bad key doesn't block the rest.
            }
          }

          return new Response(
            JSON.stringify({ ok: true, deleted }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        } catch (error) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: error instanceof Error ? error.message : String(error),
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          )
        }
      },
    },
  },
})
