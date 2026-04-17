import { describe, it, expect } from 'vitest'
import {
  buildDayBuckets,
  formatTokens,
  progressColor,
  CHART_DAYS,
} from '@/lib/chart-utils'
import type { SessionUsage } from '@/lib/chart-utils'

const NOW = new Date('2026-04-17T12:00:00Z').getTime()

describe('buildDayBuckets()', () => {
  it('returns exactly CHART_DAYS entries', () => {
    expect(buildDayBuckets([], NOW)).toHaveLength(CHART_DAYS)
  })

  it('all buckets are zero when sessions array is empty', () => {
    const buckets = buildDayBuckets([], NOW)
    for (const b of buckets) {
      expect(b.input).toBe(0)
      expect(b.output).toBe(0)
      expect(b.cost).toBe(0)
    }
  })

  it('accumulates tokens for a session timestamped today', () => {
    const session: SessionUsage = {
      startedAt: NOW,
      inputTokens: 100,
      outputTokens: 200,
      costUsd: 0.01,
    }
    const buckets = buildDayBuckets([session], NOW)
    const today = buckets[buckets.length - 1]
    expect(today.input).toBe(100)
    expect(today.output).toBe(200)
    expect(today.cost).toBeCloseTo(0.01)
  })

  it('accumulates multiple sessions into the same day bucket', () => {
    const s1: SessionUsage = { startedAt: NOW, inputTokens: 50, outputTokens: 50, costUsd: 0.005 }
    const s2: SessionUsage = { startedAt: NOW - 3600_000, inputTokens: 50, outputTokens: 50, costUsd: 0.005 }
    const buckets = buildDayBuckets([s1, s2], NOW)
    const today = buckets[buckets.length - 1]
    expect(today.input).toBe(100)
    expect(today.output).toBe(100)
  })

  it('ignores sessions older than CHART_DAYS days', () => {
    const old: SessionUsage = {
      startedAt: NOW - (CHART_DAYS + 1) * 86_400_000,
      inputTokens: 999,
      outputTokens: 999,
      costUsd: 1,
    }
    const buckets = buildDayBuckets([old], NOW)
    const total = buckets.reduce((acc, b) => acc + b.input, 0)
    expect(total).toBe(0)
  })

  it('ignores sessions with a future timestamp', () => {
    const future: SessionUsage = {
      startedAt: NOW + 86_400_000,
      inputTokens: 999,
      outputTokens: 999,
      costUsd: 1,
    }
    const buckets = buildDayBuckets([future], NOW)
    const total = buckets.reduce((acc, b) => acc + b.input, 0)
    expect(total).toBe(0)
  })

  it('ignores sessions with no timestamp', () => {
    const s: SessionUsage = { inputTokens: 100, outputTokens: 100, costUsd: 0.01 }
    const buckets = buildDayBuckets([s], NOW)
    const total = buckets.reduce((acc, b) => acc + b.input, 0)
    expect(total).toBe(0)
  })

  it('auto-converts a seconds timestamp to milliseconds', () => {
    const session: SessionUsage = {
      startedAt: Math.floor(NOW / 1000), // seconds
      inputTokens: 42,
      outputTokens: 0,
      costUsd: 0,
    }
    const buckets = buildDayBuckets([session], NOW)
    const total = buckets.reduce((acc, b) => acc + b.input, 0)
    expect(total).toBe(42)
  })

  it('falls back to updatedAt when startedAt is absent', () => {
    const session: SessionUsage = {
      updatedAt: NOW,
      inputTokens: 77,
      outputTokens: 0,
      costUsd: 0,
    }
    const buckets = buildDayBuckets([session], NOW)
    const total = buckets.reduce((acc, b) => acc + b.input, 0)
    expect(total).toBe(77)
  })

  it('bucket dates are strings (for chart axis labels)', () => {
    const buckets = buildDayBuckets([], NOW)
    for (const b of buckets) {
      expect(typeof b.date).toBe('string')
      expect(b.date.length).toBeGreaterThan(0)
    }
  })

  it('buckets are ordered oldest-first', () => {
    const buckets = buildDayBuckets([], NOW)
    // The last bucket should be today's date label
    const today = new Date(NOW).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    expect(buckets[buckets.length - 1].date).toBe(today)
  })
})

describe('formatTokens()', () => {
  it('returns plain integer string for values < 1000', () => {
    expect(formatTokens(0)).toBe('0')
    expect(formatTokens(1)).toBe('1')
    expect(formatTokens(999)).toBe('999')
  })

  it('rounds non-integers below 1000', () => {
    expect(formatTokens(2.7)).toBe('3')
  })

  it('uses k suffix for 1000–999999', () => {
    expect(formatTokens(1000)).toBe('1.0k')
    expect(formatTokens(1500)).toBe('1.5k')
    expect(formatTokens(999_999)).toBe('1000.0k')
  })

  it('uses m suffix for >= 1 000 000', () => {
    expect(formatTokens(1_000_000)).toBe('1.0m')
    expect(formatTokens(3_500_000)).toBe('3.5m')
  })
})

describe('progressColor()', () => {
  it('returns emerald for usage below 50%', () => {
    expect(progressColor(10, 100)).toBe('bg-emerald-500')
    expect(progressColor(49, 100)).toBe('bg-emerald-500')
  })

  it('returns yellow for usage 50–74%', () => {
    expect(progressColor(50, 100)).toBe('bg-yellow-500')
    expect(progressColor(74, 100)).toBe('bg-yellow-500')
  })

  it('returns amber for usage 75–89%', () => {
    expect(progressColor(75, 100)).toBe('bg-amber-500')
    expect(progressColor(89, 100)).toBe('bg-amber-500')
  })

  it('returns red for usage >= 90%', () => {
    expect(progressColor(90, 100)).toBe('bg-red-500')
    expect(progressColor(100, 100)).toBe('bg-red-500')
  })
})
