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
  tags: Array<string>
  dueDate: string | null
  position: number
  sourceType: TaskSourceType
  sourceId: string | null
  createdBy: string
  /** Optional Hermes profile this task belongs to (Issue #8 Phase 2) —
   *  regular admins see tasks of profiles bound to their account. */
  profileId?: string | null
  createdAt: number
  updatedAt: number
}

export interface CreateTaskInput {
  title: string
  description?: string
  column?: TaskColumn
  priority?: TaskPriority
  assignee?: string | null
  tags?: Array<string>
  dueDate?: string | null
  sourceType?: TaskSourceType
  sourceId?: string | null
  createdBy?: string
  profileId?: string | null
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  column?: TaskColumn
  priority?: TaskPriority
  assignee?: string | null
  tags?: Array<string>
  dueDate?: string | null
  position?: number
  /** Re-bind (or unbind, with null) the task's profile — Issue #8 Phase 2d.
   *  A task could previously only be bound at creation, so a mis-filed task
   *  was stuck in the wrong profile forever. The PATCH route validates the
   *  caller can access the target profile, same rule as create. */
  profileId?: string | null
}

export const TASK_COLUMNS: ReadonlyArray<TaskColumn> = ['backlog', 'todo', 'in_progress', 'review', 'done'] as const

export const TASK_COLUMN_LABELS: Record<TaskColumn, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
}
