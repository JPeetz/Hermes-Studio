import { useEffect, useState } from 'react'
import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { HermesTask, CreateTaskInput, TaskColumn, TaskPriority } from '@/types/task'
import { TASK_COLUMNS, TASK_COLUMN_LABELS } from '@/types/task'

const PRIORITY_OPTIONS: TaskPriority[] = ['high', 'medium', 'low']

const inputStyle: React.CSSProperties = {
  background: 'var(--theme-input)',
  borderColor: 'var(--theme-border)',
  color: 'var(--theme-text)',
  border: '1px solid var(--theme-border)',
  borderRadius: '6px',
  padding: '6px 10px',
  fontSize: '13px',
  width: '100%',
  outline: 'none',
}

interface TaskDialogProps {
  open: boolean
  onClose: () => void
  onSave: (input: CreateTaskInput) => void
  task: HermesTask | null
}

export function TaskDialog({ open, onClose, onSave, task }: TaskDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [column, setColumn] = useState<TaskColumn>('backlog')
  const [assignee, setAssignee] = useState('')
  const [tagsRaw, setTagsRaw] = useState('')

  // Pre-fill from existing task when editing
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description ?? '')
      setPriority(task.priority)
      setColumn(task.column)
      setAssignee(task.assignee ?? '')
      setTagsRaw(task.tags.join(', '))
    } else {
      setTitle('')
      setDescription('')
      setPriority('medium')
      setColumn('backlog')
      setAssignee('')
      setTagsRaw('')
    }
  }, [task, open])

  const handleSave = () => {
    if (!title.trim()) return
    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      column,
      assignee: assignee.trim() || null,
      tags,
    })
    onClose()
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 500,
    marginBottom: '4px',
    color: 'var(--theme-muted)',
  }

  return (
    <DialogRoot open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="w-[min(480px,92vw)]">
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--theme-border)' }}
        >
          <DialogTitle>{task ? 'Edit Task' : 'New Task'}</DialogTitle>
          <DialogClose>{task ? 'Cancel' : 'Cancel'}</DialogClose>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 px-5 py-4 overflow-y-auto">
          {/* Title */}
          <div>
            <label style={labelStyle}>Title *</label>
            <input
              style={inputStyle}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: '72px' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description…"
              rows={3}
            />
          </div>

          {/* Priority + Column row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Priority</label>
              <select
                style={inputStyle}
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p} style={{ background: 'var(--theme-input)', color: 'var(--theme-text)' }}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Column</label>
              <select
                style={inputStyle}
                value={column}
                onChange={(e) => setColumn(e.target.value as TaskColumn)}
              >
                {TASK_COLUMNS.map((c) => (
                  <option key={c} value={c} style={{ background: 'var(--theme-input)', color: 'var(--theme-text)' }}>
                    {TASK_COLUMN_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label style={labelStyle}>Assignee</label>
            <input
              style={inputStyle}
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="Username or name"
            />
          </div>

          {/* Tags */}
          <div>
            <label style={labelStyle}>Tags (comma-separated)</label>
            <input
              style={inputStyle}
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder="e.g. frontend, urgent"
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-5 py-3 border-t"
          style={{ borderColor: 'var(--theme-border)' }}
        >
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!title.trim()}>
            {task ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </DialogContent>
    </DialogRoot>
  )
}
