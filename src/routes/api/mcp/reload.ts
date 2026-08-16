import { createFileRoute } from '@tanstack/react-router'
import { isAuthenticated } from '../../../server/auth-middleware'
import {
  HERMES_API,
  ensureGatewayProbed,
  getAuthHeaders,
} from '../../../server/gateway-capabilities'

const RELOAD_PATHS = ['/api/reload-mcp', '/api/mcp/reload']

export const Route = createFileRoute('/api/mcp/reload')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // isAuthenticated returns a boolean, never a Response. Casting it to
        // `Response | true` and returning it handed `false` to the router,
        // which answered an unauthenticated request with a 500 HTTPError
        // instead of a 401.
        if (!isAuthenticated(request)) {
          return Response.json(
            { ok: false, error: 'Unauthorized' },
            { status: 401 },
          )
        }

        // Resolve the gateway key before using it: on a cold first request the
        // token is still the unrefined candidate.
        await ensureGatewayProbed()

        for (const path of RELOAD_PATHS) {
          try {
            const response = await fetch(`${HERMES_API}${path}`, {
              method: 'POST',
              headers: getAuthHeaders(),
            })

            if (response.ok) {
              return Response.json({
                ok: true,
                message: 'MCP server reload requested.',
              })
            }
          } catch {
            // Try the next candidate endpoint.
          }
        }

        return Response.json({
          ok: false,
          message: 'Use /reload-mcp in chat to reload MCP servers.',
        })
      },
    },
  },
})
