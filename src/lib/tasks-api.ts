/**
 * Client-side API helpers for task management.
 */

import type { HermesTask, CreateTaskInput, UpdateTaskInput, TaskColumn } from '@/types/task'
import type { TaskFilter } from '@/server/task-store'

export async function fetchTasks(filter?: TaskFilter): Promise<HermesTask[]> {
  const params = new URLSearchParams()
  if (filter?.column) params.set('column', filter.column)
  if (filter?.assignee) params.set('assignee', filter.assignee)
  if (filter?.priority) params.set('priority', filter.priority)
  if (filter?.sourceType) params.set('sourceType', filter.sourceType)
  if (filter?.sourceId) params.set('sourceId', filter.sourceId)
  const qs = params.toString()
  const res = await fetch(`/api/tasks${qs ? `?${qs}` : ''}`)
  const data = (await res.json()) as { ok: boolean; tasks?: HermesTask[] }
  return data.tasks ?? []
}

export async function fetchTask(taskId: string): Promise<HermesTask | null> {
  const res = await fetch(`/api/tasks/${taskId}`)
  if (!res.ok) return null
  const data = (await res.json()) as { ok: boolean; task?: HermesTask }
  return data.task ?? null
}

export async function createTask(input: CreateTaskInput): Promise<HermesTask> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = (await res.json()) as { ok: boolean; task?: HermesTask; error?: string }
  if (!data.ok || !data.task) throw new Error(data.error ?? 'Failed to create task')
  return data.task
}

export async function updateTask(taskId: string, updates: UpdateTaskInput): Promise<HermesTask> {
  const res = await fetch(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  const data = (await res.json()) as { ok: boolean; task?: HermesTask; error?: string }
  if (!data.ok || !data.task) throw new Error(data.error ?? 'Failed to update task')
  return data.task
}

export async function moveTask(taskId: string, column: TaskColumn): Promise<HermesTask> {
  const res = await fetch(`/api/tasks/${taskId}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ column }),
  })
  const data = (await res.json()) as { ok: boolean; task?: HermesTask; error?: string }
  if (!data.ok || !data.task) throw new Error(data.error ?? 'Failed to move task')
  return data.task
}

export async function deleteTask(taskId: string): Promise<void> {
  const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
  if (!res.ok) {
    const data = (await res.json()) as { error?: string }
    throw new Error(data.error ?? 'Failed to delete task')
  }
}
