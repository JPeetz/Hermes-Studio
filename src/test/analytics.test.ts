import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let tmpDir: string

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'analytics-test-'))
  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
  rmSync(tmpDir, { recursive: true, force: true })
})

async function getStore() {
  return import('@/server/event-store')
}

describe('getAnalytics()', () => {
  it('returns a valid structure with an empty database', async () => {
    const { getAnalytics } = await getStore()
    const result = getAnalytics()
    expect(typeof result.totalEvents).toBe('number')
    expect(typeof result.totalSessions).toBe('number')
    expect(Array.isArray(result.toolFrequency)).toBe(true)
    expect(Array.isArray(result.dailyVolume)).toBe(true)
    expect(typeof result.timeRange).toBe('object')
  })

  it('returns zero counts for an empty database', async () => {
    const { getAnalytics } = await getStore()
    const result = getAnalytics()
    expect(result.totalEvents).toBe(0)
    expect(result.totalSessions).toBe(0)
  })

  it('dailyVolume always has exactly 14 entries', async () => {
    const { getAnalytics } = await getStore()
    expect(getAnalytics().dailyVolume).toHaveLength(14)
  })

  it('counts total events correctly', async () => {
    const { appendEvent, getAnalytics } = await getStore()
    appendEvent('sess-1', undefined, 'tool', { name: 'bash' })
    appendEvent('sess-1', undefined, 'tool', { name: 'read' })
    appendEvent('sess-2', undefined, 'user_message', { text: 'hi' })
    const result = getAnalytics()
    expect(result.totalEvents).toBe(3)
  })

  it('counts distinct sessions', async () => {
    const { appendEvent, getAnalytics } = await getStore()
    appendEvent('sess-A', undefined, 'tool', { name: 'bash' })
    appendEvent('sess-A', undefined, 'tool', { name: 'read' })
    appendEvent('sess-B', undefined, 'user_message', { text: 'hi' })
    const result = getAnalytics()
    expect(result.totalSessions).toBe(2)
  })

  it('tracks tool frequency by name', async () => {
    const { appendEvent, getAnalytics } = await getStore()
    appendEvent('s1', undefined, 'tool', { name: 'bash', phase: 'complete' })
    appendEvent('s1', undefined, 'tool', { name: 'bash', phase: 'complete' })
    appendEvent('s1', undefined, 'tool', { name: 'read', phase: 'complete' })
    const result = getAnalytics()
    const bashEntry = result.toolFrequency.find((t) => t.tool === 'bash')
    const readEntry = result.toolFrequency.find((t) => t.tool === 'read')
    expect(bashEntry).toBeDefined()
    expect(readEntry).toBeDefined()
    expect(bashEntry!.count).toBeGreaterThanOrEqual(2)
    expect(readEntry!.count).toBeGreaterThanOrEqual(1)
  })

  it('toolFrequency is sorted by total descending', async () => {
    const { appendEvent, getAnalytics } = await getStore()
    appendEvent('s1', undefined, 'tool', { name: 'bash', phase: 'complete' })
    appendEvent('s1', undefined, 'tool', { name: 'bash', phase: 'complete' })
    appendEvent('s1', undefined, 'tool', { name: 'read', phase: 'complete' })
    const result = getAnalytics()
    for (let i = 1; i < result.toolFrequency.length; i++) {
      expect(result.toolFrequency[i - 1].count).toBeGreaterThanOrEqual(
        result.toolFrequency[i].count,
      )
    }
  })

  it('toolFrequency has at most 15 entries', async () => {
    const { appendEvent, getAnalytics } = await getStore()
    // Insert 20 unique tool names
    for (let i = 0; i < 20; i++) {
      appendEvent('s1', undefined, 'tool', { name: `tool-${i}`, phase: 'complete' })
    }
    const result = getAnalytics()
    expect(result.toolFrequency.length).toBeLessThanOrEqual(15)
  })

  it('populates timeRange after events are inserted', async () => {
    const { appendEvent, getAnalytics } = await getStore()
    appendEvent('s1', undefined, 'tool', { name: 'bash' })
    const result = getAnalytics()
    expect(result.timeRange).not.toBeNull()
    expect(result.timeRange!.oldest).toBeGreaterThan(0)
    expect(result.timeRange!.newest).toBeGreaterThanOrEqual(result.timeRange!.oldest)
  })

  it('timeRange is null for empty database', async () => {
    const { getAnalytics } = await getStore()
    const result = getAnalytics()
    expect(result.timeRange).toBeNull()
  })

  it('eventTypeCounts includes tool events', async () => {
    const { appendEvent, getAnalytics } = await getStore()
    appendEvent('s1', undefined, 'tool', { name: 'bash' })
    appendEvent('s1', undefined, 'user_message', { text: 'hello' })
    const result = getAnalytics()
    expect(result.eventTypeCounts).toBeDefined()
  })

  it('returns consistent results on repeated calls (no mutation)', async () => {
    const { appendEvent, getAnalytics } = await getStore()
    appendEvent('s1', undefined, 'tool', { name: 'bash' })
    const r1 = getAnalytics()
    const r2 = getAnalytics()
    expect(r1.totalEvents).toBe(r2.totalEvents)
    expect(r1.totalSessions).toBe(r2.totalSessions)
  })
})
