import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { requireLocalOrAuth } from '../../server/auth-middleware'
import {
  ensureGatewayProbed,
  getCapabilities,
} from '../../server/gateway-capabilities'
import { getMemory } from '../../server/hermes-api'
import { listMemoryFiles } from '../../server/memory-browser'

export const Route = createFileRoute('/api/memory')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!requireLocalOrAuth(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }

        await ensureGatewayProbed()
        if (!getCapabilities().memory) {
          // Hermes v0.19+ serves /api/memory from its separate dashboard
          // backend, not the api_server — degrade to the same local ~/.hermes
          // listing the Memory screen uses instead of 503ing (issue #23).
          return json({ ok: true, source: 'local', files: listMemoryFiles() })
        }

        try {
          return json(await getMemory())
        } catch (err) {
          return json(
            { error: err instanceof Error ? err.message : String(err) },
            { status: 500 },
          )
        }
      },
    },
  },
})
