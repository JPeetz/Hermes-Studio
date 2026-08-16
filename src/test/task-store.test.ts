import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/server/chat-event-bus', () => ({
  publishChatEvent: vi.fn(),
}))

let tmpDir: string

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'task-store-test-'))
  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
  rmSync(tmpDir, { recursive: true, force: true })
})

async function getStore() {
  return import('@/server/task-store')
}

describe('task-store', () => {
  it('listTasks() returns empty array initially', async () => {
    const { listTasks } = await getStore()
    expect(listTasks()).toEqual([])
  })

  it('createTask() creates a task with defaults', async () => {
    const { createTask, getTask } = await getStore()
    const task = createTask({ title: 'Test task' })
    expect(task.id).toBeTruthy()
    expect(task.title).toBe('Test task')
    expect(task.column).toBe('backlog')
    expect(task.priority).toBe('medium')
    expect(task.sourceType).toBe('manual')
    expect(task.assignee).toBeNull()
    expect(getTask(task.id)).toEqual(task)
  })

  it('createTask() trims whitespace', async () => {
    const { createTask } = await getStore()
    const task = createTask({ title: '  Trimmed  ', description: '  Desc  ' })
    expect(task.title).toBe('Trimmed')
    expect(task.description).toBe('Desc')
  })

  it('listTasks() returns newest-first order', async () => {
    const { createTask, listTasks } = await getStore()
    const a = createTask({ title: 'A' })
    await new Promise((r) => setTimeout(r, 5))
    const b = createTask({ title: 'B' })
    const list = listTasks()
    expect(list[0].id).toBe(b.id)
    expect(list[1].id).toBe(a.id)
  })

  it('listTasks() filters by column', async () => {
    const { createTask, listTasks } = await getStore()
    createTask({ title: 'Backlog', column: 'backlog' })
    createTask({ title: 'Todo', column: 'todo' })
    const filtered = listTasks({ column: 'todo' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].title).toBe('Todo')
  })

  it('listTasks() filters by sourceType', async () => {
    const { createTask, listTasks } = await getStore()
    createTask({ title: 'Manual' })
    createTask({ title: 'From Conductor', sourceType: 'conductor', sourceId: 'mission-1' })
    const filtered = listTasks({ sourceType: 'conductor' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].title).toBe('From Conductor')
  })

  it('updateTask() modifies task fields', async () => {
    const { createTask, updateTask, getTask } = await getStore()
    const task = createTask({ title: 'Old' })
    const updated = updateTask(task.id, { title: 'New', priority: 'high' })
    expect(updated?.title).toBe('New')
    expect(updated?.priority).toBe('high')
    expect(getTask(task.id)?.title).toBe('New')
  })

  it('updateTask() returns null for unknown id', async () => {
    const { updateTask } = await getStore()
    expect(updateTask('nonexistent', { title: 'X' })).toBeNull()
  })

  it('moveTask() changes column', async () => {
    const { createTask, moveTask, getTask } = await getStore()
    const task = createTask({ title: 'Movable' })
    moveTask(task.id, 'in_progress')
    expect(getTask(task.id)?.column).toBe('in_progress')
  })

  it('deleteTask() removes the task', async () => {
    const { createTask, deleteTask, getTask } = await getStore()
    const task = createTask({ title: 'ToDelete' })
    deleteTask(task.id)
    expect(getTask(task.id)).toBeNull()
  })

  it('getTask() returns null for unknown id', async () => {
    const { getTask } = await getStore()
    expect(getTask('unknown')).toBeNull()
  })

  // ── Issue #8 Phase 2d ────────────────────────────────────────────────────

  it('updateTask() can re-bind and unbind profileId', async () => {
    const { createTask, updateTask } = await getStore()
    const task = createTask({ title: 'Bound', profileId: 'alpha' })
    expect(task.profileId).toBe('alpha')

    // A task could previously only be bound at creation, so a mis-filed task
    // was stuck in the wrong profile forever.
    expect(updateTask(task.id, { profileId: 'beta' })?.profileId).toBe('beta')
    expect(updateTask(task.id, { profileId: null })?.profileId).toBeNull()
  })

  it('updateTask() leaves profileId alone when it is not in the patch', async () => {
    const { createTask, updateTask } = await getStore()
    const task = createTask({ title: 'Bound', profileId: 'alpha' })
    expect(updateTask(task.id, { title: 'Renamed' })?.profileId).toBe('alpha')
  })

  it('updateTaskOwner() reassigns a task whose owner is eligible', async () => {
    const { createTask, updateTaskOwner } = await getStore()
    // 'user' is the pre-identity placeholder the store still defaults to.
    const task = createTask({ title: 'Orphan' })
    expect(task.createdBy).toBe('user')

    const moved = updateTaskOwner(task.id, 'alice', (owner) => owner === 'user')
    expect(moved?.createdBy).toBe('alice')
  })

  it('updateTaskOwner() refuses a task that already belongs to a real user', async () => {
    const { createTask, getTask, updateTaskOwner } = await getStore()
    const task = createTask({ title: 'Owned', createdBy: 'bob' })

    // Without the eligibility predicate the migration endpoint would be a way
    // for a super admin to quietly take over another user's tasks.
    const result = updateTaskOwner(task.id, 'alice', (owner) => owner === 'user')
    expect(result).toBeNull()
    expect(getTask(task.id)?.createdBy).toBe('bob')
  })

  it('updateTaskOwner() returns null for an unknown task', async () => {
    const { updateTaskOwner } = await getStore()
    expect(updateTaskOwner('nope', 'alice', () => true)).toBeNull()
  })
})
