/**
 * GET /api/provider-usage
 *
 * Fetches provider usage and rate limit data from the Hermes backend's /api/usage
 * endpoint (rate limit header capture added in Hermes v0.9.0) and maps it into
 * the ProviderUsageEntry format consumed by the usage meter components.
 */
import { createFileRoute } from '@tanstack/react-router'
import {
  HERMES_API,
  BEARER_TOKEN,
} from '../../server/gateway-capabilities'
import { isAuthenticated } from '../../server/auth-middleware'

type UsageLine = {
  type: 'progress' | 'text' | 'badge'
  label: string
  used?: number
  limit?: number
  format?: 'percent' | 'dollars' | 'tokens'
  value?: string
  color?: string
  resetsAt?: string
}

type ProviderUsageEntry = {
  provider: string
  displayName: string
  status: 'ok' | 'missing_credentials' | 'auth_expired' | 'error'
  message?: string
  plan?: string
  lines: Array<UsageLine>
  updatedAt: number
}

/** Rate-limit block as returned by Hermes /api/usage (v0.9.0+) */
type HermesRateLimit = {
  requests_remaining?: number | null
  requests_limit?: number | null
  requests_reset?: string | null
  tokens_remaining?: number | null
  tokens_limit?: number | null
  tokens_reset?: string | null
}

/** Single provider entry as returned by Hermes /api/usage */
type HermesProviderUsage = {
  provider?: string
  display_name?: string
  status?: string
  message?: string
  plan?: string
  rate_limit?: HermesRateLimit
  /** Aggregate today tokens */
  today?: {
    input_tokens?: number
    output_tokens?: number
    cost_usd?: number
  }
  updated_at?: number
}

/** Full /api/usage response — may be a single object or an array */
type HermesUsageResponse =
  | HermesProviderUsage
  | Array<HermesProviderUsage>
  | { providers?: Array<HermesProviderUsage> }

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  groq: 'Groq',
  ollama: 'Ollama',
  azure: 'Azure OpenAI',
  gemini: 'Google Gemini',
  mistral: 'Mistral',
  together: 'Together AI',
  perplexity: 'Perplexity',
  cohere: 'Cohere',
}

function displayName(provider: string, raw?: string): string {
  if (raw) return raw
  return PROVIDER_DISPLAY_NAMES[provider.toLowerCase()] ?? provider
}

/** Convert a Hermes reset string (e.g. "60s", "1m30s", ISO 8601) to an ISO string */
function normalizeResetTime(reset: string | null | undefined): string | undefined {
  if (!reset) return undefined
  // Already ISO 8601
  if (reset.includes('T') || reset.includes('-')) return reset
  // Duration string like "1m", "30s", "1m30s"
  const match = reset.match(/^(?:(\d+)m)?(?:(\d+)s)?$/)
  if (match) {
    const mins = parseInt(match[1] ?? '0', 10)
    const secs = parseInt(match[2] ?? '0', 10)
    const ms = (mins * 60 + secs) * 1000
    return new Date(Date.now() + ms).toISOString()
  }
  return undefined
}

function buildLines(entry: HermesProviderUsage): Array<UsageLine> {
  const lines: Array<UsageLine> = []
  const rl = entry.rate_limit

  if (rl) {
    if (
      typeof rl.requests_remaining === 'number' &&
      typeof rl.requests_limit === 'number' &&
      rl.requests_limit > 0
    ) {
      lines.push({
        type: 'progress',
        label: 'Requests remaining',
        used: rl.requests_limit - rl.requests_remaining,
        limit: rl.requests_limit,
        format: 'tokens',
        resetsAt: normalizeResetTime(rl.requests_reset),
      })
    }

    if (
      typeof rl.tokens_remaining === 'number' &&
      typeof rl.tokens_limit === 'number' &&
      rl.tokens_limit > 0
    ) {
      lines.push({
        type: 'progress',
        label: 'Tokens remaining',
        used: rl.tokens_limit - rl.tokens_remaining,
        limit: rl.tokens_limit,
        format: 'tokens',
        resetsAt: normalizeResetTime(rl.tokens_reset),
      })
    }
  }

  const today = entry.today
  if (today) {
    const totalTokens = (today.input_tokens ?? 0) + (today.output_tokens ?? 0)
    if (totalTokens > 0) {
      lines.push({
        type: 'text',
        label: 'Tokens today',
        value: `${totalTokens.toLocaleString()}`,
      })
    }
    if (typeof today.cost_usd === 'number' && today.cost_usd > 0) {
      lines.push({
        type: 'text',
        label: 'Cost today',
        value: `$${today.cost_usd.toFixed(4)}`,
      })
    }
  }

  return lines
}

function mapEntry(entry: HermesProviderUsage): ProviderUsageEntry {
  const provider = entry.provider ?? 'unknown'
  const rawStatus = entry.status ?? 'ok'
  const status: ProviderUsageEntry['status'] =
    rawStatus === 'ok' ||
    rawStatus === 'missing_credentials' ||
    rawStatus === 'auth_expired' ||
    rawStatus === 'error'
      ? rawStatus
      : 'ok'

  return {
    provider,
    displayName: displayName(provider, entry.display_name),
    status,
    message: entry.message,
    plan: entry.plan,
    lines: buildLines(entry),
    updatedAt: entry.updated_at ? entry.updated_at * 1000 : Date.now(),
  }
}

async function fetchProviderUsage(force: boolean): Promise<Array<ProviderUsageEntry>> {
  const authHeaders: Record<string, string> = BEARER_TOKEN
    ? { Authorization: `Bearer ${BEARER_TOKEN}` }
    : {}

  const url = `${HERMES_API}/api/usage${force ? '?force=1' : ''}`
  const res = await fetch(url, { headers: authHeaders })
  if (!res.ok) return []

  const raw = (await res.json().catch(() => null)) as HermesUsageResponse | null
  if (!raw) return []

  // Handle array response
  if (Array.isArray(raw)) return raw.map(mapEntry)

  // Handle { providers: [...] } envelope
  const withProviders = raw as { providers?: Array<HermesProviderUsage> }
  if (Array.isArray(withProviders.providers)) {
    return withProviders.providers.map(mapEntry)
  }

  // Handle single-provider object
  const single = raw as HermesProviderUsage
  if (single.provider) return [mapEntry(single)]

  return []
}

export const Route = createFileRoute('/api/provider-usage')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }

        const url = new URL(request.url)
        const force = url.searchParams.get('force') === '1'

        try {
          const providers = await fetchProviderUsage(force)
          return Response.json({ ok: true, providers })
        } catch {
          return Response.json({ ok: true, providers: [] })
        }
      },
    },
  },
})
