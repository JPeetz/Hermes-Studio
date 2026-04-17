import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let tmpDir: string

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'crew-store-test-'))
  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
  rmSync(tmpDir, { recursive: true, force: true })
})

async function getStore() {
  return import('@/server/crew-store')
}

describe('crew-store', () => {
  it('listCrews() returns empty array initially', async () => {
    const { listCrews } = await getStore()
    expect(listCrews()).toEqual([])
  })

  it('createCrew() persists a crew in memory', async () => {
    const { createCrew, getCrew } = await getStore()
    const crew = createCrew({
      name: 'Test Crew',
      goal: 'Test goal',
      members: [],
    })
    expect(crew.id).toBeTruthy()
    expect(crew.name).toBe('Test Crew')
    expect(crew.goal).toBe('Test goal')
    expect(crew.status).toBe('draft')
    expect(getCrew(crew.id)).toEqual(crew)
  })

  it('createCrew() trims whitespace from name and goal', async () => {
    const { createCrew } = await getStore()
    const crew = createCrew({ name: '  Trimmed  ', goal: '  Goal  ', members: [] })
    expect(crew.name).toBe('Trimmed')
    expect(crew.goal).toBe('Goal')
  })

  it('listCrews() returns newest-first order', async () => {
    const { createCrew, listCrews } = await getStore()
    const a = createCrew({ name: 'A', goal: '', members: [] })
    await new Promise((r) => setTimeout(r, 5))
    const b = createCrew({ name: 'B', goal: '', members: [] })
    const list = listCrews()
    expect(list[0].id).toBe(b.id)
    expect(list[1].id).toBe(a.id)
  })

  it('updateCrew() modifies crew fields', async () => {
    const { createCrew, updateCrew, getCrew } = await getStore()
    const crew = createCrew({ name: 'Old Name', goal: 'Old goal', members: [] })
    const updated = updateCrew(crew.id, { name: 'New Name', status: 'active' })
    expect(updated?.name).toBe('New Name')
    expect(updated?.status).toBe('active')
    expect(getCrew(crew.id)?.name).toBe('New Name')
  })

  it('updateCrew() returns null for unknown id', async () => {
    const { updateCrew } = await getStore()
    expect(updateCrew('nonexistent', { name: 'X' })).toBeNull()
  })

  it('deleteCrew() removes the crew', async () => {
    const { createCrew, deleteCrew, getCrew } = await getStore()
    const crew = createCrew({ name: 'ToDelete', goal: '', members: [] })
    deleteCrew(crew.id)
    expect(getCrew(crew.id)).toBeNull()
  })

  it('getCrew() returns null for unknown id', async () => {
    const { getCrew } = await getStore()
    expect(getCrew('unknown')).toBeNull()
  })

  it('createCrew() assigns uuid ids to members', async () => {
    const { createCrew } = await getStore()
    const crew = createCrew({
      name: 'With Members',
      goal: 'g',
      members: [
        {
          sessionKey: 'sess-1',
          role: 'executor',
          persona: 'roger',
          displayName: 'Roger',
          roleLabel: 'Dev',
          color: 'blue',
          model: null,
          profileName: null,
        },
      ],
    })
    expect(crew.members).toHaveLength(1)
    expect(crew.members[0].id).toBeTruthy()
    expect(crew.members[0].status).toBe('idle')
    expect(crew.members[0].lastActivity).toBeNull()
  })
})
