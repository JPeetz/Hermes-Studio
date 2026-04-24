import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon } from '@hugeicons/core-free-icons'
import { StatusBadge } from '@/components/ds/status-badge'
import { Button } from '@/components/ui/button'
import { TaskColumn } from './components/task-column'
import { TaskDialog } from './components/task-dialog'
import {
  fetchTasks,
  createTask as apiCreateTask,
  updateTask as apiUpdateTask,
  moveTask as apiMoveTask,
} from '@/lib/tasks-api'
import type { HermesTask, CreateTaskInput, TaskColumn as TaskColumnType } from '@/types/task'
import { TASK_COLUMNS } from '@/types/task'

export function TasksScreen() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<HermesTask | null>(null)
  const [dragTaskId, setDragTaskId] = useState<string | null>(null)

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => fetchTasks(),
    refetchInterval: 3_000,
  })

  const createMutation = useMutation({
    mutationFn: apiCreateTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateTaskInput> }) =>
      apiUpdateTask(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const moveMutation = useMutation({
    mutationFn: ({ id, column }: { id: string; column: TaskColumnType }) =>
      apiMoveTask(id, column),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const handleSave = useCallback(
    (input: CreateTaskInput) => {
      if (editingTask) {
        updateMutation.mutate({ id: editingTask.id, updates: input })
      } else {
        createMutation.mutate(input)
      }
      setEditingTask(null)
    },
    [editingTask, createMutation, updateMutation],
  )

  const handleEdit = useCallback((task: HermesTask) => {
    setEditingTask(task)
    setDialogOpen(true)
  }, [])

  const handleDragStart = useCallback((_e: React.DragEvent, taskId: string) => {
    setDragTaskId(taskId)
  }, [])

  const handleDrop = useCallback(
    (_e: React.DragEvent, column: TaskColumnType) => {
      if (dragTaskId) {
        moveMutation.mutate({ id: dragTaskId, column })
        setDragTaskId(null)
      }
    },
    [dragTaskId, moveMutation],
  )

  const tasksByColumn = TASK_COLUMNS.reduce(
    (acc, col) => {
      acc[col] = tasks.filter((t) => t.column === col)
      return acc
    },
    {} as Record<TaskColumnType, HermesTask[]>,
  )

  const totalTasks = tasks.length
  const inProgress = tasks.filter((t) => t.column === 'in_progress').length
  const done = tasks.filter((t) => t.column === 'done').length
  const completionPct = totalTasks > 0 ? Math.round((done / totalTasks) * 100) : 0

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--theme-bg)' }}>
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'var(--theme-border)' }}
      >
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>
            Tasks
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: 'var(--theme-muted)' }}>
              {totalTasks} total
            </span>
            <StatusBadge status="running" label={`${inProgress} active`} size="sm" />
            <span className="text-xs" style={{ color: 'var(--theme-success)' }}>
              {completionPct}% done
            </span>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditingTask(null)
            setDialogOpen(true)
          }}
        >
          <HugeiconsIcon icon={Add01Icon} size={16} />
          <span className="ml-1.5">New Task</span>
        </Button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <StatusBadge status="running" label="Loading tasks..." />
          </div>
        ) : (
          <div className="flex gap-4 h-full min-w-max">
            {TASK_COLUMNS.map((col) => (
              <TaskColumn
                key={col}
                column={col}
                tasks={tasksByColumn[col]}
                onEdit={handleEdit}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
              />
            ))}
          </div>
        )}
      </div>

      <TaskDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditingTask(null)
        }}
        onSave={handleSave}
        task={editingTask}
      />
    </div>
  )
}
