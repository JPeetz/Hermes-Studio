import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

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
})
