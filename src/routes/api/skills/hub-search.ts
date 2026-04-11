import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../server/auth-middleware'
import { BEARER_TOKEN, HERMES_API } from '../../../server/gateway-capabilities'

export type HubSkillSource = 'skills-sh' | 'installed-fallback'

export type HubSkill = {
  id: string
  name: string
  description: string
  author: string
  category: string
  tags: Array<string>
  downloads?: number
  stars?: number
  source: HubSkillSource
  installCommand?: string
  homepage?: string
  installed: boolean
  /** Full GitHub repo path for the skill directory (used by install handler) */
  githubPath?: string
}

// ── In-memory cache for the skills.sh GitHub tree ──────────────────────────

type TreeEntry = { path: string; type: string }

let treeCache: { entries: TreeEntry[]; fetchedAt: number } | null = null
const TREE_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

// ── Helpers ─────────────────────────────────────────────────────────────────

function githubHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

function hermesAuthHeaders(): Record<string, string> {
  return BEARER_TOKEN ? { Authorization: `Bearer ${BEARER_TOKEN}` } : {}
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {}
}

function readString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function slugToTitle(slug: string): string {
  return slug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── GitHub tree fetch (cached) ───────────────────────────────────────────────

async function getSkillsShTree(): Promise<TreeEntry[]> {
  const now = Date.now()
  if (treeCache && now - treeCache.fetchedAt < TREE_CACHE_TTL_MS) {
    return treeCache.entries
  }
  const res = await fetch(
    'https://api.github.com/repos/vercel-labs/skills/git/trees/main?recursive=1',
    { headers: githubHeaders(), signal: AbortSignal.timeout(10_000) },
  )
  if (!res.ok) throw new Error(`GitHub API returned ${res.status}`)
  const data = asRecord(await res.json())
  const tree = Array.isArray(data.tree) ? (data.tree as unknown[]) : []
  const entries: TreeEntry[] = tree
    .map((e) => asRecord(e))
    .filter((e) => readString(e.path) && readString(e.type))
    .map((e) => ({ path: readString(e.path), type: readString(e.type) }))
  treeCache = { entries, fetchedAt: now }
  return entries
}

// ── skills.sh search ─────────────────────────────────────────────────────────

/**
 * Search the vercel-labs/skills GitHub repo by filtering SKILL.md paths.
 * No individual file fetches needed — name and category are derived from the path.
 * raw.githubusercontent.com is used only at install time.
 */
async function searchSkillsDotSh(
  query: string,
  limit: number,
  installedIds: Set<string>,
): Promise<HubSkill[]> {
  const tree = await getSkillsShTree()

  // Collect all SKILL.md blob entries
  const skillFiles = tree.filter(
    (e) => e.type === 'blob' && e.path.endsWith('SKILL.md'),
  )

  // Filter by query against the full path (contains category + slug)
  const q = query.trim().toLowerCase()
  const matching = q
    ? skillFiles.filter((e) => e.path.toLowerCase().includes(q))
    : skillFiles

  const results: HubSkill[] = []

  for (const file of matching) {
    if (results.length >= limit) break

    const parts = file.path.split('/')
    // Typical structure: "skills/<category>/<slug>/SKILL.md"
    // But we handle any depth: last segment is SKILL.md, second-last is slug dir,
    // third-last is category dir (or root).
    const dirParts = parts.slice(0, -1) // remove "SKILL.md"
    const slug = dirParts[dirParts.length - 1] ?? 'unknown'
    const categorySlug = dirParts.length >= 2 ? dirParts[dirParts.length - 2] : 'general'

    // Local install path: strip the leading "skills" segment if present
    const localId =
      dirParts[0] === 'skills' ? dirParts.slice(1).join('/') : dirParts.join('/')

    // Full GitHub directory path (for install handler)
    const githubPath = dirParts.join('/')

    const category = slugToTitle(
      categorySlug === 'skills' ? 'general' : categorySlug,
    )

    results.push({
      id: localId || slug,
      name: slugToTitle(slug),
      description: '',
      author: 'skills.sh',
      category,
      tags: [categorySlug],
      source: 'skills-sh',
      homepage: `https://skills.sh`,
      installed: installedIds.has((localId || slug).toLowerCase()),
      githubPath,
    })
  }

  return results
}

// ── Installed IDs from Hermes gateway ────────────────────────────────────────

async function fetchInstalledIds(): Promise<Set<string>> {
  try {
    const res = await fetch(`${HERMES_API}/api/skills`, {
      headers: hermesAuthHeaders(),
      signal: AbortSignal.timeout(5_000),
    })
    if (!res.ok) return new Set()
    const data = asRecord(await res.json())
    const items = Array.isArray(data.skills)
      ? (data.skills as unknown[])
      : Array.isArray(data)
        ? (data as unknown[])
        : []
    return new Set(
      items
        .map((e) => {
          const r = asRecord(e)
          return (readString(r.id) || readString(r.slug)).toLowerCase()
        })
        .filter(Boolean),
    )
  } catch {
    return new Set()
  }
}

// ── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/api/skills/hub-search')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        try {
          const url = new URL(request.url)
          const query = (url.searchParams.get('q') || '').trim()
          const limit = Math.min(
            50,
            Math.max(1, Number(url.searchParams.get('limit') || '20')),
          )

          if (!query) return json({ results: [], source: 'idle' })

          // Fetch installed IDs and search in parallel
          const [installedIds, results] = await Promise.all([
            fetchInstalledIds(),
            searchSkillsDotSh(query, limit, new Set()),
          ])

          // Annotate installed status
          const enriched = results.map((skill) => ({
            ...skill,
            installed: installedIds.has(skill.id.toLowerCase()),
          }))

          return json({
            results: enriched,
            source: enriched.length > 0 ? 'skills-sh' : 'empty',
          })
        } catch (error) {
          return json(
            {
              ok: false,
              error:
                error instanceof Error ? error.message : 'Search failed',
              results: [],
              source: 'error',
            },
            { status: 500 },
          )
        }
      },
    },
  },
})
