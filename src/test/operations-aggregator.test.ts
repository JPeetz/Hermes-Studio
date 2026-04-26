import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockListSessions = vi.fn().mockResolvedValue([])
const mockListCrews = vi.fn().mockReturnValue([])

vi.mock('@/server/hermes-api', () => ({
  listSessions: (...args: unknown[]) => mockListSessions(...args),
}))

vi.mock('@/server/crew-store', () => ({
  listCrews: (...args: unknown[]) => mockListCrews(...args),
}))

beforeEach(() => {
  mockListSessions.mockResolvedValue([])
  mockListCrews.mockReturnValue([])
})

describe('operations-aggregator', () => {
  it('returns empty array when no crews or sessions', async () => {
    const { getOperationsOverview } = await import('@/server/operations-aggregator')
    const result = await getOperationsOverview()
    expect(result).toEqual([])
  })

  it('includes crew agents with source=crew', async () => {
    mockListCrews.mockReturnValue([
      {
        id: 'crew-1',
        name: 'Test Crew',
        members: [
          {
            id: 'member-1',
            displayName: '🤖 Agent One',
            model: 'sonnet',
            profileName: 'default',
            sessionKey: 'session-1',
            status: 'running',
            lastActivity: Date.now(),
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ])

    const { getOperationsOverview } = await import('@/server/operations-aggregator')
    const result = await getOperationsOverview()
    expect(result.length).toBe(1)
    expect(result[0].source).toBe('crew')
    expect(result[0].status).toBe('online')
  })

  it('includes conductor sessions with source=conductor', async () => {
    mockListSessions.mockResolvedValue([
      {
        id: 'sess-1',
        title: 'worker-build-feature',
        model: 'opus',
        started_at: Math.floor(Date.now() / 1000) - 60,
        last_active: Math.floor(Date.now() / 1000) - 5,
        input_tokens: 5000,
        output_tokens: 3000,
      },
    ])

    const { getOperationsOverview } = await import('@/server/operations-aggregator')
    const result = await getOperationsOverview()
    expect(result.length).toBe(1)
    expect(result[0].source).toBe('conductor')
    expect(result[0].name).toBe('build feature')
    expect(result[0].totalTokens).toBe(8000)
  })

  it('filters out non-conductor sessions', async () => {
    mockListSessions.mockResolvedValue([
      {
        id: 'sess-2',
        title: 'regular chat session',
        model: 'sonnet',
        started_at: Math.floor(Date.now() / 1000) - 60,
        last_active: Math.floor(Date.now() / 1000) - 5,
        input_tokens: 1000,
        output_tokens: 500,
      },
    ])

    const { getOperationsOverview } = await import('@/server/operations-aggregator')
    const result = await getOperationsOverview()
    expect(result.length).toBe(0)
  })
})
