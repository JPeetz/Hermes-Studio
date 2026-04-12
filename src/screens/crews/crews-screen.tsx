'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  Delete01Icon,
  UserMultiple02Icon,
} from '@hugeicons/core-free-icons'
import { CreateCrewDialog } from './components/create-crew-dialog'
import type { Crew } from '@/lib/crews-api'
import {
  createCrew,
  deleteCrew,
  fetchCrews,
} from '@/lib/crews-api'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

const QUERY_KEY = ['crews'] as const

const STATUS_CONFIG: Record<
  Crew['status'],
  { label: string; color: string; dot: string }
> = {
  draft: {
    label: 'Draft',
    color: 'text-[var(--theme-muted)]',
    dot: 'bg-[var(--theme-muted)]',
  },
  active: {
    label: 'Active',
    color: 'text-[var(--theme-success)]',
    dot: 'bg-[var(--theme-success)]',
  },
  paused: {
    label: 'Paused',
    color: 'text-[var(--theme-warning,#f59e0b)]',
    dot: 'bg-[var(--theme-warning,#f59e0b)]',
  },
  complete: {
    label: 'Complete',
    color: 'text-[var(--theme-accent)]',
    dot: 'bg-[var(--theme-accent)]',
  },
}

function CrewCard({
  crew,
  onDelete,
}: {
  crew: Crew
  onDelete: (id: string) => void
}) {
  const status = STATUS_CONFIG[crew.status]
  const activeCount = crew.members.filter(
    (m) => m.status === 'running',
  ).length

  return (
    <div className="group relative rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-4 transition-colors hover:border-[var(--theme-accent)]/40">
      {/* Status dot */}
      <div className="mb-3 flex items-center gap-2">
        <span
          className={cn('inline-block h-2 w-2 rounded-full', status.dot, {
            'animate-pulse': crew.status === 'active',
          })}
        />
        <span className={cn('text-xs', status.color)}>{status.label}</span>
        {activeCount > 0 && (
          <span className="ml-auto rounded-full bg-[var(--theme-accent)]/20 px-2 py-0.5 text-[10px] font-medium text-[var(--theme-accent)]">
            {activeCount} running
          </span>
        )}
      </div>

      {/* Name */}
      <Link
        to="/crews/$crewId"
        params={{ crewId: crew.id }}
        className="block text-sm font-semibold text-[var(--theme-text)] hover:text-[var(--theme-accent)] transition-colors mb-1"
      >
        {crew.name}
      </Link>

      {/* Goal */}
      {crew.goal && (
        <p className="mb-3 line-clamp-2 text-xs text-[var(--theme-muted)]">
          {crew.goal}
        </p>
      )}

      {/* Members */}
      <div className="flex flex-wrap gap-1 mb-3">
        {crew.members.map((m) => (
          <span
            key={m.id}
            title={`${m.displayName} — ${m.roleLabel} (${m.status})`}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border border-[var(--theme-border)] px-2 py-0.5 text-[10px]',
              m.status === 'running' && 'border-[var(--theme-accent)]/40 bg-[var(--theme-accent)]/10',
            )}
          >
            <span>{m.displayName.split(' ')[0]}</span>
            <span className="text-[var(--theme-muted)]">{m.role}</span>
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-[var(--theme-muted)]">
        <span>
          {crew.members.length} agent{crew.members.length !== 1 ? 's' : ''}
        </span>
        <span>{new Date(crew.updatedAt).toLocaleDateString()}</span>
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.preventDefault()
          onDelete(crew.id)
        }}
        title="Delete crew"
        className="absolute right-3 top-3 rounded-lg p-1.5 text-[var(--theme-muted)] opacity-0 transition-all hover:text-[var(--theme-danger)] group-hover:opacity-100"
      >
        <HugeiconsIcon icon={Delete01Icon} size={14} />
      </button>
    </div>
  )
}

export function CrewsScreen() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)

  const crewsQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchCrews,
    refetchInterval: 10_000,
  })

  const createMutation = useMutation({
    mutationFn: createCrew,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      setCreateOpen(false)
      toast('Crew created')
    },
    onError: (err) => {
      toast(err instanceof Error ? err.message : 'Failed to create crew', {
        type: 'error',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCrew,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      toast('Crew deleted')
    },
    onError: () => {
      toast('Failed to delete crew', { type: 'error' })
    },
  })

  const crews = crewsQuery.data ?? []

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--theme-border)] px-6 py-4">
        <div className="flex items-center gap-2.5">
          <HugeiconsIcon
            icon={UserMultiple02Icon}
            size={18}
            className="text-[var(--theme-accent)]"
          />
          <h1 className="text-base font-semibold text-[var(--theme-text)]">
            Crews
          </h1>
          {crews.length > 0 && (
            <span className="rounded-full bg-[var(--theme-hover)] px-2 py-0.5 text-xs text-[var(--theme-muted)]">
              {crews.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--theme-accent)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
        >
          <HugeiconsIcon icon={Add01Icon} size={14} />
          New Crew
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {crewsQuery.isLoading ? (
          <div className="flex h-40 items-center justify-center text-sm text-[var(--theme-muted)]">
            Loading crews…
          </div>
        ) : crews.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--theme-card)] border border-[var(--theme-border)]">
              <HugeiconsIcon
                icon={UserMultiple02Icon}
                size={24}
                className="text-[var(--theme-muted)]"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--theme-text)]">
                No crews yet
              </p>
              <p className="mt-1 text-xs text-[var(--theme-muted)]">
                Create a crew to coordinate multiple agents on a shared goal.
              </p>
            </div>
            <button
              onClick={() => setCreateOpen(true)}
              className="rounded-lg bg-[var(--theme-accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Create your first crew
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {crews.map((crew) => (
              <CrewCard
                key={crew.id}
                crew={crew}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>

      <CreateCrewDialog
        open={createOpen}
        isSubmitting={createMutation.isPending}
        onOpenChange={setCreateOpen}
        onSubmit={(input) => createMutation.mutate(input)}
      />
    </div>
  )
}
