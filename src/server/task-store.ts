/**
 * Task store — file-backed persistence for Kanban board tasks.
 *
 * Follows the same pattern as crew-store.ts: in-memory cache with
 * deferred disk writes to .runtime/tasks.json.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import type {
  HermesTask,
  CreateTaskInput,
  UpdateTaskInput,
  TaskColumn,
  TaskSourceType,
} from '../types/task'

const DATA_DIR = join(process.cwd(), '.runtime')
const TASKS_FILE = join(DATA_DIR, 'tasks.json')

type StoreData = { tasks: Record<string, HermesTask> }

export interface TaskFilter {
  column?: TaskColumn
  assignee?: string
  priority?: 'high' | 'medium' | 'low'
  sourceType?: TaskSourceType
  sourceId?: string
}

let store: StoreData = { tasks: {} }

function loadFromDisk(): void {
  try {
    if (existsSync(TASKS_FILE)) {
      const raw = readFileSync(TASKS_FILE, 'utf-8')
      const parsed = JSON.parse(raw) as StoreData
      if (parsed?.tasks && typeof parsed.tasks === 'object') {
        store = parsed
      }
    }
  } catch { /* corrupt file — start fresh */ }
}

function saveToDisk(): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
    writeFileSync(TASKS_FILE, JSON.stringify(store, null, 2))
  } catch { /* ignore write failure */ }
}

let _saveTimer: ReturnType<typeof setTimeout> | null = null
function scheduleSave(): void {
  if (_saveTimer) return
  _saveTimer = setTimeout(() => { _saveTimer = null; saveToDisk() }, 1_000)
}

loadFromDisk()

export function listTasks(filter?: TaskFilter): HermesTask[] {
  let tasks = Object.values(store.tasks)
  if (filter?.column) tasks = tasks.filter((t) => t.column === filter.column)
  if (filter?.assignee) tasks = tasks.filter((t) => t.assignee === filter.assignee)
  if (filter?.priority) tasks = tasks.filter((t) => t.priority === filter.priority)
  if (filter?.sourceType) tasks = tasks.filter((t) => t.sourceType === filter.sourceType)
  if (filter?.sourceId) tasks = tasks.filter((t) => t.sourceId === filter.sourceId)
  return tasks.sort((a, b) => b.createdAt - a.createdAt)
}

export function getTask(taskId: string): HermesTask | null {
  return store.tasks[taskId] ?? null
}

export function createTask(input: CreateTaskInput): HermesTask {
  const now = Date.now()
  const task: HermesTask = {
    id: randomUUID(),
    title: (input.title ?? '').trim(),
    description: (input.description ?? '').trim(),
    column: input.column ?? 'backlog',
    priority: input.priority ?? 'medium',
    assignee: input.assignee ?? null,
    tags: input.tags ?? [],
    dueDate: input.dueDate ?? null,
    position: now,
    sourceType: input.sourceType ?? 'manual',
    sourceId: input.sourceId ?? null,
    createdBy: input.createdBy ?? 'user',
    createdAt: now,
    updatedAt: now,
  }
  store.tasks[task.id] = task
  saveToDisk()
  return task
}

export function updateTask(taskId: string, updates: UpdateTaskInput): HermesTask | null {
  const task = store.tasks[taskId]
  if (!task) return null
  if (updates.title !== undefined) task.title = updates.title.trim()
  if (updates.description !== undefined) task.description = updates.description.trim()
  if (updates.column !== undefined) task.column = updates.column
  if (updates.priority !== undefined) task.priority = updates.priority
  if (updates.assignee !== undefined) task.assignee = updates.assignee
  if (updates.tags !== undefined) task.tags = updates.tags
  if (updates.dueDate !== undefined) task.dueDate = updates.dueDate
  if (updates.position !== undefined) task.position = updates.position
  task.updatedAt = Date.now()
  scheduleSave()
  return task
}

export function moveTask(taskId: string, column: TaskColumn): HermesTask | null {
  return updateTask(taskId, { column })
}

export function deleteTask(taskId: string): boolean {
  if (!store.tasks[taskId]) return false
  delete store.tasks[taskId]
  saveToDisk()
  return true
}
