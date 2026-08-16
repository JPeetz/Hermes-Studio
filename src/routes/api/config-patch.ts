/**
 * Write `~/.hermes/config.yaml` for the settings screens.
 *
 * Accepts either body shape the UI already sends (both previously hit a route
 * that never existed — issue #23):
 *   { path: "agents.defaults.model.primary", value }  — dot-path set/delete
 *   { raw: "<JSON object string>", reason? }          — deep-merge a patch
 * Local filesystem only; no gateway involved.
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../server/auth-middleware'
import { requireJsonContentType } from '../../server/rate-limit'
import {
  deepMerge,
  readConfig,
  setConfigPath,
  writeConfig,
} from '../../server/config-file'

export const Route = createFileRoute('/api/config-patch')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const contentTypeError = requireJsonContentType(request)
        if (contentTypeError) return contentTypeError

        const body = (await request.json().catch(() => null)) as {
          path?: unknown
          value?: unknown
          raw?: unknown
        } | null
        if (!body) {
          return json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
        }

        try {
          if (typeof body.path === 'string' && body.path.trim()) {
            const config = readConfig()
            setConfigPath(config, body.path.trim(), body.value)
            writeConfig(config)
            return json({ ok: true })
          }

          if (typeof body.raw === 'string') {
            const patch = JSON.parse(body.raw) as unknown
            if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
              return json(
                { ok: false, error: 'raw must be a JSON object' },
                { status: 400 },
              )
            }
            const config = readConfig()
            deepMerge(config, patch as Record<string, unknown>)
            writeConfig(config)
            return json({ ok: true })
          }

          return json(
            { ok: false, error: 'Body must include "path" or "raw"' },
            { status: 400 },
          )
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
