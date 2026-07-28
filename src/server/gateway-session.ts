/**
 * Gateway session authentication (Fix B).
 *
 * When the Hermes gateway is bound to a non-loopback host (0.0.0.0), its
 * two-tier auth requires a **session cookie** for gated routes (chat,
 * sessions, models, …) — a bearer token alone is rejected with 401
 * `{"reason":"no_cookie"}`. The gateway only mints that cookie via an
 * explicit password login against the `basic` dashboard-auth provider.
 *
 * This module performs that login once, caches the resulting
 * `hermes_session_at` cookie, and replays it on every gateway request.
 * It is rate-limit aware (the gateway throttles password logins per IP)
 * and self-heals: a 401 invalidates the cache and re-logs in, with a
 * single in-flight de-dup so a burst of 401s triggers exactly one login.
 *
 * Credentials are read from the environment — never from arguments or
 * config files — so they never enter request/context logs:
 *   HERMES_DASHBOARD_USERNAME (default "admin")
 *   HERMES_DASHBOARD_PASSWORD (required for cookie auth; absent ⇒ bearer-only legacy path)
 *   HERMES_API_TOKEN          (attached as Authorization for token-gated routes)
 *
 * Cookie name and login endpoint are documented public contracts of the
 * Hermes dashboard-auth layer (cookies.py SESSION_AT_COOKIE, routes.py
 * POST /auth/password-login). Do not change them without consulting that
 * version's source: the names are stable across 0.19.x.
 */

const GATEWAY_BASE =
  process.env.HERMES_API_URL || 'http://127.0.0.1:8642'
const DASHBOARD_USERNAME = process.env.HERMES_DASHBOARD_USERNAME || 'admin'
const DASHBOARD_PASSWORD = process.env.HERMES_DASHBOARD_PASSWORD || ''
const BEARER_TOKEN = process.env.HERMES_API_TOKEN || ''

const LOGIN_TIMEOUT_MS = 5_000
// Gateway throttles password logins per IP. Never retry faster than this.
const MIN_RELOGIN_INTERVAL_MS = 5_000
// Proactive refresh window — a 401 will refresh earlier regardless.
const SESSION_TTL_MS = 30 * 60 * 1000

let cachedCookie: string | null = null
let cookieExpiresAt = 0
let lastLoginAttempt = 0
let forceRelogin = false
let inFlight: Promise<string | null> | null = null

/** Pull name=value pairs out of every Set-Cookie header the gateway sent. */
function parseSetCookies(res: Response): string {
  let rawList: Array<string> = []
  const getSetCookie = (res.headers as unknown as {
    getSetCookie?: () => Array<string>
  }).getSetCookie
  if (typeof getSetCookie === 'function') {
    rawList = getSetCookie.call(res.headers)
  }
  if (rawList.length === 0) {
    // Fallback for runtimes without getSetCookie().
    const joined = res.headers.get('set-cookie')
    if (joined) rawList = joined.split(/,(?=\s*[A-Za-z0-9_-]+=)/)
  }

  // Keep only the first segment (name=value) of each cookie; de-dup by name.
  const seen = new Map<string, string>()
  for (const sc of rawList) {
    const first = sc.split(';')[0]
    const eq = first.indexOf('=')
    if (eq > 0) seen.set(first.slice(0, eq).trim(), first.slice(eq + 1).trim())
  }
  return Array.from(seen.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')
}

async function login(): Promise<string | null> {
  // No password configured → stay on the legacy bearer-only path.
  if (!DASHBOARD_PASSWORD) return null

  if (inFlight) return inFlight

  const now = Date.now()
  const since = now - lastLoginAttempt
  if (!forceRelogin && since < MIN_RELOGIN_INTERVAL_MS) return cachedCookie
  lastLoginAttempt = now
  forceRelogin = false

  inFlight = (async () => {
    try {
      const res = await fetch(`${GATEWAY_BASE}/auth/password-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'basic',
          username: DASHBOARD_USERNAME,
          password: DASHBOARD_PASSWORD,
          next: '/',
        }),
        signal: AbortSignal.timeout(LOGIN_TIMEOUT_MS),
      })
      if (!res.ok) {
        console.warn(
          `[gateway-session] password login failed: ${res.status} ${await res.text().catch(() => '')}`,
        )
        cachedCookie = null
        cookieExpiresAt = 0
        return null
      }
      const cookie = parseSetCookies(res)
      if (!cookie) {
        console.warn('[gateway-session] login ok but no session cookie set')
        return null
      }
      cachedCookie = cookie
      cookieExpiresAt = Date.now() + SESSION_TTL_MS
      console.log('[gateway-session] gateway session cookie established')
      return cookie
    } catch (e) {
      console.warn('[gateway-session] password login error:', e)
      return null
    } finally {
      inFlight = null
    }
  })()
  return inFlight
}

/** Current session cookie, logging in lazily / refreshing when stale. */
export async function getGatewayCookie(): Promise<string | null> {
  if (cachedCookie && Date.now() < cookieExpiresAt) return cachedCookie
  return login()
}

/** Drop the cached cookie and force one fresh login on the next request. */
export function invalidateGatewaySession(): void {
  cachedCookie = null
  cookieExpiresAt = 0
  forceRelogin = true
}

/**
 * Auth headers for a gateway request: the session cookie (for gated
 * routes) plus the bearer token (for token-gated routes like
 * /api/gateway/drain). Both are harmless when the route only honors one.
 */
export async function gatewayAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {}
  const cookie = await getGatewayCookie()
  if (cookie) headers['Cookie'] = cookie
  if (BEARER_TOKEN) headers['Authorization'] = `Bearer ${BEARER_TOKEN}`
  return headers
}

/**
 * fetch() wrapper that injects gateway auth headers and self-heals on 401:
 * invalidate the cached session, re-login once, retry the request once.
 * Caller-supplied headers (Content-Type, X-Hermes-Session-Id, …) are
 * preserved; auth headers are merged on top. Only a single retry — a bad
 * password cannot spin into a login loop.
 */
export async function gatewayFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const callerHeaders =
    init.headers && !(init.headers instanceof Headers)
      ? { ...(init.headers as Record<string, string>) }
      : {}
  const auth = await gatewayAuthHeaders()
  let res = await fetch(url, { ...init, headers: { ...callerHeaders, ...auth } })
  if (res.status !== 401) return res

  invalidateGatewaySession()
  const auth2 = await gatewayAuthHeaders()
  res = await fetch(url, { ...init, headers: { ...callerHeaders, ...auth2 } })
  return res
}
