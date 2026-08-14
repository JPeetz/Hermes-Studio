import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let tmpDir: string

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'event-store-test-'))
  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
  vi.resetModules()
})

afterEach(async () => {
  vi.restoreAllMocks()
  // Close the sqlite handle first — Windows can't delete an open file.
  const store = await import('@/server/event-store')
  store.closeEventStore()
  rmSync(tmpDir, { recursive: true, force: true })
})

async function getStore() {
  return import('@/server/event-store')
}

describe('event-store', () => {
  it('appendEvent() returns a sequence number', async () => {
    const { appendEvent } = await getStore()
    const seq = appendEvent('sess-1', undefined, 'tool', { name: 'bash' })
    expect(typeof seq).toBe('number')
    expect(seq).toBeGreaterThan(0)
  })

  it('appendEvent() increments sequence numbers', async () => {
    const { appendEvent } = await getStore()
    const seq1 = appendEvent('sess-1', undefined, 'tool', { name: 'bash' })
    const seq2 = appendEvent('sess-1', undefined, 'tool', { name: 'read' })
    expect(seq2).toBeGreaterThan(seq1!)
  })

  it('getEventsSince() retrieves events after a given seq', async () => {
    const { appendEvent, getEventsSince } = await getStore()
    appendEvent('sess-2', 'run-1', 'user_message', { text: 'hello' })
    const seq = appendEvent('sess-2', 'run-1', 'tool', { name: 'bash' })
    appendEvent('sess-2', 'run-1', 'chunk', { delta: 'hi' })

    const events = getEventsSince('sess-2', seq!)
    expect(events.length).toBe(1)
    expect(events[0].eventType).toBe('chunk')
  })

  it('getEventsSince() returns empty array for unknown session', async () => {
    const { getEventsSince } = await getStore()
    expect(getEventsSince('no-such-session', 0)).toEqual([])
  })

  it('queryAuditEvents() returns all events by default', async () => {
    const { appendEvent, queryAuditEvents } = await getStore()
    appendEvent('sess-3', undefined, 'tool', { name: 'bash' })
    appendEvent('sess-3', undefined, 'user_message', { text: 'hi' })
    appendEvent('sess-3', undefined, 'approval', { tool: 'bash', status: 'approved' })

    const result = queryAuditEvents()
    expect(result.events.length).toBeGreaterThanOrEqual(3)
    expect(result.total).toBeGreaterThanOrEqual(3)
  })

  it('queryAuditEvents() filters by sessionKey', async () => {
    const { appendEvent, queryAuditEvents } = await getStore()
    appendEvent('sess-A', undefined, 'tool', { name: 'bash' })
    appendEvent('sess-B', undefined, 'tool', { name: 'read' })

    const result = queryAuditEvents({ sessionKey: 'sess-A' })
    expect(result.events.every((e) => e.sessionKey === 'sess-A')).toBe(true)
  })

  it('queryAuditEvents() filters by eventTypes', async () => {
    const { appendEvent, queryAuditEvents } = await getStore()
    appendEvent('sess-C', undefined, 'tool', { name: 'bash' })
    appendEvent('sess-C', undefined, 'user_message', { text: 'hi' })

    const result = queryAuditEvents({ eventTypes: ['user_message'] })
    expect(result.events.every((e) => e.eventType === 'user_message')).toBe(true)
  })

  it('queryAuditEvents() returns session list', async () => {
    const { appendEvent, queryAuditEvents } = await getStore()
    appendEvent('sess-X', undefined, 'tool', { name: 'bash' })
    appendEvent('sess-Y', undefined, 'tool', { name: 'read' })

    const result = queryAuditEvents()
    expect(result.sessions).toContain('sess-X')
    expect(result.sessions).toContain('sess-Y')
  })
})
