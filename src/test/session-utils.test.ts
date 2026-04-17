import { describe, it, expect } from 'vitest'
import {
  normalise,
  fmtTokens,
  fmtCost,
  fmtDate,
  sessionTitle,
} from '@/lib/session-utils'

describe('normalise()', () => {
  it('uses key when present', () => {
    expect(normalise({ key: 'abc' }).key).toBe('abc')
  })

  it('falls back to id when key is absent', () => {
    expect(normalise({ id: 'id-1' }).key).toBe('id-1')
  })

  it('falls back to sessionKey when key and id are absent', () => {
    expect(normalise({ sessionKey: 'sk-1' }).key).toBe('sk-1')
  })

  it('returns empty string key when all key fields missing', () => {
    expect(normalise({}).key).toBe('')
  })

  it('uses friendlyId from raw', () => {
    expect(normalise({ friendlyId: 'chat-1' }).friendlyId).toBe('chat-1')
  })

  it('falls back to id for friendlyId', () => {
    expect(normalise({ id: 'id-2' }).friendlyId).toBe('id-2')
  })

  it('reads totalTokens directly', () => {
    expect(normalise({ totalTokens: 500 }).totalTokens).toBe(500)
  })

  it('falls back to tokenCount for totalTokens', () => {
    expect(normalise({ tokenCount: 300 }).totalTokens).toBe(300)
  })

  it('sums usage.promptTokens and usage.completionTokens', () => {
    const result = normalise({
      usage: { promptTokens: 100, completionTokens: 200 },
    })
    expect(result.totalTokens).toBe(300)
  })

  it('returns 0 totalTokens when nothing is present', () => {
    expect(normalise({}).totalTokens).toBe(0)
  })

  it('reads cost directly', () => {
    expect(normalise({ cost: 0.0012 }).cost).toBe(0.0012)
  })

  it('returns 0 cost when absent', () => {
    expect(normalise({}).cost).toBe(0)
  })

  it('reads messageCount directly', () => {
    expect(normalise({ messageCount: 10 }).messageCount).toBe(10)
  })

  it('falls back to message_count', () => {
    expect(normalise({ message_count: 7 }).messageCount).toBe(7)
  })

  it('reads toolCallCount directly', () => {
    expect(normalise({ toolCallCount: 3 }).toolCallCount).toBe(3)
  })

  it('falls back to tool_call_count', () => {
    expect(normalise({ tool_call_count: 5 }).toolCallCount).toBe(5)
  })

  it('uses updatedAt for the timestamp', () => {
    expect(normalise({ updatedAt: 12345 }).updatedAt).toBe(12345)
  })

  it('falls back to startedAt when updatedAt missing', () => {
    expect(normalise({ startedAt: 99999 }).updatedAt).toBe(99999)
  })

  it('falls back to createdAt as last resort', () => {
    expect(normalise({ createdAt: 777 }).updatedAt).toBe(777)
  })

  it('returns 0 updatedAt when all timestamps missing', () => {
    expect(normalise({}).updatedAt).toBe(0)
  })
})

describe('fmtTokens()', () => {
  it('returns plain number for values under 1000', () => {
    expect(fmtTokens(0)).toBe('0')
    expect(fmtTokens(500)).toBe('500')
    expect(fmtTokens(999)).toBe('999')
  })

  it('returns k-suffix for values 1000–999999', () => {
    expect(fmtTokens(1000)).toBe('1.0k')
    expect(fmtTokens(1500)).toBe('1.5k')
    expect(fmtTokens(10000)).toBe('10.0k')
  })

  it('returns m-suffix for values >= 1 000 000', () => {
    expect(fmtTokens(1_000_000)).toBe('1.0m')
    expect(fmtTokens(2_500_000)).toBe('2.5m')
  })
})

describe('fmtCost()', () => {
  it('returns — for zero', () => {
    expect(fmtCost(0)).toBe('—')
  })

  it('returns — for falsy values', () => {
    expect(fmtCost(0)).toBe('—')
  })

  it('formats non-zero cost with 4 decimal places', () => {
    expect(fmtCost(0.0012)).toBe('$0.0012')
    expect(fmtCost(1.5)).toBe('$1.5000')
  })
})

describe('fmtDate()', () => {
  it('returns — for undefined', () => {
    expect(fmtDate(undefined)).toBe('—')
  })

  it('returns — for zero', () => {
    expect(fmtDate(0)).toBe('—')
  })

  it('accepts a millisecond timestamp', () => {
    const result = fmtDate(1_700_000_000_000)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(3)
    expect(result).not.toBe('—')
  })

  it('auto-converts seconds timestamp to ms (< 1e12)', () => {
    const result = fmtDate(1_700_000_000)
    expect(typeof result).toBe('string')
    expect(result).not.toBe('—')
  })
})

describe('sessionTitle()', () => {
  const base = { key: 'k', friendlyId: 'f', title: '' }

  it('prefers derivedTitle over everything', () => {
    expect(sessionTitle({ ...base, derivedTitle: 'DT' } as any)).toBe('DT')
  })

  it('falls back to title', () => {
    expect(sessionTitle({ ...base, title: 'T' })).toBe('T')
  })

  it('falls back to label', () => {
    expect(sessionTitle({ ...base, label: 'L' } as any)).toBe('L')
  })

  it('falls back to friendlyId', () => {
    expect(sessionTitle({ ...base, friendlyId: 'F' })).toBe('F')
  })

  it('falls back to key as last resort', () => {
    expect(sessionTitle({ key: 'K', friendlyId: '', title: '' })).toBe('K')
  })
})
