import { createFileRoute } from '@tanstack/react-router'
import { isAuthenticated } from '../../../server/auth-middleware'
import { HERMES_API } from '../../../server/gateway-capabilities'
import { gatewayFetch } from '../../../server/gateway-session'

type AuthResult = Response | true

const RELOAD_PATHS = ['/api/reload-mcp', '/api/mcp/reload']

export const Route = createFileRoute('/api/mcp/reload')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authResult = isAuthenticated(request) as AuthResult
        if (authResult !== true) return authResult

        for (const path of RELOAD_PATHS) {
          try {
            const response = await gatewayFetch(`${HERMES_API}${path}`, {
              method: 'POST',
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
