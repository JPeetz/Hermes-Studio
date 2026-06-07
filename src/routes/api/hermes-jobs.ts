/**
 * Jobs API proxy — forwards to Hermes FastAPI /api/jobs
 */
import { createFileRoute } from '@tanstack/react-router'
import { isAuthenticated } from '../../server/auth-middleware'
import {
  BEARER_TOKEN,
  HERMES_API,
  HERMES_UPGRADE_INSTRUCTIONS,
  ensureGatewayProbed,
  getCapabilities,
} from '../../server/gateway-capabilities'
import { createCapabilityUnavailablePayload } from '@/lib/feature-gates'

export const Route = createFileRoute('/api/hermes-jobs')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
          })
        }
        await ensureGatewayProbed()
        if (!getCapabilities().jobs) {
          return new Response(
            JSON.stringify({
              ...createCapabilityUnavailablePayload('jobs'),
              items: [],
              jobs: [],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }
        const url = new URL(request.url)
        const params = url.searchParams.toString()
        const target = `${HERMES_API}/api/jobs${params ? `?${params}` : ''}`
        // The Hermes gateway requires a bearer token; forward it so the
        // /api/jobs call doesn't bounce off a 401.
        const res = await fetch(target, {
          headers: BEARER_TOKEN
            ? { Authorization: `Bearer ${BEARER_TOKEN}` }
            : undefined,
        })
        return new Response(res.body, {
          status: res.status,
          headers: { 'Content-Type': 'application/json' },
        })
      },
      POST: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
          })
        }
        await ensureGatewayProbed()
        if (!getCapabilities().jobs) {
          return new Response(
            JSON.stringify({
              ...createCapabilityUnavailablePayload('jobs', {
                error: `Gateway does not support /api/jobs. ${HERMES_UPGRADE_INSTRUCTIONS}`,
              }),
            }),
            { status: 503, headers: { 'Content-Type': 'application/json' } },
          )
        }
        const body = await request.text()
        const res = await fetch(`${HERMES_API}/api/jobs`, {
          method: 'POST',
          headers: {
            ...(BEARER_TOKEN
              ? { Authorization: `Bearer ${BEARER_TOKEN}` }
              : {}),
            'Content-Type': 'application/json',
          },
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
