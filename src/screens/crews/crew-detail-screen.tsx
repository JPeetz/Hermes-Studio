'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  BarChartIcon,
  Copy01Icon,
  Delete01Icon,
  MessageMultiple01Icon,
  PlayIcon,
  Share01Icon,
  UserMultiple02Icon,
} from '@hugeicons/core-free-icons'
import { DispatchDialog } from './components/dispatch-dialog'
import { WorkflowBuilder } from './components/workflow-builder'
import { CostPanel } from './components/cost-panel'
import { Tabs, TabsList, TabsTab, TabsPanel } from '@/components/ui/tabs'
import type { Crew, CrewMember, CrewMemberStatus } from '@/lib/crews-api'
import {
  cloneCrew,
  deleteCrew,
  dispatchTask,
  fetchCrew,
  updateCrew,
  updateMemberStatus,
} from '@/lib/crews-api'
import { fetchAndRecordUsage } from '@/lib/cost-api'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

// ─── Types for SSE events from /api/chat-events ──────────────────────────────

interface ChatEvent {
  type: string
  data: Record<string, unknown>
}

interface ActivityEntry {
  id: string
  sessionKey: string
  memberName: string
  text: string
  ts: number
  kind: 'message' | 'tool' | 'error' | 'status'
}

// ─── Member card ─────────────────────────────────────────────────────────────

const STATUS_INDICATOR: Record<
  CrewMemberStatus,
  { dot: string; label: string; pulse: boolean }
> = {
  idle: { dot: 'bg-[var(--theme-muted)]', label: 'Idle', pulse: false },
  running: { dot: 'bg-[var(--theme-success)]', label: 'Running', pulse: true },
  done: { dot: 'bg-[var(--theme-accent)]', label: 'Done', pulse: false },
  error: { dot: 'bg-[var(--theme-danger)]', label: 'Error', pulse: false },
}

function MemberCard({ member }: { member: CrewMember }) {
  const indicator = STATUS_INDICATOR[member.status]
  return (
    <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className={cn('text-sm font-semibold', member.color)}>
            {member.displayName}
          </p>
          <p className="text-xs text-[var(--theme-muted)]">{member.roleLabel}</p>
        </div>
        <span
          className={cn(
            'mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full',
            indicator.dot,
            indicator.pulse && 'animate-pulse',
          )}
          title={indicator.label}
        />
      </div>

      <div className="mb-3 flex items-center gap-1.5">
        <span className="rounded-full border border-[var(--theme-border)] px-2 py-0.5 text-[10px] text-[var(--theme-muted)]">
          {member.role}
        </span>
        <span className={cn('text-[10px]', indicator.dot.replace('bg-', 'text-'))}>
          {indicator.label}
        </span>
      </div>

      {member.lastActivity && (
        <p className="mb-3 line-clamp-2 text-xs text-[var(--theme-muted)]">
          {member.lastActivity}
        </p>
      )}

      {member.profileName && (
        <p className="mb-2 text-[10px] text-[var(--theme-muted)]">
          📁 {member.profileName} workspace
        </p>
      )}
      <Link
        to="/chat/$sessionKey"
        params={{ sessionKey: member.sessionKey }}
        className="flex items-center gap-1.5 text-xs text-[var(--theme-accent)] hover:underline"
      >
        <HugeiconsIcon icon={MessageMultiple01Icon} size={12} />
        Open chat
      </Link>
    </div>
  )
}

// ─── Activity feed ────────────────────────────────────────────────────────────

function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries])

  if (entries.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-[var(--theme-muted)]">
        No activity yet — dispatch a task to get started.
      </div>
    )
  }

  return (
    <div className="space-y-2 overflow-y-auto max-h-80 pr-1">
      {entries.map((entry) => (
        <div key={entry.id} className="flex gap-2.5">
          <div className="mt-0.5 shrink-0">
            <div
              className={cn('h-1.5 w-1.5 rounded-full mt-1.5', {
                'bg-[var(--theme-success)]': entry.kind === 'message',
                'bg-[var(--theme-accent)]': entry.kind === 'tool',
                'bg-[var(--theme-danger)]': entry.kind === 'error',
                'bg-[var(--theme-muted)]': entry.kind === 'status',
              })}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-[var(--theme-muted)]">
              {entry.memberName} ·{' '}
              {new Date(entry.ts).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </p>
            <p className="text-xs text-[var(--theme-text)] break-words">
              {entry.text}
            </p>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export function CrewDetailScreen() {
  const { crewId } = useParams({ from: '/crews/$crewId' })
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'overview' | 'workflow' | 'usage'>('overview')
  const [dispatchOpen, setDispatchOpen] = useState(false)
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [liveMembers, setLiveMembers] = useState<
    Record<string, CrewMemberStatus>
  >({})

  const crewQuery = useQuery({
    queryKey: ['crew', crewId],
    queryFn: () => fetchCrew(crewId),
    refetchInterval: 15_000,
  })

  const crew = crewQuery.data

  // Build a lookup: sessionKey → member for this crew
  const memberBySession = crew
    ? Object.fromEntries(crew.members.map((m) => [m.sessionKey, m]))
    : {}

  const deleteMutation = useMutation({
    mutationFn: () => deleteCrew(crewId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['crews'] })
      toast('Crew deleted')
      void navigate({ to: '/crews' })
    },
    onError: () => toast('Failed to delete crew', { type: 'error' }),
  })

  const cloneMutation = useMutation({
    mutationFn: () => cloneCrew(crewId),
    onSuccess: (cloned) => {
      void queryClient.invalidateQueries({ queryKey: ['crews'] })
      toast(`Cloned as "${cloned.name}"`)
      void navigate({ to: '/crews/$crewId', params: { crewId: cloned.id } })
    },
    onError: (err) => toast(err instanceof Error ? err.message : 'Failed to clone crew', { type: 'error' }),
  })

  const dispatchMutation = useMutation({
    mutationFn: ({ task, target }: { task: string; target: 'all' | string }) =>
      dispatchTask(crewId, task, target),
    onSuccess: ({ dispatched }) => {
      setDispatchOpen(false)
      toast(`Task dispatched to ${dispatched.length} agent${dispatched.length !== 1 ? 's' : ''}`)
      // Optimistically set targeted members to running
      setLiveMembers((prev) => {
        const next = { ...prev }
        for (const sk of dispatched) next[sk] = 'running'
        return next
      })
    },
    onError: (err) =>
      toast(err instanceof Error ? err.message : 'Dispatch failed', {
        type: 'error',
      }),
  })

  // ── SSE event listener ──────────────────────────────────────────────────────
  const addActivity = useCallback(
    (entry: Omit<ActivityEntry, 'id'>) => {
      setActivity((prev) => {
        if (prev.length > 200) prev = prev.slice(-150)
        return [...prev, { ...entry, id: `${Date.now()}-${Math.random()}` }]
      })
    },
    [],
  )

  useEffect(() => {
    if (!crew) return

    const sessionKeys = new Set(crew.members.map((m) => m.sessionKey))
    const es = new EventSource('/api/chat-events')

    es.addEventListener('message', (e) => {
      try {
        const payload = JSON.parse(e.data) as Record<string, unknown>
        const sk =
          typeof payload.sessionKey === 'string' ? payload.sessionKey : null
        if (!sk || !sessionKeys.has(sk)) return
        const member = memberBySession[sk]
        if (!member) return

        const text =
          typeof payload.content === 'string'
            ? payload.content
            : typeof payload.text === 'string'
              ? payload.text
              : null
        if (text) {
          addActivity({
            sessionKey: sk,
            memberName: member.displayName,
            text: text.slice(0, 200),
            ts: Date.now(),
            kind: 'message',
          })
          // Update last activity in server store
          void updateMemberStatus(crewId, sk, 'running', text.slice(0, 100))
        }
      } catch {
        /* ignore parse errors */
      }
    })

    const handleEvent = (kind: ActivityEntry['kind']) => (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data as string) as Record<string, unknown>
        const sk =
          typeof payload.sessionKey === 'string' ? payload.sessionKey : null
        if (!sk || !sessionKeys.has(sk)) return
        const member = memberBySession[sk]
        if (!member) return

        let text = ''
        if (kind === 'tool') {
          text = `🔧 ${typeof payload.name === 'string' ? payload.name : 'tool'}`
          if (typeof payload.phase === 'string') text += ` (${payload.phase})`
        } else if (kind === 'error') {
          text =
            typeof payload.message === 'string'
              ? payload.message
              : 'An error occurred'
        } else {
          text = typeof payload.text === 'string' ? payload.text : ''
        }
        if (!text) return

        addActivity({
          sessionKey: sk,
          memberName: member.displayName,
          text,
          ts: Date.now(),
          kind,
        })
      } catch {
        /* ignore */
      }
    }

    // Track run lifecycle events to update member status
    const handleRunStart = (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data as string) as Record<string, unknown>
        const sk =
          typeof payload.sessionKey === 'string' ? payload.sessionKey : null
        if (!sk || !sessionKeys.has(sk)) return
        setLiveMembers((prev) => ({ ...prev, [sk]: 'running' }))
        void updateMemberStatus(crewId, sk, 'running')
      } catch {
        /* ignore */
      }
    }

    const handleRunEnd = (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data as string) as Record<string, unknown>
        const sk =
          typeof payload.sessionKey === 'string' ? payload.sessionKey : null
        if (!sk || !sessionKeys.has(sk)) return
        const member = memberBySession[sk]
        const status =
          payload.error || payload.errorMessage ? 'error' : 'done'
        setLiveMembers((prev) => ({ ...prev, [sk]: status }))
        void updateMemberStatus(crewId, sk, status)
        // Fetch token counts from Hermes and record them in the cost store
        if (member) {
          void fetchAndRecordUsage(
            crewId,
            { sessionKey: sk, displayName: member.displayName, model: member.model },
            queryClient,
          )
        }
      } catch {
        /* ignore */
      }
    }

    es.addEventListener('tool', handleEvent('tool'))
    es.addEventListener('error', handleEvent('error'))
    es.addEventListener('run_start', handleRunStart)
    es.addEventListener('run_end', handleRunEnd)
    es.addEventListener('started', handleRunStart)
    es.addEventListener('done', handleRunEnd)

    return () => {
      es.close()
    }
  }, [crew, crewId, addActivity]) // eslint-disable-line react-hooks/exhaustive-deps

  if (crewQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[var(--theme-muted)]">
        Loading crew…
      </div>
    )
  }

  if (!crew) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-sm text-[var(--theme-muted)]">Crew not found.</p>
        <Link
          to="/crews"
          className="text-xs text-[var(--theme-accent)] hover:underline"
        >
          ← Back to crews
        </Link>
      </div>
    )
  }

  // Merge live status with persisted status
  const displayMembers: CrewMember[] = crew.members.map((m) => ({
    ...m,
    status: liveMembers[m.sessionKey] ?? m.status,
  }))

  const runningCount = displayMembers.filter(
    (m) => m.status === 'running',
  ).length

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[var(--theme-border)] px-6 py-4">
        <Link
          to="/crews"
          className="rounded-lg p-1.5 text-[var(--theme-muted)] transition-colors hover:bg-[var(--theme-hover)] hover:text-[var(--theme-text)]"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
        </Link>

        <div className="flex items-center gap-2 min-w-0">
          <HugeiconsIcon
            icon={UserMultiple02Icon}
            size={16}
            className="shrink-0 text-[var(--theme-accent)]"
          />
          <h1 className="truncate text-base font-semibold text-[var(--theme-text)]">
            {crew.name}
          </h1>
          {runningCount > 0 && (
            <span className="shrink-0 rounded-full bg-[var(--theme-success)]/20 px-2 py-0.5 text-[10px] font-medium text-[var(--theme-success)]">
              {runningCount} running
            </span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setDispatchOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--theme-accent)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
          >
            <HugeiconsIcon icon={PlayIcon} size={13} />
            Dispatch Task
          </button>
          <button
            onClick={() => cloneMutation.mutate()}
            disabled={cloneMutation.isPending}
            title="Clone crew"
            className="rounded-lg p-1.5 text-[var(--theme-muted)] transition-colors hover:bg-[var(--theme-hover)] hover:text-[var(--theme-text)] disabled:opacity-40"
          >
            <HugeiconsIcon icon={Copy01Icon} size={16} />
          </button>
          <button
            onClick={() => deleteMutation.mutate()}
            title="Delete crew"
            className="rounded-lg p-1.5 text-[var(--theme-muted)] transition-colors hover:bg-[var(--theme-hover)] hover:text-[var(--theme-danger)]"
          >
            <HugeiconsIcon icon={Delete01Icon} size={16} />
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-[var(--theme-border)] px-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList variant="underline">
            <TabsTab value="overview">
              <HugeiconsIcon icon={UserMultiple02Icon} size={13} strokeWidth={1.7} />
              Overview
            </TabsTab>
            <TabsTab value="workflow">
              <HugeiconsIcon icon={Share01Icon} size={13} strokeWidth={1.7} />
              Workflow
            </TabsTab>
            <TabsTab value="usage">
              <HugeiconsIcon icon={BarChartIcon} size={13} strokeWidth={1.7} />
              Usage
            </TabsTab>
          </TabsList>
        </Tabs>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab === 'overview' && (
          <div className="h-full overflow-y-auto space-y-6 p-6">
            {/* Goal */}
            {crew.goal && (
              <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-4">
                <p className="mb-1 text-xs font-medium text-[var(--theme-muted)]">
                  Goal
                </p>
                <p className="text-sm text-[var(--theme-text)]">{crew.goal}</p>
              </div>
            )}

            {/* Agent grid */}
            <div>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--theme-muted)]">
                Agents ({crew.members.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {displayMembers.map((member) => (
                  <MemberCard key={member.id} member={member} />
                ))}
              </div>
            </div>

            {/* Activity feed */}
            <div>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--theme-muted)]">
                Live Activity
              </h2>
              <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-4">
                <ActivityFeed entries={activity} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workflow' && (
          <WorkflowBuilder
            crewId={crewId}
            crew={crew}
            displayMembers={displayMembers}
          />
        )}

        {activeTab === 'usage' && (
          <CostPanel crewId={crewId} members={displayMembers} />
        )}
      </div>

      {/* Dispatch dialog */}
      {dispatchOpen && (
        <DispatchDialog
          open={dispatchOpen}
          crew={crew}
          isSubmitting={dispatchMutation.isPending}
          onOpenChange={setDispatchOpen}
          onSubmit={(task, target) =>
            dispatchMutation.mutate({ task, target })
          }
        />
      )}
    </div>
  )
}
