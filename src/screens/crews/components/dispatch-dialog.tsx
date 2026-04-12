'use client'

import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import type { Crew } from '@/lib/crews-api'

type Props = {
  open: boolean
  crew: Crew
  isSubmitting?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (task: string, target: 'all' | string) => void | Promise<void>
}

export function DispatchDialog({
  open,
  crew,
  isSubmitting = false,
  onOpenChange,
  onSubmit,
}: Props) {
  const [task, setTask] = useState('')
  const [target, setTarget] = useState<'all' | string>('all')

  useEffect(() => {
    if (!open) {
      setTask('')
      setTarget('all')
      return
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onOpenChange])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!task.trim()) return
    await onSubmit(task.trim(), target)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--theme-border)] px-6 py-4">
          <h2 className="text-base font-semibold text-[var(--theme-text)]">
            Dispatch Task
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-1.5 text-[var(--theme-muted)] transition-colors hover:bg-[var(--theme-hover)] hover:text-[var(--theme-text)]"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-5">
          {/* Task */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--theme-muted)]">
              Task prompt
            </label>
            <textarea
              value={task}
              onChange={(e) => setTask(e.target.value)}
              rows={4}
              required
              placeholder="Describe what the agent(s) should do…"
              autoFocus
              className="w-full resize-none rounded-lg border border-[var(--theme-border)] bg-[var(--theme-card)] px-3 py-2 text-sm text-[var(--theme-text)] placeholder:text-[var(--theme-muted)] focus:border-[var(--theme-accent)] focus:outline-none"
            />
          </div>

          {/* Target */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--theme-muted)]">
              Send to
            </label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-card)] px-3 py-2 text-sm text-[var(--theme-text)] focus:border-[var(--theme-accent)] focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[var(--theme-bg)]">
                All agents ({crew.members.length})
              </option>
              {crew.members.map((m) => (
                <option key={m.id} value={m.id} className="bg-[var(--theme-bg)]">
                  {m.displayName} — {m.roleLabel}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg px-4 py-2 text-sm text-[var(--theme-muted)] transition-colors hover:bg-[var(--theme-hover)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !task.trim()}
              className="rounded-lg bg-[var(--theme-accent)] px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? 'Dispatching…' : 'Dispatch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
