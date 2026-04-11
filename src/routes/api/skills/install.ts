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

// ── GitHub helpers ────────────────────────────────────────────────────────────

function githubHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {}
}

function readString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

/**
 * Download all files under a GitHub directory from vercel-labs/skills and
 * write them to the local skills directory.
 *
 * githubDirPath: e.g. "skills/web/fetch-url"
 * localInstallPath: e.g. "/home/user/.hermes/skills/web/fetch-url"
 */
async function installFromGitHub(
  githubDirPath: string,
  localInstallPath: string,
): Promise<void> {
  // Fetch the recursive tree for this repo
  const treeRes = await fetch(
    'https://api.github.com/repos/vercel-labs/skills/git/trees/main?recursive=1',
    { headers: githubHeaders(), signal: AbortSignal.timeout(10_000) },
  )
  if (!treeRes.ok) throw new Error(`GitHub tree API returned ${treeRes.status}`)
  const treeData = asRecord(await treeRes.json())
  const tree = Array.isArray(treeData.tree) ? (treeData.tree as unknown[]) : []

  // Find all blob files under the target directory
  const prefix = githubDirPath.endsWith('/') ? githubDirPath : `${githubDirPath}/`
  const skillFiles = tree
    .map((e) => asRecord(e))
    .filter(
      (e) =>
        readString(e.type) === 'blob' &&
        readString(e.path).startsWith(prefix),
    )

  if (skillFiles.length === 0) {
    throw new Error(
      `No files found under "${githubDirPath}" in vercel-labs/skills`,
    )
  }

  // Download all files in parallel
  await Promise.all(
    skillFiles.map(async (entry) => {
      const filePath = readString(entry.path)
      const relativePath = filePath.slice(prefix.length)
      const localFilePath = path.join(localInstallPath, ...relativePath.split('/'))

      const rawUrl = `https://raw.githubusercontent.com/vercel-labs/skills/main/${filePath}`
      const res = await fetch(rawUrl, { signal: AbortSignal.timeout(10_000) })
      if (!res.ok) throw new Error(`Failed to download ${filePath}: ${res.status}`)

      const content = await res.text()
      fs.mkdirSync(path.dirname(localFilePath), { recursive: true })
      fs.writeFileSync(localFilePath, content, 'utf8')
    }),
  )
}

// ── clawhub fallback ──────────────────────────────────────────────────────────

async function isBinaryAvailable(name: string): Promise<boolean> {
  try {
    await execFileAsync(
      process.platform === 'win32' ? 'where' : 'which',
      [name],
      { timeout: 3000 },
    )
    return true
  } catch {
    return false
  }
}

// ── Route ─────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/api/skills/install')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        try {
          const body = (await request.json()) as {
            skillId?: string
            source?: string
            githubPath?: string
          }
          const skillId = (body.skillId || '').trim()
          if (!skillId) {
            return json({ ok: false, error: 'skillId required' }, { status: 400 })
          }

          const source = (body.source || '').trim()
          const skillsBase = path.join(os.homedir(), '.hermes', 'skills')

          // ── Strategy 1: skills.sh — download directly from GitHub ──────────
          if (source === 'skills-sh') {
            // githubPath comes from the hub-search result (e.g. "skills/web/fetch-url")
            // Fall back to "skills/<skillId>" if not provided
            const githubPath =
              (body.githubPath || '').trim() ||
              `skills/${skillId}`

            // Validate no path traversal
            const localInstallPath = path.resolve(skillsBase, ...skillId.split('/').filter(Boolean))
            if (!localInstallPath.startsWith(skillsBase + path.sep) && localInstallPath !== skillsBase) {
              return json({ ok: false, error: 'Invalid skillId' }, { status: 400 })
            }

            await installFromGitHub(githubPath, localInstallPath)
            return json({ ok: true, installed: true, skillId, method: 'github' })
          }

          // ── Strategy 2: Hermes gateway native install ───────────────────────
          await ensureGatewayProbed()
          if (getCapabilities().skills) {
            try {
              const res = await fetch(`${HERMES_API}/api/skills/install`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skillId }),
                signal: AbortSignal.timeout(30_000),
              })
              if (res.ok) {
                return json({ ok: true, installed: true, skillId, method: 'gateway' })
              }
            } catch {
              // fall through to clawhub
            }
          }

          // ── Strategy 3: clawhub CLI ─────────────────────────────────────────
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

          // ── Strategy 4: nothing available ──────────────────────────────────
          return json(
            {
              ok: false,
              error: 'No install method available. Try searching from the Skills Browser.',
            },
            { status: 503 },
          )
        } catch (error) {
          return json(
            {
              ok: false,
              error:
                error instanceof Error ? error.message : 'Failed to install skill',
            },
            { status: 500 },
          )
        }
      },
    },
  },
})
