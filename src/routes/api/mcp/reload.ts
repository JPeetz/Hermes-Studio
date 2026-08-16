import { createFileRoute } from '@tanstack/react-router'
import { isAuthenticated } from '../../../server/auth-middleware'
import { BEARER_TOKEN, HERMES_API } from '../../../server/gateway-capabilities'
import {
  getClientIp,
  rateLimit,
  rateLimitResponse,
  rejectCrossSiteMutation,
} from '../../../server/rate-limit'

type AuthResult = Response | true

function authHeaders(): Record<string, string> {
  return BEARER_TOKEN ? { Authorization: `Bearer ${BEARER_TOKEN}` } : {}
}

const RELOAD_PATHS = ['/api/reload-mcp', '/api/mcp/reload']

export const Route = createFileRoute('/api/mcp/reload')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const csrf = rejectCrossSiteMutation(request)
        if (csrf) return csrf
        // Rate limited: triggers an MCP reload on the agent.
        const ip = getClientIp(request)
        if (!rateLimit(`mcp-reload:${ip}`, 10, 60_000)) {
          return rateLimitResponse()
        }

        const authResult = isAuthenticated(request) as AuthResult
        if (authResult !== true) return authResult

        for (const path of RELOAD_PATHS) {
          try {
            const response = await fetch(`${HERMES_API}${path}`, {
              method: 'POST',
              headers: authHeaders(),
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
