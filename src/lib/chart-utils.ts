/**
 * chart-utils.ts
 *
 * Pure functions for building chart data from Hermes session usage records.
 * Extracted from usage-details-modal so they can be unit-tested independently.
 */

export const CHART_DAYS = 14

export type DayBucket = {
  date: string
  input: number
  output: number
  cost: number
}

export type SessionUsage = {
  startedAt?: number
  updatedAt?: number
  inputTokens: number
  outputTokens: number
  costUsd: number
}

/**
 * Build a pre-filled 14-day array of token/cost buckets.
 * Days with no sessions are included with zero values so the chart has
 * no gaps. Timestamps may be seconds or milliseconds — auto-detected.
 */
export function buildDayBuckets(
  sessions: SessionUsage[],
  now = Date.now(),
): DayBucket[] {
  const buckets = new Map<string, DayBucket>()

  for (let i = CHART_DAYS - 1; i >= 0; i--) {
    const d = new Date(now - i * 86_400_000)
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    buckets.set(key, { date: key, input: 0, output: 0, cost: 0 })
  }

  for (const s of sessions) {
    const ts = s.startedAt ?? s.updatedAt
    if (!ts) continue
    const ms = ts < 1_000_000_000_000 ? ts * 1000 : ts
    const age = now - ms
    if (age < 0 || age > CHART_DAYS * 86_400_000) continue
    const key = new Date(ms).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    const bucket = buckets.get(key)
    if (!bucket) continue
    bucket.input += s.inputTokens
    bucket.output += s.outputTokens
    bucket.cost += s.costUsd
  }

  return Array.from(buckets.values())
}

/**
 * Format a token count: 0–999 plain, 1 000+ as "Xk", 1 000 000+ as "Xm".
 */
export function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  return Math.round(value).toString()
}

/**
 * Return a Tailwind CSS colour class for a progress bar based on used/limit.
 * ≥90% red, ≥75% amber, ≥50% yellow, else emerald.
 */
export function progressColor(used: number, limit: number): string {
  const pct = (used / limit) * 100
  if (pct >= 90) return 'bg-red-500'
  if (pct >= 75) return 'bg-amber-500'
  if (pct >= 50) return 'bg-yellow-500'
  return 'bg-emerald-500'
}
