import { execFile } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../server/auth-middleware'
import {
  HERMES_API,
  ensureGatewayProbed,
  getCapabilities,
} from '../../../server/gateway-capabilities'

const execFileAsync = promisify(execFile)

/** Resolve the `clawhub` binary path. Checks PATH and common pip locations. */
function findClawhub(): string | null {
  const candidates = [
    'clawhub',
    path.join(os.homedir(), '.local', 'bin', 'clawhub'),
    path.join(os.homedir(), '.local', 'bin', 'clawhub.exe'),
    '/usr/local/bin/clawhub',
    '/usr/bin/clawhub',
  ]
  for (const candidate of candidates) {
    try {
      fs.accessSync(candidate.includes(path.sep) ? candidate : '/usr/bin/env', fs.constants.X_OK)
      return candidate
    } catch {
      // not found at this path
    }
  }
  return null
}

/** Check if a binary exists by running `which` / `where`. */
async function isBinaryAvailable(name: string): Promise<boolean> {
  try {
    await execFileAsync(process.platform === 'win32' ? 'where' : 'which', [name], {
      timeout: 3000,
    })
    return true
  } catch {
    return false
  }
}

export const Route = createFileRoute('/api/skills/install')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        try {
          const body = (await request.json()) as { skillId?: string; source?: string }
          const skillId = (body.skillId || '').trim()
          if (!skillId)
            return json(
              { ok: false, error: 'skillId required' },
              { status: 400 },
            )

          // Strategy 1: try the Hermes gateway's native skill install endpoint
          await ensureGatewayProbed()
          if (getCapabilities().skills) {
            try {
              const res = await fetch(
                `${HERMES_API}/api/skills/install`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ skillId }),
                  signal: AbortSignal.timeout(30_000),
                },
              )
              if (res.ok) {
                return json({ ok: true, installed: true, skillId, method: 'gateway' })
              }
            } catch {
              // fall through to clawhub
            }
          }

          // Strategy 2: use clawhub CLI
          const clawhubAvailable = await isBinaryAvailable('clawhub')
          if (clawhubAvailable) {
            const hermesHome = path.join(os.homedir(), '.hermes')
            await execFileAsync(
              'clawhub',
              ['install', skillId, '--workdir', hermesHome, '--dir', 'skills'],
              {
                cwd: os.homedir(),
                timeout: 120_000,
                maxBuffer: 1024 * 1024 * 4,
              },
            )
            return json({ ok: true, installed: true, skillId, method: 'clawhub' })
          }

          // Strategy 3: clawhub not found — return instructions
          const command = `clawhub install ${skillId} --workdir ~/.hermes --dir skills`
          return json(
            {
              ok: false,
              error:
                'clawhub CLI not found. Install it with: pip install skillhub',
              command,
              installClawhub: 'pip install skillhub',
            },
            { status: 503 },
          )
        } catch (error) {
          const body2 = await request
            .clone()
            .json()
            .catch(() => ({ skillId: '' })) as { skillId?: string }
          const command = `clawhub install ${body2.skillId || '<slug>'} --workdir ~/.hermes --dir skills`
          return json(
            {
              ok: false,
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to install skill',
              command,
            },
            { status: 500 },
          )
        }
      },
    },
  },
})
