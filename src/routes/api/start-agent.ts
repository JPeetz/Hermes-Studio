import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../server/auth-middleware'
import { startHermesAgent } from '../../server/hermes-agent'
import {
  getClientIp,
  rateLimit,
  rateLimitResponse,
  rejectCrossSiteMutation,
} from '../../server/rate-limit'

export const Route = createFileRoute('/api/start-agent')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const csrf = rejectCrossSiteMutation(request)
        if (csrf) return csrf
        // Rate limited: spawns the agent process.
        const ip = getClientIp(request)
        if (!rateLimit(`start-agent:${ip}`, 10, 60_000)) {
          return rateLimitResponse()
        }

        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }

        const result = await startHermesAgent()
        return json(result, { status: result.ok ? 200 : 500 })
      },
    },
  },
})
