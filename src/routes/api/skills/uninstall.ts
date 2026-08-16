import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../server/auth-middleware'
import {
  getClientIp,
  rateLimit,
  rateLimitResponse,
  rejectCrossSiteMutation,
} from '../../../server/rate-limit'

export const Route = createFileRoute('/api/skills/uninstall')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const csrf = rejectCrossSiteMutation(request)
        if (csrf) return csrf
        // Rate limited: deletes skill directories.
        const ip = getClientIp(request)
        if (!rateLimit(`skill-uninstall:${ip}`, 20, 60_000)) {
          return rateLimitResponse()
        }

        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        try {
          const body = (await request.json()) as { skillId?: string }
          const skillId = (body.skillId || '').trim()
          if (!skillId)
            return json(
              { ok: false, error: 'skillId required' },
              { status: 400 },
            )

          const skillsBase = path.join(os.homedir(), '.hermes', 'skills')
          const skillPath = path.join(skillsBase, skillId)

          // Path traversal guard — resolved path must be within skills dir
          if (!skillPath.startsWith(skillsBase + path.sep)) {
            return json(
              { ok: false, error: 'Invalid skillId' },
              { status: 400 },
            )
          }

          if (!fs.existsSync(skillPath)) {
            return json(
              {
                ok: false,
                error: 'Installed skill not found under ~/.hermes/skills',
              },
              { status: 404 },
            )
          }
          fs.rmSync(skillPath, { recursive: true, force: false })
          return json({ ok: true, uninstalled: true, skillId })
        } catch (error) {
          return json(
            {
              ok: false,
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to uninstall skill',
            },
            { status: 500 },
          )
        }
      },
    },
  },
})
