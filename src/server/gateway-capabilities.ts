/**
 * Probes the Hermes gateway to detect which API groups are available.
 * Results are cached and refreshed periodically so route handlers can
 * degrade cleanly against older Hermes gateways.
 *
 * Two-tier capability model:
 *   - Core: portable chat readiness (health, chat completions, models)
 *   - Enhanced: Hermes-native extras (sessions, skills, memory, config, jobs)
 */

import { gatewayKeyCandidates, resolveGatewayKey } from './gateway-key'

export let HERMES_API = process.env.HERMES_API_URL || 'http://127.0.0.1:8642'

export const HERMES_UPGRADE_INSTRUCTIONS =
  'Update Hermes: cd hermes-agent && git pull && pip install -e . && hermes --gateway'

export const SESSIONS_API_UNAVAILABLE_MESSAGE = `Your Hermes gateway does not support the sessions API. ${HERMES_UPGRADE_INSTRUCTIONS}`

const PROBE_TIMEOUT_MS = 3_000
const PROBE_TTL_MS = 120_000

// ── Types ─────────────────────────────────────────────────────────

export type CoreCapabilities = {
  health: boolean
  chatCompletions: boolean
  models: boolean
  streaming: boolean
  probed: boolean
}

export type EnhancedCapabilities = {
  sessions: boolean
  enhancedChat: boolean
  skills: boolean
  memory: boolean
  config: boolean
  jobs: boolean
}

/** Full capabilities — backward compat with existing code */
export type GatewayCapabilities = CoreCapabilities & EnhancedCapabilities

export type ChatMode = 'enhanced-hermes' | 'portable' | 'disconnected'

export type ConnectionStatus =
  | 'connected'
  | 'enhanced'
  | 'partial'
  | 'unauthorized'
  | 'disconnected'

// ── State ─────────────────────────────────────────────────────────

let capabilities: GatewayCapabilities = {
  health: false,
  chatCompletions: false,
  models: false,
  streaming: false,
  sessions: false,
  enhancedChat: false,
  skills: false,
  memory: false,
  config: false,
  jobs: false,
  probed: false,
}

let probePromise: Promise<GatewayCapabilities> | null = null
let lastProbeAt = 0
let lastLoggedSummary = ''

/**
 * Bearer token for authenticated gateway endpoints.
 *
 * Initialized synchronously from HERMES_API_TOKEN or the first
 * API_SERVER_KEY found in ~/.hermes/.env / ~/.hermes/profiles/<p>/.env,
 * then refined asynchronously during probeGateway(): candidates are tried
 * against /v1/models and the first accepted key wins. Live ESM binding —
 * all importers see the resolved value. NEVER log or return this value.
 */
// Guard: this module is (transitively) pulled into client bundles via
// hermes-api imports in a few screens. gatewayKeyCandidates() reads
// node:fs/os/path, which Vite externalizes for the browser — calling it
// there throws at module init and blanks every route in the chunk. Key
// discovery is meaningless in the browser anyway (requests go through
// Studio's own /api proxy), so only run it under Node.
const IS_NODE = typeof process !== 'undefined' && Boolean(process.versions?.node)

export let BEARER_TOKEN = IS_NODE ? (gatewayKeyCandidates()[0] ?? '') : ''

/** True when the gateway rejected every known key candidate with 401/403. */
let gatewayUnauthorized = false

export function isGatewayUnauthorized(): boolean {
  return gatewayUnauthorized
}

export function getAuthHeaders(): Record<string, string> {
  return BEARER_TOKEN ? { Authorization: `Bearer ${BEARER_TOKEN}` } : {}
}

// ── Hermes dashboard backend (optional second server) ─────────────
//
// Hermes Agent v0.19 moved /api/skills, /api/memory and /api/config off the
// messaging gateway's api_server onto the agent's own web dashboard backend
// (hermes_cli/web_server.py, default port 9119). That server authenticates
// with a per-process session token: start it with
// HERMES_DASHBOARD_SESSION_TOKEN=<secret> and give Studio the same value so
// both sides agree. Accepted as X-Hermes-Session-Token (preferred) or
// Authorization: Bearer. Server-only — the vite client transform rewrites
// unknown process.env.* to undefined, so neither value can reach the browser
// bundle. (Issue #23.)

export const HERMES_DASHBOARD_URL = IS_NODE
  ? (process.env.HERMES_DASHBOARD_URL ?? '').replace(/\/+$/, '')
  : ''

const DASHBOARD_TOKEN = IS_NODE
  ? (process.env.HERMES_DASHBOARD_TOKEN ??
    process.env.HERMES_DASHBOARD_SESSION_TOKEN ??
    '')
  : ''

/** True when the dashboard rejected our session token with 401. Kept separate
 *  from gatewayUnauthorized — a bad dashboard token must not flip the whole
 *  app's connection status. */
let dashboardUnauthorized = false

export function isDashboardConfigured(): boolean {
  return Boolean(HERMES_DASHBOARD_URL)
}

export function isDashboardUnauthorized(): boolean {
  return dashboardUnauthorized
}

export function getDashboardHeaders(): Record<string, string> {
  return DASHBOARD_TOKEN ? { 'X-Hermes-Session-Token': DASHBOARD_TOKEN } : {}
}

export type SplitCapability = 'skills' | 'memory' | 'config'

const capabilityTargets: Record<SplitCapability, 'gateway' | 'dashboard' | null> =
  {
    skills: null,
    memory: null,
    config: null,
  }

/** Which server each split capability was found on (null = neither). */
export function getCapabilitySources(): Record<
  SplitCapability,
  'gateway' | 'dashboard' | null
> {
  return { ...capabilityTargets }
}

/**
 * Where a split capability's data calls should go, or null when neither
 * server exposes it. Base has no trailing slash.
 */
export function getCapabilityTarget(
  cap: SplitCapability,
): { base: string; headers: Record<string, string> } | null {
  const target = capabilityTargets[cap]
  if (target === 'dashboard') {
    return { base: HERMES_DASHBOARD_URL, headers: getDashboardHeaders() }
  }
  if (target === 'gateway') {
    return { base: HERMES_API, headers: getAuthHeaders() }
  }
  return null
}

// ── Probing ───────────────────────────────────────────────────────

async function probe(path: string): Promise<boolean> {
  try {
    const res = await fetch(`${HERMES_API}${path}`, {
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    })
    // 404 = endpoint doesn't exist.
    // 403 = likely a catch-all rejection (e.g. Codex endpoint rejects unknown paths).
    // 401 = endpoint exists but our key is missing/invalid — tracked as a
    //       DISTINCT unauthorized state (gatewayUnauthorized), never silently
    //       treated as a healthy endpoint.
    // Only 2xx, 400, 405, 422 reliably indicate the endpoint exists.
    if (res.status === 401) {
      gatewayUnauthorized = true
      return true
    }
    if (res.status === 404 || res.status === 403) return false
    return true
  } catch {
    return false
  }
}

/**
 * The dashboard serves a single-page app, and its catch-all answers ANY unknown
 * path with `200 text/html` — verified against a live v0.19 dashboard, where
 * `/definitely-not-a-real-path` returns 200 HTML while the real `/api/*` routes
 * return JSON. A status-only check therefore reports every capability as
 * present on a dashboard whose routes have moved or whose URL is mistyped, and
 * then feeds HTML to JSON.parse at data-fetch time.
 *
 * Requiring JSON fails safe in the right direction: a real endpoint that
 * answers in some other content type is merely missed, and skills/memory/config
 * all degrade to their local ~/.hermes fallbacks.
 */
function isJsonResponse(res: Response): boolean {
  return (res.headers.get('content-type') ?? '').toLowerCase().includes('json')
}

/**
 * Probe one split capability (skills/memory/config). Prefers the dashboard
 * backend when HERMES_DASHBOARD_URL is set, falling back to the gateway path
 * for pre-v0.19 agents that still serve it there. Records where the
 * capability was found so data calls hit the same server. A dashboard 401
 * sets dashboardUnauthorized — never gatewayUnauthorized.
 */
async function probeSplitCapability(cap: SplitCapability): Promise<boolean> {
  const path = `/api/${cap}`

  if (HERMES_DASHBOARD_URL) {
    try {
      const res = await fetch(`${HERMES_DASHBOARD_URL}${path}`, {
        headers: getDashboardHeaders(),
        signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      })
      if (res.status === 401) {
        // Set-only. probeGateway() clears this once per cycle, so the flag
        // does not depend on which of the three concurrent probes lands last.
        dashboardUnauthorized = true
      } else if (
        res.status !== 404 &&
        res.status !== 403 &&
        isJsonResponse(res)
      ) {
        capabilityTargets[cap] = 'dashboard'
        return true
      }
    } catch {
      // fall through to the gateway probe
    }
  }

  const onGateway = await probe(path)
  capabilityTargets[cap] = onGateway ? 'gateway' : null
  return onGateway
}

/** Probe /v1/chat/completions to check if the endpoint exists.
 *  First tries a lightweight GET (405 = endpoint exists, just wrong method).
 *  This avoids creating real sessions on the gateway. */
async function probeChatCompletions(): Promise<boolean> {
  try {
    // Fast path: GET returns 405 Method Not Allowed = endpoint exists
    const getRes = await fetch(`${HERMES_API}/v1/chat/completions`, {
      method: 'GET',
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    })
    // 405 = endpoint exists but wrong method (expected for POST-only routes)
    if (getRes.status === 405) return true
    // 200 would be unusual but means it exists
    if (getRes.ok) return true
    // 400/422 = endpoint exists, just rejected the request shape
    if (getRes.status === 400 || getRes.status === 422) return true
    // 404 = endpoint doesn't exist on this server
    if (getRes.status === 404) return false
    // For other status codes, assume it exists
    return true
  } catch {
    return false
  }
}

// APIs that are optional and do not warrant an upgrade warning when absent.
// skills/memory/config are optional since Hermes v0.19 moved them off the
// api_server onto the agent's own dashboard backend — their absence is the
// NORMAL state on current agents, not a version-lag signal (issue #23).
const OPTIONAL_APIS = new Set([
  'jobs',
  'chatCompletions',
  'streaming',
  'skills',
  'memory',
  'config',
])

function logCapabilities(next: GatewayCapabilities): void {
  const core: Array<string> = []
  const enhanced: Array<string> = []
  const missing: Array<string> = []

  const coreKeys: Array<keyof CoreCapabilities> = [
    'health',
    'chatCompletions',
    'models',
    'streaming',
  ]
  const enhancedKeys: Array<keyof EnhancedCapabilities> = [
    'sessions',
    'enhancedChat',
    'skills',
    'memory',
    'config',
    'jobs',
  ]

  for (const key of coreKeys) {
    if (key === 'probed') continue
    ;(next[key] ? core : missing).push(key)
  }
  for (const key of enhancedKeys) {
    ;(next[key] ? enhanced : missing).push(key)
  }

  const mode = getChatMode()
  const summary = `[gateway] ${HERMES_API} mode=${mode} core=[${core.join(', ')}] enhanced=[${enhanced.join(', ')}] missing=[${missing.join(', ')}]`
  if (summary === lastLoggedSummary) return
  lastLoggedSummary = summary
  console.log(summary)

  // Only warn about critical missing APIs (not optional ones)
  const criticalMissing = missing.filter((key) => !OPTIONAL_APIS.has(key))
  if (criticalMissing.length > 0 && next.health) {
    console.warn(
      `[gateway] Missing Hermes APIs detected. ${HERMES_UPGRADE_INSTRUCTIONS}`,
    )
  }
}

export async function probeGateway(options?: {
  force?: boolean
}): Promise<GatewayCapabilities> {
  const force = options?.force === true
  if (!force && capabilities.probed) {
    return capabilities
  }
  if (probePromise) {
    return probePromise
  }

  probePromise = (async () => {
    // Auto-detect port if no explicit env var set
    if (!process.env.HERMES_API_URL) {
      const healthOn8642 = await probe('/health')
      if (!healthOn8642) {
        const fallback = 'http://127.0.0.1:8643'
        const healthOn8643 = await fetch(`${fallback}/health`, {
          signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
        })
          .then((r) => r.ok)
          .catch(() => false)
        if (healthOn8643) {
          HERMES_API = fallback
          console.log(`[gateway] Connected to Hermes at ${HERMES_API}`)
        } else {
          console.warn('[gateway] Could not reach Hermes on 8642 or 8643')
        }
      } else {
        console.log(`[gateway] Connected to Hermes at ${HERMES_API}`)
      }
    }

    // Resolve a working gateway key before probing authenticated endpoints.
    // Tries HERMES_API_TOKEN, then API_SERVER_KEY from ~/.hermes/.env and
    // every profile .env. Values are never logged.
    const keyResult = await resolveGatewayKey(HERMES_API, PROBE_TIMEOUT_MS)
    BEARER_TOKEN = keyResult.token
    gatewayUnauthorized = keyResult.unauthorized
    if (gatewayUnauthorized) {
      console.warn(
        '[gateway] All gateway key candidates were rejected (401). Set HERMES_API_TOKEN or ensure API_SERVER_KEY in ~/.hermes/.env matches the running gateway.',
      )
    }

    // Cleared once per cycle, then only ever set to true by the three
    // concurrent dashboard probes below. They previously also reset it to
    // false on success, so with skills 401ing and memory succeeding the final
    // value came down to which promise settled last.
    dashboardUnauthorized = false

    const [
      health,
      chatCompletions,
      models,
      sessions,
      enhancedChat,
      skills,
      memory,
      config,
      jobs,
    ] = await Promise.all([
      probe('/health'),
      probeChatCompletions(),
      probe('/v1/models'),
      probe('/api/sessions'),
      probe('/api/sessions/__probe__/chat/stream'),
      probeSplitCapability('skills'),
      probeSplitCapability('memory'),
      probeSplitCapability('config'),
      probe('/api/jobs'),
    ])

    capabilities = {
      // Core
      health,
      chatCompletions,
      models,
      streaming: chatCompletions, // If chat completions exists, streaming is supported
      probed: true,
      // Enhanced
      sessions,
      enhancedChat,
      skills,
      memory,
      config,
      jobs,
    }
    lastProbeAt = Date.now()
    logCapabilities(capabilities)
    return capabilities
  })()

  try {
    return await probePromise
  } finally {
    probePromise = null
  }
}

export async function ensureGatewayProbed(): Promise<GatewayCapabilities> {
  const isStale = Date.now() - lastProbeAt > PROBE_TTL_MS
  if (!capabilities.probed || isStale) {
    return probeGateway({ force: isStale })
  }
  return capabilities
}

// ── Accessors ─────────────────────────────────────────────────────

/** Full capabilities — backward compatible */
export function getCapabilities(): GatewayCapabilities {
  return capabilities
}

/** Core portable capabilities only */
export function getCoreCapabilities(): CoreCapabilities {
  return {
    health: capabilities.health,
    chatCompletions: capabilities.chatCompletions,
    models: capabilities.models,
    streaming: capabilities.streaming,
    probed: capabilities.probed,
  }
}

/** Hermes-native enhanced capabilities only */
export function getEnhancedCapabilities(): EnhancedCapabilities {
  return {
    sessions: capabilities.sessions,
    enhancedChat: capabilities.enhancedChat,
    skills: capabilities.skills,
    memory: capabilities.memory,
    config: capabilities.config,
    jobs: capabilities.jobs,
  }
}

/**
 * Current chat transport mode:
 * - 'enhanced-hermes': full Hermes session API available
 * - 'portable': OpenAI-compatible /v1/chat/completions available
 * - 'disconnected': no usable chat backend
 */
export function getChatMode(): ChatMode {
  if (capabilities.sessions && capabilities.enhancedChat)
    return 'enhanced-hermes'
  if (capabilities.chatCompletions || capabilities.health) return 'portable'
  return 'disconnected'
}

/**
 * Connection status for UI display:
 * - 'enhanced': full Hermes APIs detected
 * - 'connected': chat works
 * - 'partial': chat works, some advanced features unavailable
 * - 'disconnected': no backend
 */
export function getConnectionStatus(): ConnectionStatus {
  if (!capabilities.health && !capabilities.chatCompletions)
    return 'disconnected'
  if (gatewayUnauthorized) return 'unauthorized'
  // 'enhanced' = the Hermes-native session APIs work. skills/memory/config do
  // NOT gate this tier: Hermes v0.19 moved them to the agent's separate
  // dashboard server, so requiring them pinned every current agent at
  // 'partial' forever (issue #23). Studio's own panels for them are
  // filesystem-backed and keep working either way.
  const enhanced = capabilities.sessions && capabilities.enhancedChat
  if (enhanced) return 'enhanced'
  if (capabilities.chatCompletions || capabilities.sessions) return 'partial'
  return 'connected'
}

export function isHermesConnected(): boolean {
  return capabilities.health
}

void ensureGatewayProbed()
