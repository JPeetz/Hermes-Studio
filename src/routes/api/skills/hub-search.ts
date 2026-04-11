import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../server/auth-middleware'
import { BEARER_TOKEN, HERMES_API } from '../../../server/gateway-capabilities'
import { readSkillsSettings } from './settings'

export type HubSkillSource = 'skillsmp' | 'installed-fallback'

export type HubSkill = {
  id: string
  name: string
  description: string
  author: string
  category: string
  tags: Array<string>
  stars?: number
  source: HubSkillSource
  homepage?: string
  installed: boolean
  /** Full GitHub tree URL for downloading skill files */
  githubUrl?: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getSkillsmpKey(): string {
  // Env var takes precedence; fall back to user-configured key in settings file
  return process.env.SKILLSMP_API_KEY || readSkillsSettings().skillsmpApiKey || ''
}

function skillsmpHeaders(): HeadersInit {
  const key = getSkillsmpKey()
  if (!key) throw new Error('SKILLSMP_API_KEY not configured. Add your key in Settings → Integrations.')
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }
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

// ── skillsmp.com search ───────────────────────────────────────────────────────

type SkillsmpSkill = {
  id: string
  name: string
  author: string
  description: string
  githubUrl: string
  skillUrl: string
  stars: number
  updatedAt: string
}

function normalizeSkillsmpResult(
  raw: Record<string, unknown>,
  installedIds: Set<string>,
): HubSkill {
  const name = readString(raw.name)
  const author = readString(raw.author)
  // Local install ID: author/name
  const localId = `${author.toLowerCase()}/${name}`

  return {
    id: localId,
    name,
    author,
    description: readString(raw.description),
    category: 'Skills Hub',
    tags: [],
    stars: typeof raw.stars === 'number' ? raw.stars : undefined,
    source: 'skillsmp',
    homepage: readString(raw.skillUrl) || undefined,
    installed: installedIds.has(localId),
    githubUrl: readString(raw.githubUrl) || undefined,
  }
}

async function searchSkillsmp(
  query: string,
  limit: number,
  installedIds: Set<string>,
): Promise<HubSkill[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  })

  const res = await fetch(
    `https://skillsmp.com/api/v1/skills/search?${params}`,
    {
      headers: skillsmpHeaders(),
      signal: AbortSignal.timeout(10_000),
    },
  )

  if (!res.ok) {
    throw new Error(`skillsmp.com API returned ${res.status}`)
  }

  const body = asRecord(await res.json())
  const data = asRecord(body.data)
  const skills = Array.isArray(data.skills) ? (data.skills as unknown[]) : []

  return skills
    .map((s) => asRecord(s))
    .filter((s) => readString(s.name) && readString(s.author))
    .map((s) => normalizeSkillsmpResult(s, installedIds))
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

// ── Route ─────────────────────────────────────────────────────────────────────

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

          // Return early with a clear signal if no API key is configured
          if (!getSkillsmpKey()) {
            return json({ results: [], source: 'no-api-key' })
          }

          const [installedIds, results] = await Promise.all([
            fetchInstalledIds(),
            searchSkillsmp(query, limit, new Set()),
          ])

          const enriched = results.map((skill) => ({
            ...skill,
            installed: installedIds.has(skill.id.toLowerCase()),
          }))

          return json({
            results: enriched,
            source: enriched.length > 0 ? 'skillsmp' : 'empty',
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
