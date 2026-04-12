'use client'

import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { AGENT_PERSONAS } from '@/lib/agent-personas'
import type { CreateCrewInput, CrewMemberRole } from '@/lib/crews-api'
import { cn } from '@/lib/utils'

const ROLES: Array<{ value: CrewMemberRole; label: string }> = [
  { value: 'coordinator', label: 'Coordinator' },
  { value: 'executor', label: 'Executor' },
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'specialist', label: 'Specialist' },
]

type MemberDraft = {
  persona: string
  role: CrewMemberRole
}

function getInitialMembers(): MemberDraft[] {
  return [
    { persona: 'kai', role: 'coordinator' },
    { persona: 'luna', role: 'executor' },
  ]
}

type Props = {
  open: boolean
  isSubmitting?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: CreateCrewInput) => void | Promise<void>
}

export function CreateCrewDialog({
  open,
  isSubmitting = false,
  onOpenChange,
  onSubmit,
}: Props) {
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [members, setMembers] = useState<MemberDraft[]>(getInitialMembers)

  useEffect(() => {
    if (!open) {
      setName('')
      setGoal('')
      setMembers(getInitialMembers())
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

  function addMember() {
    if (members.length >= 8) return
    const taken = new Set(members.map((m) => m.persona))
    const next = AGENT_PERSONAS.find((p) => !taken.has(p.name.toLowerCase()))
    setMembers((prev) => [
      ...prev,
      { persona: next?.name.toLowerCase() ?? 'kai', role: 'executor' },
    ])
  }

  function removeMember(idx: number) {
    setMembers((prev) => prev.filter((_, i) => i !== idx))
  }

  function setMemberField<K extends keyof MemberDraft>(
    idx: number,
    key: K,
    value: MemberDraft[K],
  ) {
    setMembers((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [key]: value } : m)),
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || members.length === 0) return
    await onSubmit({ name: name.trim(), goal: goal.trim(), members })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--theme-border)] px-6 py-4">
          <h2 className="text-base font-semibold text-[var(--theme-text)]">
            New Crew
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-1.5 text-[var(--theme-muted)] transition-colors hover:bg-[var(--theme-hover)] hover:text-[var(--theme-text)]"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--theme-muted)]">
              Crew name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Product Launch Team"
              required
              className="w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-card)] px-3 py-2 text-sm text-[var(--theme-text)] placeholder:text-[var(--theme-muted)] focus:border-[var(--theme-accent)] focus:outline-none"
            />
          </div>

          {/* Goal */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--theme-muted)]">
              Goal{' '}
              <span className="font-normal opacity-60">(optional)</span>
            </label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={2}
              placeholder="What should this crew accomplish?"
              className="w-full resize-none rounded-lg border border-[var(--theme-border)] bg-[var(--theme-card)] px-3 py-2 text-sm text-[var(--theme-text)] placeholder:text-[var(--theme-muted)] focus:border-[var(--theme-accent)] focus:outline-none"
            />
          </div>

          {/* Members */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--theme-muted)]">
                Agents ({members.length}/8)
              </span>
              {members.length < 8 && (
                <button
                  type="button"
                  onClick={addMember}
                  className="text-xs text-[var(--theme-accent)] hover:underline"
                >
                  + Add agent
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {members.map((member, idx) => {
                const persona = AGENT_PERSONAS.find(
                  (p) => p.name.toLowerCase() === member.persona,
                )
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-card)] p-2"
                  >
                    {/* Persona picker */}
                    <select
                      value={member.persona}
                      onChange={(e) =>
                        setMemberField(idx, 'persona', e.target.value)
                      }
                      className="flex-1 rounded border-0 bg-transparent text-sm text-[var(--theme-text)] focus:outline-none cursor-pointer"
                    >
                      {AGENT_PERSONAS.map((p) => (
                        <option
                          key={p.name}
                          value={p.name.toLowerCase()}
                          className="bg-[var(--theme-bg)]"
                        >
                          {p.emoji} {p.name} — {p.role}
                        </option>
                      ))}
                    </select>

                    {/* Role picker */}
                    <select
                      value={member.role}
                      onChange={(e) =>
                        setMemberField(
                          idx,
                          'role',
                          e.target.value as CrewMemberRole,
                        )
                      }
                      className="rounded border-0 bg-transparent text-xs text-[var(--theme-muted)] focus:outline-none cursor-pointer"
                    >
                      {ROLES.map((r) => (
                        <option
                          key={r.value}
                          value={r.value}
                          className="bg-[var(--theme-bg)]"
                        >
                          {r.label}
                        </option>
                      ))}
                    </select>

                    {/* Color swatch */}
                    {persona && (
                      <span className={cn('text-base', persona.color)}>
                        {persona.emoji}
                      </span>
                    )}

                    {/* Remove */}
                    {members.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMember(idx)}
                        className="rounded p-1 text-[var(--theme-muted)] hover:text-[var(--theme-danger)] transition-colors"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={12} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Actions */}
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
              disabled={isSubmitting || !name.trim()}
              className="rounded-lg bg-[var(--theme-accent)] px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? 'Creating…' : 'Create Crew'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
