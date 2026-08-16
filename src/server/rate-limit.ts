/**
 * Simple in-memory rate limiter (no external deps).
 * Uses a sliding window approach per key.
 */

const store = new Map<string, { timestamps: Array<number> }>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < 120_000)
    if (entry.timestamps.length === 0) store.delete(key)
  }
}, 300_000)

/**
 * Check if a request is allowed under the rate limit.
 * @returns true if allowed, false if blocked
 */
export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): boolean {
  const now = Date.now()
  let entry = store.get(key)
  if (!entry) {
    entry = { timestamps: [] }
    store.set(key, entry)
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs)

  if (entry.timestamps.length >= maxRequests) {
    return false
  }

  entry.timestamps.push(now)
  return true
}

/**
 * Extract client IP from request for rate limiting key.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return 'local'
}

/**
 * Return a 429 Too Many Requests response.
 */
export function rateLimitResponse(): Response {
  return new Response(
    JSON.stringify({ error: 'Too many requests, please try again later' }),
    {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}

/**
 * Lightweight CSRF check: reject POST/PUT/PATCH/DELETE that don't send
 * `Content-Type: application/json`. Browsers won't set this header on
 * a simple form/navigation request, so its presence indicates a
 * programmatic call (JS fetch, curl, etc.).
 *
 * Returns `null` when the check passes, or a 415 Response to send back.
 */
export function requireJsonContentType(request: Request): Response | null {
  const method = request.method.toUpperCase()
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return null
  const ct = request.headers.get('content-type') ?? ''
  if (ct.includes('application/json')) return null
  return new Response(
    JSON.stringify({ error: 'Content-Type must be application/json' }),
    { status: 415, headers: { 'Content-Type': 'application/json' } },
  )
}

/**
 * CSRF defense for mutating routes that cannot require application/json.
 *
 * requireJsonContentType() only works when the route is guaranteed a JSON
 * body. Plenty of mutations here are not: bodiless DELETEs and action POSTs
 * (`/api/hermes-jobs/{id}?action=pause`, `/api/crews/templates/{id}`,
 * `/api/mcp/reload`) send no Content-Type at all, and /api/hermes-proxy
 * forwards whatever it is given, including multipart bodies. Requiring JSON
 * on those would 415 the app's own callers.
 *
 * So check the initiator instead. Browsers set Sec-Fetch-Site on every
 * request and page JavaScript cannot forge it, so `cross-site`/`same-site`
 * reliably mean some other origin started the request. Non-browser clients
 * (curl, scripts, the CLI) send no Sec-Fetch-* header at all, so an absent
 * value is allowed and command-line use keeps working.
 *
 * `none` is a user-initiated load (typed URL, bookmark) and is allowed too,
 * though it essentially cannot occur on a mutating method.
 */
export function rejectCrossSiteMutation(request: Request): Response | null {
  const method = request.method.toUpperCase()
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return null

  const site = request.headers.get('sec-fetch-site')
  if (!site || site === 'same-origin' || site === 'none') return null

  return new Response(
    JSON.stringify({ error: 'Cross-site requests are not allowed' }),
    { status: 403, headers: { 'Content-Type': 'application/json' } },
  )
}

/**
 * Sanitize error for response — hide details in production.
 */
export function safeErrorMessage(err: unknown): string {
  if (process.env.NODE_ENV === 'production') {
    return 'Internal server error'
  }
  return err instanceof Error ? err.message : String(err)
}
