import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let tmpDir: string

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'ops-aggregator-test-'))
  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
  rmSync(tmpDir, { recursive: true, force: true })
})

describe('operations-aggregator', () => {
  it('getOperationsOverview() returns empty array with no crews or missions', async () => {
    const { getOperationsOverview } = await import('@/server/operations-aggregator')
    const agents = getOperationsOverview()
    expect(agents).toEqual([])
  })

  it('getOperationsOverview() includes crew members as agents', async () => {
    const { createCrew } = await import('@/server/crew-store')
    createCrew({
      name: 'Test Crew',
      goal: 'Testing',
      members: [
        {
          sessionKey: 'sess-1',
          role: 'executor',
          persona: 'kai',
          displayName: '🤖 Kai',
          roleLabel: 'Developer',
          color: 'blue',
          model: 'claude-sonnet-4-20250514',
          profileName: null,
        },
      ],
    })
    const { getOperationsOverview } = await import('@/server/operations-aggregator')
    const agents = getOperationsOverview()
    expect(agents).toHaveLength(1)
    expect(agents[0].name).toBe('Kai')
    expect(agents[0].source).toBe('crew')
    expect(agents[0].crewName).toBe('Test Crew')
  })

  it('getOperationsOverview() includes conductor workers as agents', async () => {
    const { createMission, addWorker } = await import('@/server/mission-store')
    const mission = createMission({ goal: 'Test mission' })
    addWorker(mission.id, {
      sessionKey: 'sess-2',
      label: 'Researcher',
      personaEmoji: '🔬',
      personaName: 'nova',
      model: null,
    })
    const { getOperationsOverview } = await import('@/server/operations-aggregator')
    const agents = getOperationsOverview()
    expect(agents).toHaveLength(1)
    expect(agents[0].name).toBe('nova')
    expect(agents[0].source).toBe('conductor')
    expect(agents[0].missionGoal).toBe('Test mission')
  })
})
