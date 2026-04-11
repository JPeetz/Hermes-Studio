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

// ── GitHub download helpers ───────────────────────────────────────────────────

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
 * Parse a GitHub tree URL into its components.
 * e.g. https://github.com/owner/repo/tree/main/path/to/dir
 * → { owner, repo, branch, dirPath }
 */
function parseGithubUrl(githubUrl: string): {
  owner: string
  repo: string
  branch: string
  dirPath: string
} | null {
  try {
    const u = new URL(githubUrl)
    // pathname: /owner/repo/tree/branch/path/to/dir
    const parts = u.pathname.replace(/^\//, '').split('/')
    if (parts.length < 4 || parts[2] !== 'tree') return null
    const [owner, repo, , branch, ...rest] = parts
    return { owner, repo, branch, dirPath: rest.join('/') }
  } catch {
    return null
  }
}

/**
 * Download all files under a GitHub directory and write them to localInstallPath.
 */
async function installFromGithubUrl(
  githubUrl: string,
  localInstallPath: string,
): Promise<void> {
  const parsed = parseGithubUrl(githubUrl)
  if (!parsed) throw new Error(`Cannot parse GitHub URL: ${githubUrl}`)
  const { owner, repo, branch, dirPath } = parsed

  // Fetch recursive tree for the repo
  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers: githubHeaders(), signal: AbortSignal.timeout(12_000) },
  )
  if (!treeRes.ok) {
    throw new Error(`GitHub tree API returned ${treeRes.status} for ${owner}/${repo}`)
  }
  const treeData = asRecord(await treeRes.json())
  const tree = Array.isArray(treeData.tree) ? (treeData.tree as unknown[]) : []

  // Find all blob files under the skill directory
  const prefix = dirPath.endsWith('/') ? dirPath : `${dirPath}/`
  const skillFiles = tree
    .map((e) => asRecord(e))
    .filter(
      (e) =>
        readString(e.type) === 'blob' &&
        readString(e.path).startsWith(prefix),
    )

  // Also include the SKILL.md at the root of the dir (no trailing slash match)
  const rootFile = tree
    .map((e) => asRecord(e))
    .find(
      (e) =>
        readString(e.type) === 'blob' &&
        readString(e.path) === `${dirPath}/SKILL.md`,
    )
  if (rootFile && !skillFiles.includes(rootFile)) {
    skillFiles.push(rootFile)
  }

  if (skillFiles.length === 0) {
    // No files with prefix — try downloading SKILL.md directly
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${dirPath}/SKILL.md`
    const res = await fetch(rawUrl, { signal: AbortSignal.timeout(10_000) })
    if (!res.ok) throw new Error(`Skill not found at ${githubUrl}`)
    const content = await res.text()
    fs.mkdirSync(localInstallPath, { recursive: true })
    fs.writeFileSync(path.join(localInstallPath, 'SKILL.md'), content, 'utf8')
    return
  }

  // Download all files in parallel
  await Promise.all(
    skillFiles.map(async (entry) => {
      const filePath = readString(entry.path)
      const relativePath = filePath.startsWith(prefix)
        ? filePath.slice(prefix.length)
        : path.basename(filePath)
      const localFilePath = path.join(localInstallPath, ...relativePath.split('/'))

      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`
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
            githubUrl?: string
          }
          const skillId = (body.skillId || '').trim()
          if (!skillId) {
            return json({ ok: false, error: 'skillId required' }, { status: 400 })
          }

          const source = (body.source || '').trim()
          const skillsBase = path.join(os.homedir(), '.hermes', 'skills')

          // ── Strategy 1: skillsmp / skills-sh — download from GitHub ─────────
          if (source === 'skillsmp' || source === 'skills-sh') {
            const githubUrl = (body.githubUrl || '').trim()
            if (!githubUrl) {
              return json(
                { ok: false, error: 'githubUrl required for marketplace skills' },
                { status: 400 },
              )
            }

            // Validate local install path (no traversal)
            const localInstallPath = path.resolve(
              skillsBase,
              ...skillId.split('/').filter(Boolean),
            )
            if (
              !localInstallPath.startsWith(skillsBase + path.sep) &&
              localInstallPath !== skillsBase
            ) {
              return json({ ok: false, error: 'Invalid skillId' }, { status: 400 })
            }

            await installFromGithubUrl(githubUrl, localInstallPath)
            return json({ ok: true, installed: true, skillId, method: 'github' })
          }

          // ── Strategy 2: Hermes gateway native install ─────────────────────
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
              // fall through
            }
          }

          // ── Strategy 3: clawhub CLI ───────────────────────────────────────
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

          return json(
            { ok: false, error: 'No install method available.' },
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
