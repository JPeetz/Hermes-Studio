import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let tmpDir: string

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'mission-store-test-'))
  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
  rmSync(tmpDir, { recursive: true, force: true })
})

async function getStore() {
  return import('@/server/mission-store')
}

describe('mission-store', () => {
  it('listMissions() returns empty array initially', async () => {
    const { listMissions } = await getStore()
    expect(listMissions()).toEqual([])
  })

  it('createMission() creates a mission with defaults', async () => {
    const { createMission, getMission } = await getStore()
    const mission = createMission({ goal: 'Test goal' })
    expect(mission.id).toBeTruthy()
    expect(mission.goal).toBe('Test goal')
    expect(mission.status).toBe('idle')
    expect(mission.workers).toEqual([])
    expect(mission.tasks).toEqual([])
    expect(mission.totalTokens).toBe(0)
    expect(mission.totalCostUsd).toBe(0)
    expect(getMission(mission.id)).toEqual(mission)
  })

  it('updateMission() modifies mission fields', async () => {
    const { createMission, updateMission } = await getStore()
    const mission = createMission({ goal: 'Original' })
    const updated = updateMission(mission.id, { status: 'running' })
    expect(updated?.status).toBe('running')
  })

  it('updateMission() returns null for unknown id', async () => {
    const { updateMission } = await getStore()
    expect(updateMission('nonexistent', { status: 'running' })).toBeNull()
  })

  it('completeMission() sets status and completedAt', async () => {
    const { createMission, completeMission, getMission } = await getStore()
    const mission = createMission({ goal: 'Complete me' })
    completeMission(mission.id)
    const completed = getMission(mission.id)
    expect(completed?.status).toBe('completed')
    expect(completed?.completedAt).toBeGreaterThan(0)
  })

  it('abortMission() sets status to aborted', async () => {
    const { createMission, abortMission, getMission } = await getStore()
    const mission = createMission({ goal: 'Abort me' })
    abortMission(mission.id)
    expect(getMission(mission.id)?.status).toBe('aborted')
  })

  it('deleteMission() removes the mission', async () => {
    const { createMission, deleteMission, getMission } = await getStore()
    const mission = createMission({ goal: 'Delete me' })
    deleteMission(mission.id)
    expect(getMission(mission.id)).toBeNull()
  })

  it('appendMissionEvent() stores events', async () => {
    const { createMission, appendMissionEvent, getMissionEvents } = await getStore()
    const mission = createMission({ goal: 'Event test' })
    appendMissionEvent(mission.id, 'worker.spawned', { workerId: 'w1' })
    appendMissionEvent(mission.id, 'worker.output', { workerId: 'w1', text: 'hello' })
    const events = getMissionEvents(mission.id)
    expect(events).toHaveLength(2)
    expect(events[0].type).toBe('worker.spawned')
    expect(events[1].type).toBe('worker.output')
  })

  it('addWorker() adds a worker to the mission', async () => {
    const { createMission, addWorker, getMission } = await getStore()
    const mission = createMission({ goal: 'Worker test' })
    addWorker(mission.id, {
      sessionKey: 'sess-1',
      label: 'Researcher',
      personaEmoji: '🔬',
      personaName: 'nova',
      model: null,
    })
    const updated = getMission(mission.id)
    expect(updated?.workers).toHaveLength(1)
    expect(updated?.workers[0].label).toBe('Researcher')
    expect(updated?.workers[0].status).toBe('pending')
  })

  it('updateWorkerStatus() changes worker status and tokens', async () => {
    const { createMission, addWorker, updateWorkerStatus, getMission } = await getStore()
    const mission = createMission({ goal: 'Status test' })
    addWorker(mission.id, {
      sessionKey: 'sess-1',
      label: 'Worker',
      personaEmoji: '🤖',
      personaName: 'kai',
      model: null,
    })
    updateWorkerStatus(mission.id, 'sess-1', 'running', 500)
    const updated = getMission(mission.id)
    expect(updated?.workers[0].status).toBe('running')
    expect(updated?.workers[0].totalTokens).toBe(500)
  })
})
