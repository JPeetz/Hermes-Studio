/**
 * Read `~/.hermes/config.yaml` for the settings screens.
 *
 * The Providers screen and the provider wizard have always fetched
 * `/api/config-get` and `/api/config-patch`, but neither route existed — they
 * 404'd unconditionally, on every agent version, for anyone who got past the
 * (also wrong) `config` capability gate. Local filesystem only; no gateway
 * involved, so this keeps working on Hermes Agent v0.19+ where `/api/config`
 * moved to the dashboard backend (issue #23).
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../server/auth-middleware'
import { readConfig } from '../../server/config-file'

export const Route = createFileRoute('/api/config-get')({
  server: {
    handlers: {
      GET: ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        try {
          return json({ ok: true, payload: readConfig() })
        } catch (err) {
          return json(
            {
              ok: false,
              error: err instanceof Error ? err.message : String(err),
            },
            { status: 500 },
          )
        }
      },
    },
  },
})
