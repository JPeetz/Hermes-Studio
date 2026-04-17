/**
 * POST /api/systemd-control
 *
 * Runs a systemctl user-service action for hermes-studio.
 * Body: { action: 'install' | 'uninstall' | 'start' | 'stop' | 'enable' | 'disable' }
 */
import { createFileRoute } from '@tanstack/react-router'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'
import { isAuthenticated } from '../../server/auth-middleware'

const execFileAsync = promisify(execFile)

const UNIT = 'hermes-studio'
const UNIT_DIR = join(homedir(), '.config', 'systemd', 'user')
const UNIT_PATH = join(UNIT_DIR, `${UNIT}.service`)
const TEMPLATE_PATH = join(
  dirname(new URL(import.meta.url).pathname),
  '..',
  '..',
  '..',
  'scripts',
  'hermes-studio.service',
)
// Resolve install dir: go up three levels from src/routes/api/ → project root
const INSTALL_DIR = join(
  dirname(new URL(import.meta.url).pathname),
  '..',
  '..',
  '..',
)

type SystemdAction =
  | 'install'
  | 'uninstall'
  | 'start'
  | 'stop'
  | 'enable'
  | 'disable'

const ALLOWED_ACTIONS: Set<SystemdAction> = new Set([
  'install',
  'uninstall',
  'start',
  'stop',
  'enable',
  'disable',
])

async function runSystemctl(...args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync('systemctl', [
      '--user',
      ...args,
      '--no-pager',
    ])
    return stdout.trim()
  } catch (err: unknown) {
    const e = err as { stdout?: string; message?: string }
    return (e.stdout ?? e.message ?? '').trim()
  }
}

export const Route = createFileRoute('/api/systemd-control')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return Response.json({ ok: false }, { status: 401 })
        }

        if (process.platform !== 'linux') {
          return Response.json(
            { ok: false, error: 'systemd not available on this platform' },
            { status: 400 },
          )
        }

        const body = (await request.json()) as { action?: string }
        const action = body?.action as SystemdAction | undefined

        if (!action || !ALLOWED_ACTIONS.has(action)) {
          return Response.json(
            { ok: false, error: 'Invalid action' },
            { status: 400 },
          )
        }

        let output = ''

        if (action === 'install') {
          const template = await readFile(TEMPLATE_PATH, 'utf8')
          const unit = template.replaceAll('HERMES_INSTALL_DIR', INSTALL_DIR)
          await mkdir(UNIT_DIR, { recursive: true })
          await writeFile(UNIT_PATH, unit, 'utf8')
          await runSystemctl('daemon-reload')
          output = `Installed ${UNIT_PATH}`
        } else if (action === 'uninstall') {
          await runSystemctl('stop', UNIT)
          await runSystemctl('disable', UNIT)
          if (existsSync(UNIT_PATH)) await unlink(UNIT_PATH)
          await runSystemctl('daemon-reload')
          output = `Removed ${UNIT_PATH}`
        } else {
          output = await runSystemctl(action, UNIT)
        }

        return Response.json({ ok: true, output })
      },
    },
  },
})
