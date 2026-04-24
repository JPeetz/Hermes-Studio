/**
 * Task types — Kanban board task management.
 */

export type TaskColumn = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'high' | 'medium' | 'low'
export type TaskSourceType = 'manual' | 'conductor' | 'crew'

export interface HermesTask {
  id: string
  title: string
  description: string
  column: TaskColumn
  priority: TaskPriority
  assignee: string | null
  tags: string[]
  dueDate: string | null
  position: number
  sourceType: TaskSourceType
  sourceId: string | null
  createdBy: string
  createdAt: number
  updatedAt: number
}

export interface CreateTaskInput {
  title: string
  description?: string
  column?: TaskColumn
  priority?: TaskPriority
  assignee?: string | null
  tags?: string[]
  dueDate?: string | null
  sourceType?: TaskSourceType
  sourceId?: string | null
  createdBy?: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  column?: TaskColumn
  priority?: TaskPriority
  assignee?: string | null
  tags?: string[]
  dueDate?: string | null
  position?: number
}

export const TASK_COLUMNS: readonly TaskColumn[] = ['backlog', 'todo', 'in_progress', 'review', 'done'] as const

export const TASK_COLUMN_LABELS: Record<TaskColumn, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
}
