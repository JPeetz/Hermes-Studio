/**
 * /api/skills/settings — read and write skills-specific configuration.
 * Persisted to ~/.hermes/skills/.studio-settings.json (server-side only).
 * The skillsmpApiKey is never returned in plaintext — only a masked preview.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../server/auth-middleware'

const SETTINGS_PATH = path.join(
  os.homedir(),
  '.hermes',
  'skills',
  '.studio-settings.json',
)

export type SkillsSettings = {
  skillsmpApiKey?: string
}

export function readSkillsSettings(): SkillsSettings {
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf8')
    return JSON.parse(raw) as SkillsSettings
  } catch {
    return {}
  }
}

function writeSkillsSettings(settings: SkillsSettings): void {
  fs.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true })
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf8')
}

function maskKey(key: string): string {
  if (key.length <= 8) return '••••••••'
  return key.slice(0, 12) + '••••••••' + key.slice(-4)
}

export const Route = createFileRoute('/api/skills/settings')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const stored = readSkillsSettings()
        // Prefer env var, fall back to stored file value
        const activeKey = process.env.SKILLSMP_API_KEY || stored.skillsmpApiKey || ''
        return json({
          ok: true,
          skillsmpApiKeySet: Boolean(activeKey),
          skillsmpApiKeyMasked: activeKey ? maskKey(activeKey) : '',
          /** True when the key comes from env (cannot be overridden from UI) */
          skillsmpApiKeyFromEnv: Boolean(process.env.SKILLSMP_API_KEY),
        })
      },

      PATCH: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        try {
          const body = (await request.json()) as { skillsmpApiKey?: string }
          const stored = readSkillsSettings()

          if (typeof body.skillsmpApiKey === 'string') {
            const trimmed = body.skillsmpApiKey.trim()
            if (trimmed) {
              stored.skillsmpApiKey = trimmed
            } else {
              delete stored.skillsmpApiKey
            }
          }

          writeSkillsSettings(stored)
          const activeKey =
            process.env.SKILLSMP_API_KEY || stored.skillsmpApiKey || ''
          return json({
            ok: true,
            skillsmpApiKeySet: Boolean(activeKey),
            skillsmpApiKeyMasked: activeKey ? maskKey(activeKey) : '',
            skillsmpApiKeyFromEnv: Boolean(process.env.SKILLSMP_API_KEY),
          })
        } catch (error) {
          return json(
            {
              ok: false,
              error:
                error instanceof Error ? error.message : 'Failed to save settings',
            },
            { status: 500 },
          )
        }
      },
    },
  },
})
