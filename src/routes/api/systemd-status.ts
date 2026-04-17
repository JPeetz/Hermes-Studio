/**
 * GET /api/systemd-status
 *
 * Returns the systemd user service status for hermes-studio.
 * Works on Linux with systemd; returns `available: false` on other platforms.
 */
import { createFileRoute } from '@tanstack/react-router'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { isAuthenticated } from '../../server/auth-middleware'

const execFileAsync = promisify(execFile)

const UNIT = 'hermes-studio'
const UNIT_PATH = join(
  homedir(),
  '.config',
  'systemd',
  'user',
  `${UNIT}.service`,
)

export interface SystemdStatusResponse {
  ok: boolean
  available: boolean
  installed: boolean
  active: boolean
  enabled: boolean
  output: string
}

async function runSystemctl(...args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync('systemctl', [
      '--user',
      ...args,
      '--no-pager',
    ])
    return stdout.trim()
  } catch (err: unknown) {
    const e = err as { stdout?: string }
    return (e.stdout ?? '').trim()
  }
}

export const Route = createFileRoute('/api/systemd-status')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return Response.json({ ok: false }, { status: 401 })
        }

        // Non-Linux or no systemctl → graceful degradation
        if (process.platform !== 'linux') {
          return Response.json({
            ok: true,
            available: false,
            installed: false,
            active: false,
            enabled: false,
            output: 'systemd not available on this platform',
          } satisfies SystemdStatusResponse)
        }

        const installed = existsSync(UNIT_PATH)

        if (!installed) {
          return Response.json({
            ok: true,
            available: true,
            installed: false,
            active: false,
            enabled: false,
            output: 'Service unit not installed.',
          } satisfies SystemdStatusResponse)
        }

        const [statusOut, isActiveOut, isEnabledOut] = await Promise.all([
          runSystemctl('status', UNIT),
          runSystemctl('is-active', UNIT),
          runSystemctl('is-enabled', UNIT),
        ])

        return Response.json({
          ok: true,
          available: true,
          installed: true,
          active: isActiveOut === 'active',
          enabled: isEnabledOut === 'enabled',
          output: statusOut,
        } satisfies SystemdStatusResponse)
      },
    },
  },
})
