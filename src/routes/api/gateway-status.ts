import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../server/auth-middleware'
import {
  HERMES_API,
  HERMES_DASHBOARD_URL,
  ensureGatewayProbed,
  getCapabilities,
  getCapabilitySources,
  isDashboardConfigured,
  isDashboardUnauthorized,
} from '../../server/gateway-capabilities'

export const Route = createFileRoute('/api/gateway-status')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ error: 'Unauthorized' }, { status: 401 })
        }

        const capabilities = await ensureGatewayProbed()
        return json({
          capabilities,
          hermesUrl: HERMES_API,
          // Where each split capability was found (Hermes v0.19 moved them to
          // the agent's dashboard backend — issue #23).
          capabilitySources: getCapabilitySources(),
          dashboard: {
            configured: isDashboardConfigured(),
            unauthorized: isDashboardUnauthorized(),
            url: HERMES_DASHBOARD_URL || null,
          },
        })
      },
    },
  },
})
