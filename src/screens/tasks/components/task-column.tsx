import { useState } from 'react'
import { TaskCard } from './task-card'
import type { HermesTask, TaskColumn as TaskColumnType } from '@/types/task'
import { TASK_COLUMN_LABELS } from '@/types/task'

interface TaskColumnProps {
  column: TaskColumnType
  tasks: HermesTask[]
  onEdit: (task: HermesTask) => void
  onDragStart: (e: React.DragEvent, taskId: string) => void
  onDrop: (e: React.DragEvent, column: TaskColumnType) => void
}

export function TaskColumn({ column, tasks, onEdit, onDragStart, onDrop }: TaskColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    setIsDragOver(false)
    onDrop(e, column)
  }

  return (
    <div
      className="flex flex-col w-64 flex-shrink-0 rounded-lg"
      style={{
        background: isDragOver ? 'var(--theme-hover)' : 'var(--theme-panel)',
        border: `1px solid ${isDragOver ? 'var(--theme-accent-border)' : 'var(--theme-border)'}`,
        transition: 'background 0.15s, border-color 0.15s',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 border-b flex-shrink-0"
        style={{ borderColor: 'var(--theme-border)' }}
      >
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--theme-muted)' }}>
          {TASK_COLUMN_LABELS[column]}
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded-full font-medium"
          style={{
            background: 'var(--theme-hover)',
            color: 'var(--theme-text)',
          }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Scrollable task list */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onDragStart={onDragStart}
          />
        ))}
        {tasks.length === 0 && (
          <div
            className="flex items-center justify-center py-8 text-xs"
            style={{ color: 'var(--theme-muted)' }}
          >
            No tasks
          </div>
        )}
      </div>
    </div>
  )
}
