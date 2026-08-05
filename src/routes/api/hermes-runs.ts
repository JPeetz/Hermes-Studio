/**
 * Runs API proxy — forwards POST /v1/runs to Hermes gateway.
 * Returns { run_id, status: "started" } immediately (202).
 */
import { createFileRoute } from '@tanstack/react-router'
import { isAuthenticated } from '../../server/auth-middleware'
import {
  BEARER_TOKEN,
  HERMES_API,
  ensureGatewayProbed,
  getCapabilities,
} from '../../server/gateway-capabilities'

// Forward HERMES_API_TOKEN to the gateway so requests aren't rejected with 401
// when API_SERVER_KEY is configured. See issue #17.
const authHeaders = (): Record<string, string> =>
  BEARER_TOKEN ? { Authorization: `Bearer ${BEARER_TOKEN}` } : {}

export const Route = createFileRoute('/api/hermes-runs')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        await ensureGatewayProbed()
        if (!getCapabilities().jobs) {
          return new Response(
            JSON.stringify({
              error: 'Runs API not available — gateway not connected',
            }),
            { status: 503, headers: { 'Content-Type': 'application/json' } },
          )
        }
        const body = await request.text()
        const res = await fetch(`${HERMES_API}/v1/runs`, {
          method: 'POST',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body,
        })
        return new Response(await res.text(), {
          status: res.status,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
