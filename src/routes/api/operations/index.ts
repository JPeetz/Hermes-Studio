/**
 * GET /api/operations — aggregated agent overview across crews and missions
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../server/auth-middleware'
import { getOperationsOverview } from '../../../server/operations-aggregator'

export const Route = createFileRoute('/api/operations/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        return json({ ok: true, agents: getOperationsOverview() })
      },
    },
  },
})
