'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  Delete01Icon,
  GridViewIcon,
  PauseIcon,
  UserMultiple02Icon,
  ActivitySparkIcon,
} from '@hugeicons/core-free-icons'
import { useMemo } from 'react'
import { CreateCrewDialog } from './components/create-crew-dialog'
import { TemplatesGallery } from './components/templates-gallery'
import type { Crew } from '@/lib/crews-api'
import type { CrewMemberRole } from '@/lib/crews-api'
import {
  cloneCrew,
  createCrew,
  deleteCrew,
  fetchCrews,
} from '@/lib/crews-api'
import type { CrewTemplate } from '@/lib/templates-api'
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

// ─── Aggregate metrics strip ─────────────────────────────────────────────────

function StatChip({
  label,
  value,
  accent,
  pulse,
  icon,
}: {
  label: string
  value: number | string
  accent?: string
  pulse?: boolean
  icon?: React.ReactNode
}) {
  return (
    <div
      className="flex min-w-0 flex-1 flex-col gap-1 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] px-4 py-3"
    >
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--theme-muted)]">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {pulse && (
          <span className="inline-block h-2 w-2 shrink-0 animate-pulse rounded-full bg-[var(--theme-success)]" />
        )}
        <span
          className="text-2xl font-bold tabular-nums"
          style={{ color: accent ?? 'var(--theme-text)' }}
        >
          {value}
        </span>
      </div>
    </div>
  )
}

function RecentActivityFeed({ crews }: { crews: Crew[] }) {
  const items = useMemo(() => {
    const entries: Array<{ memberName: string; crewName: string; text: string; ts: number }> = []
    for (const crew of crews) {
      for (const m of crew.members) {
        if (m.lastActivity) {
          entries.push({
            memberName: m.displayName,
            crewName: crew.name,
            text: m.lastActivity,
            ts: crew.updatedAt,
          })
        }
      }
    }
    return entries.sort((a, b) => b.ts - a.ts).slice(0, 6)
  }, [crews])

  if (items.length === 0) return null

  return (
    <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] px-4 py-3">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--theme-muted)]">
        Recent Activity
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className="shrink-0 font-medium text-[var(--theme-accent)]">
              {item.memberName}
            </span>
            <span className="text-[var(--theme-muted)]">·</span>
            <span className="truncate text-[var(--theme-text)]">{item.text}</span>
            <span className="ml-auto shrink-0 text-[var(--theme-muted)]">{item.crewName}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatsStrip({ crews }: { crews: Crew[] }) {
  const stats = useMemo(() => {
    const totalAgents = crews.reduce((sum, c) => sum + c.members.length, 0)
    const runningAgents = crews.reduce(
      (sum, c) => sum + c.members.filter((m) => m.status === 'running').length,
      0,
    )
    return {
      total: crews.length,
      active: crews.filter((c) => c.status === 'active').length,
      paused: crews.filter((c) => c.status === 'paused').length,
      complete: crews.filter((c) => c.status === 'complete').length,
      totalAgents,
      runningAgents,
    }
  }, [crews])

  if (crews.length === 0) return null

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap gap-3">
        <StatChip
          label="Crews"
          value={stats.total}
          icon={<HugeiconsIcon icon={UserMultiple02Icon} size={12} strokeWidth={1.8} className="text-[var(--theme-muted)]" />}
        />
        <StatChip
          label="Active"
          value={stats.active}
          accent={stats.active > 0 ? 'var(--theme-success)' : undefined}
          pulse={stats.active > 0}
          icon={<HugeiconsIcon icon={ActivitySparkIcon} size={12} strokeWidth={1.8} className="text-[var(--theme-muted)]" />}
        />
        <StatChip
          label="Paused"
          value={stats.paused}
          icon={<HugeiconsIcon icon={PauseIcon} size={12} strokeWidth={1.8} className="text-[var(--theme-muted)]" />}
        />
        <StatChip
          label="Complete"
          value={stats.complete}
          accent={stats.complete > 0 ? 'var(--theme-accent)' : undefined}
          icon={<HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} strokeWidth={1.8} className="text-[var(--theme-muted)]" />}
        />
        <StatChip
          label="Agents"
          value={stats.totalAgents}
          icon={<HugeiconsIcon icon={UserMultiple02Icon} size={12} strokeWidth={1.8} className="text-[var(--theme-muted)]" />}
        />
        <StatChip
          label="Running"
          value={stats.runningAgents}
          accent={stats.runningAgents > 0 ? 'var(--theme-success)' : undefined}
          pulse={stats.runningAgents > 0}
          icon={<HugeiconsIcon icon={ActivitySparkIcon} size={12} strokeWidth={1.8} className="text-[var(--theme-muted)]" />}
        />
      </div>
      <RecentActivityFeed crews={crews} />
    </div>
  )
}

function CrewCard({
  crew,
  onDelete,
  onClone,
  isCloning,
}: {
  crew: Crew
  onDelete: (id: string) => void
  onClone: (id: string) => void
  isCloning: boolean
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

      {/* Action buttons */}
      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-all group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.preventDefault()
            onClone(crew.id)
          }}
          disabled={isCloning}
          title="Clone crew"
          className="rounded-lg p-1.5 text-[var(--theme-muted)] transition-colors hover:bg-[var(--theme-hover)] hover:text-[var(--theme-text)] disabled:opacity-40"
        >
          <HugeiconsIcon icon={Copy01Icon} size={14} />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault()
            onDelete(crew.id)
          }}
          title="Delete crew"
          className="rounded-lg p-1.5 text-[var(--theme-muted)] transition-colors hover:bg-[var(--theme-hover)] hover:text-[var(--theme-danger)]"
        >
          <HugeiconsIcon icon={Delete01Icon} size={14} />
        </button>
      </div>
    </div>
  )
}

export function CrewsScreen() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [prefilledName, setPrefilledName] = useState('')
  const [prefilledGoal, setPrefilledGoal] = useState('')
  const [prefilledMembers, setPrefilledMembers] = useState<
    Array<{ persona: string; role: CrewMemberRole }> | undefined
  >(undefined)

  function handleSelectTemplate(template: CrewTemplate) {
    setGalleryOpen(false)
    setPrefilledName(template.name)
    setPrefilledGoal(template.defaultGoal)
    setPrefilledMembers(template.defaultMembers)
    setCreateOpen(true)
  }

  function clearPrefill() {
    setPrefilledName('')
    setPrefilledGoal('')
    setPrefilledMembers(undefined)
  }

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
      clearPrefill()
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

  const cloneMutation = useMutation({
    mutationFn: cloneCrew,
    onSuccess: (crew) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      toast(`Cloned as "${crew.name}"`)
    },
    onError: (err) => {
      toast(err instanceof Error ? err.message : 'Failed to clone crew', { type: 'error' })
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGalleryOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--theme-border)] px-3 py-1.5 text-xs font-medium text-[var(--theme-muted)] transition-colors hover:border-[var(--theme-accent)] hover:text-[var(--theme-text)]"
          >
            <HugeiconsIcon icon={GridViewIcon} size={14} />
            Templates
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--theme-accent)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
          >
            <HugeiconsIcon icon={Add01Icon} size={14} />
            New Crew
          </button>
        </div>
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
          <>
          <StatsStrip crews={crews} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {crews.map((crew) => (
              <CrewCard
                key={crew.id}
                crew={crew}
                onDelete={(id) => deleteMutation.mutate(id)}
                onClone={(id) => cloneMutation.mutate(id)}
                isCloning={cloneMutation.isPending && cloneMutation.variables === crew.id}
              />
            ))}
          </div>
          </>
        )}
      </div>

      <TemplatesGallery
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        onSelectTemplate={handleSelectTemplate}
      />

      <CreateCrewDialog
        open={createOpen}
        isSubmitting={createMutation.isPending}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) clearPrefill()
        }}
        onSubmit={(input) => createMutation.mutate(input)}
        initialName={prefilledName}
        initialGoal={prefilledGoal}
        initialMembers={prefilledMembers}
      />
    </div>
  )
}
