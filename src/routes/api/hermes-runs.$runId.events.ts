/**
 * SSE proxy for /v1/runs/{runId}/events — pipes the Hermes gateway run event
 * stream directly to the browser client. Events include tool.started,
 * tool.completed, message.delta, run.completed, run.failed.
 */
import { createFileRoute } from '@tanstack/react-router'
import { isAuthenticated } from '../../server/auth-middleware'
import { HERMES_API } from '../../server/gateway-capabilities'

export const Route = createFileRoute('/api/hermes-runs/$runId/events')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        if (!isAuthenticated(request)) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        let upstream: Response
        try {
          upstream = await fetch(
            `${HERMES_API}/v1/runs/${params.runId}/events`,
          )
        } catch {
          return new Response(
            JSON.stringify({ error: 'Could not connect to gateway' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } },
          )
        }
        if (!upstream.ok) {
          return new Response(await upstream.text(), {
            status: upstream.status,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return new Response(upstream.body, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
          },
        })
      },
    },
  },
})
