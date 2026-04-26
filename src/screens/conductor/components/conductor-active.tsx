/**
 * Conductor active phase — live office view, worker cards, abort/pause,
 * timeout warning, progress bar.
 *
 * Ported from upstream conductor.tsx active phase rendering.
 */

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { OfficeView } from './office-view'
import { CyclingStatus, WorkingIndicator } from './mission-event-log'
import { getAgentPersona } from './agent-avatar'
import type { AgentWorkingRow } from './office-view'
import type { useConductorGateway } from '../hooks/use-conductor-gateway'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ConductorActiveProps = {
  conductor: ReturnType<typeof useConductorGateway>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatElapsedMilliseconds(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

function formatElapsedTime(startIso: string | null | undefined, endMs: number): string {
  if (!startIso) return '0s'
  const startMs = new Date(startIso).getTime()
  if (!Number.isFinite(startMs)) return '0s'
  return formatElapsedMilliseconds(endMs - startMs)
}

function formatRelativeTime(value: string | null | undefined, now: number): string {
  if (!value) return 'just now'
  const ms = new Date(value).getTime()
  if (!Number.isFinite(ms)) return 'just now'
  const diffSeconds = Math.max(0, Math.floor((now - ms) / 1000))
  if (diffSeconds < 10) return 'just now'
  if (diffSeconds < 60) return `${diffSeconds}s ago`
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  return `${Math.floor(diffMinutes / 60)}h ago`
}

function getShortModelName(model: string | null | undefined): string {
  if (!model) return 'Unknown'
  const parts = model.split('/')
  return parts[parts.length - 1] || model
}

function getWorkerDot(status: 'running' | 'complete' | 'stale' | 'idle') {
  if (status === 'complete') return { dotClass: 'bg-emerald-400', label: 'Complete' }
  if (status === 'running') return { dotClass: 'bg-sky-400 animate-pulse', label: 'Running' }
  if (status === 'idle') return { dotClass: 'bg-amber-400', label: 'Idle' }
  return { dotClass: 'bg-red-400', label: 'Stale' }
}

function getWorkerBorderClass(status: 'running' | 'complete' | 'stale' | 'idle') {
  if (status === 'complete') return 'border-l-emerald-400'
  if (status === 'running') return 'border-l-sky-400'
  if (status === 'idle') return 'border-l-amber-400'
  return 'border-l-red-400'
}

const WORKING_STEPS = [
  'Reviewing the brief...',
  'Scanning existing patterns...',
  'Drafting the implementation...',
  'Thinking through edge cases...',
  'Polishing the design...',
  'Wiring up components...',
  'Checking the layout...',
  'Almost there...',
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConductorActive({ conductor }: ConductorActiveProps) {
  const [now, setNow] = useState(() => Date.now())
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  // Tick every second while active
  useEffect(() => {
    if (conductor.isPaused) {
      setNow(conductor.pausedAtMs ?? Date.now())
      return
    }
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [conductor.isPaused, conductor.pausedAtMs])

  const totalWorkers = conductor.workers.length
  const completedWorkers = conductor.workers.filter((w) => w.status === 'complete').length
  const activeWorkerCount = conductor.activeWorkers.length
  const missionProgress = totalWorkers > 0 ? Math.round((completedWorkers / totalWorkers) * 100) : 0

  // Build office agent rows
  const officeAgentRows = useMemo<AgentWorkingRow[]>(() => {
    if (conductor.workers.length > 0) {
      return conductor.workers.map((worker, index) => {
        const persona = getAgentPersona(index)
        const currentTask = conductor.tasks.find((t) => t.workerKey === worker.key && t.status === 'running')?.title
        const lastLine = conductor.workerOutputs[worker.key] ?? ''
        const isWorkerPaused = conductor.isPaused && (worker.status === 'running' || worker.status === 'idle')

        return {
          id: worker.key,
          name: persona.name,
          modelId: worker.model || 'auto',
          roleDescription: worker.displayName,
          status: isWorkerPaused ? 'paused' as const : worker.status === 'complete' ? 'idle' as const : worker.status === 'stale' ? 'error' as const : 'active' as const,
          lastLine: isWorkerPaused ? 'Paused' : lastLine || undefined,
          lastAt: worker.updatedAt ? new Date(worker.updatedAt).getTime() : undefined,
          taskCount: conductor.tasks.filter((t) => t.workerKey === worker.key).length,
          currentTask: isWorkerPaused ? 'Paused' : currentTask,
          sessionKey: worker.key,
        }
      })
    }

    return [{
      id: 'conductor-placeholder-agent',
      name: 'Nova',
      modelId: conductor.conductorSettings.workerModel || 'auto',
      roleDescription: 'Waiting for workers',
      status: 'spawning' as const,
      lastLine: conductor.goal || 'Preparing the office...',
      taskCount: 0,
      currentTask: conductor.goal || 'Preparing the office...',
      sessionKey: 'conductor-placeholder-agent',
    }]
  }, [conductor.workers, conductor.tasks, conductor.workerOutputs, conductor.isPaused, conductor.goal, conductor.conductorSettings.workerModel])

  // Clear stale selected task
  useEffect(() => {
    if (!selectedTaskId) return
    if (!conductor.tasks.some((t) => t.id === selectedTaskId)) setSelectedTaskId(null)
  }, [conductor.tasks, selectedTaskId])

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Header badge */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--theme-border)] bg-[var(--theme-card)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--theme-muted)]">
          Conductor
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Mission info + progress */}
      <section className="overflow-hidden rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-card)] px-5 py-5 shadow-[0_24px_80px_var(--theme-shadow)]">
        <div className="text-center">
          <h1 className="line-clamp-2 text-xl font-semibold tracking-tight text-[var(--theme-text)] sm:text-2xl">{conductor.goal}</h1>
          <div className="mt-2 flex items-center justify-center gap-2 text-xs text-[var(--theme-muted)]">
            <span>{formatElapsedMilliseconds(conductor.isPaused ? conductor.pausedElapsedMs : conductor.missionElapsedMs)}</span>
            <span className="text-[var(--theme-border)]">&middot;</span>
            <span>{completedWorkers}/{Math.max(totalWorkers, 1)} complete</span>
            <span className="text-[var(--theme-border)]">&middot;</span>
            <span>{activeWorkerCount} active</span>
          </div>
          {conductor.isPaused && (
            <div className="mt-3 flex justify-center">
              <span className="rounded-full border border-[var(--theme-accent)] bg-[var(--theme-accent-soft)] px-3 py-1 text-xs font-medium text-[var(--theme-accent-strong)] animate-pulse">
                Paused
              </span>
            </div>
          )}
        </div>
        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-[var(--theme-border)]">
          <div className="h-full rounded-full bg-[var(--theme-accent)] transition-[width] duration-500 ease-out" style={{ width: `${missionProgress}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => void conductor.stopMission()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--theme-danger-border,color-mix(in_srgb,var(--theme-danger)_35%,white))] bg-[var(--theme-danger-soft,color-mix(in_srgb,var(--theme-danger)_12%,transparent))] px-3 py-1.5 text-xs font-medium text-[var(--theme-danger)] transition-colors hover:bg-[var(--theme-danger-soft-strong,color-mix(in_srgb,var(--theme-danger)_18%,transparent))]"
          >
            <span>&#9632;</span> Stop Mission
          </button>
          <button
            type="button"
            disabled={!conductor.orchestratorSessionKey || conductor.isPausing}
            onClick={async () => {
              if (!conductor.orchestratorSessionKey) return
              try {
                await conductor.pauseAgent(conductor.orchestratorSessionKey, !conductor.isPaused)
              } catch { /* best effort */ }
            }}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              !conductor.orchestratorSessionKey || conductor.isPausing
                ? 'cursor-not-allowed border-[var(--theme-border)] bg-[var(--theme-card2)] text-[var(--theme-muted)] opacity-50'
                : conductor.isPaused
                  ? 'border-[var(--theme-accent)] bg-[var(--theme-accent-soft)] text-[var(--theme-accent-strong)] hover:bg-[var(--theme-accent-soft-strong)]'
                  : 'border-[var(--theme-border)] bg-[var(--theme-card2)] text-[var(--theme-muted)] hover:border-[var(--theme-accent)] hover:text-[var(--theme-text)]',
            )}
          >
            <span>{conductor.isPaused ? '\u25B6' : '\u23F8'}</span> {conductor.isPausing ? '...' : conductor.isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </section>

      {/* Timeout warning */}
      {conductor.timeoutWarning && (
        <section className="rounded-2xl border border-[var(--theme-warning-border)] bg-[var(--theme-warning-soft)] px-5 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--theme-warning)]">Mission appears stalled — no activity for 60 seconds</p>
              <p className="mt-1 text-xs text-[var(--theme-muted)]">Sometimes the workers are still alive, but the stream went quiet. Your call.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                onClick={conductor.dismissTimeoutWarning}
                className="rounded-xl border border-[var(--theme-warning-border)] bg-[var(--theme-card)] px-4 text-[var(--theme-text)] hover:bg-[var(--theme-card2)]"
              >
                Keep Waiting
              </Button>
              <Button
                type="button"
                onClick={() => void conductor.stopMission()}
                className="rounded-xl border border-[var(--theme-warning-border)] bg-[var(--theme-warning-soft)] px-4 text-[var(--theme-warning)] hover:bg-[var(--theme-warning-soft-strong)]"
              >
                Stop Mission
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Office view */}
      <section className="h-[360px] overflow-hidden rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-card)] shadow-[0_24px_80px_var(--theme-shadow)]">
        <OfficeView
          agentRows={officeAgentRows}
          missionRunning
          onViewOutput={() => {}}
          processType="parallel"
          companyName="Conductor Office"
          containerHeight={360}
          hideHeader
        />
      </section>

      {/* Task list + Worker cards */}
      {conductor.tasks.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--theme-muted)]">
              Tasks ({conductor.tasks.filter((t) => t.status === 'complete').length}/{conductor.tasks.length})
            </h2>
            {conductor.tasks.map((task) => {
              const isSelected = selectedTaskId === task.id
              const statusDot =
                task.status === 'complete' ? 'bg-emerald-400'
                : task.status === 'running' ? 'bg-sky-400 animate-pulse'
                : task.status === 'failed' ? 'bg-red-400'
                : 'bg-zinc-500'
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => setSelectedTaskId(isSelected ? null : task.id)}
                  className={cn(
                    'w-full rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
                    isSelected
                      ? 'border-[var(--theme-accent)] bg-[var(--theme-accent-soft)]'
                      : 'border-[var(--theme-border)] bg-[var(--theme-card)] hover:border-[var(--theme-accent)]',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn('size-2 shrink-0 rounded-full', statusDot)} />
                    <span className="min-w-0 truncate font-medium text-[var(--theme-text)]">{task.title}</span>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="space-y-3">
            {selectedTaskId && (
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--theme-muted)]">Task Output</h2>
            )}
            <WorkerCards
              workers={(() => {
                const selectedTask = selectedTaskId ? conductor.tasks.find((t) => t.id === selectedTaskId) : null
                return selectedTask?.workerKey
                  ? conductor.workers.filter((w) => w.key === selectedTask.workerKey)
                  : conductor.workers
              })()}
              conductor={conductor}
              now={now}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <WorkerCards workers={conductor.workers} conductor={conductor} now={now} />
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// WorkerCards sub-component
// ---------------------------------------------------------------------------

function WorkerCards({
  workers,
  conductor,
  now,
}: {
  workers: ReturnType<typeof useConductorGateway>['workers']
  conductor: Pick<ReturnType<typeof useConductorGateway>, 'workerOutputs' | 'isPaused' | 'pausedAtMs' | 'missionStartedAt'>
  now: number
}) {
  if (workers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--theme-border)] bg-[var(--theme-card)] px-4 py-8 text-center text-sm text-[var(--theme-muted)] md:col-span-2">
        <div className="flex items-center justify-center gap-3">
          <div className="size-4 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
          <span>Spawning workers...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {workers.map((worker, index) => {
        const dot = getWorkerDot(worker.status)
        const persona = getAgentPersona(index)
        const workerOutput = conductor.workerOutputs[worker.key] ?? ''
        const workerStartedAt =
          typeof worker.raw.createdAt === 'string' ? worker.raw.createdAt
          : typeof worker.raw.startedAt === 'string' ? worker.raw.startedAt
          : conductor.missionStartedAt
        const workerEndTime =
          worker.status === 'complete' || worker.status === 'stale'
            ? new Date(worker.updatedAt ?? new Date().toISOString()).getTime()
            : conductor.isPaused
              ? (conductor.pausedAtMs ?? now)
              : now

        return (
          <div
            key={worker.key}
            className={cn(
              'overflow-hidden rounded-2xl border border-[var(--theme-border)] border-l-4 bg-[var(--theme-card)] px-4 py-3',
              getWorkerBorderClass(worker.status),
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn('size-2.5 rounded-full', dot.dotClass)} />
                  <p className="truncate text-sm font-medium text-[var(--theme-text)]">
                    {persona.emoji} {persona.name} <span className="text-[var(--theme-muted)]">&middot;</span> {worker.label}
                  </p>
                </div>
                <p className="mt-1 text-xs text-[var(--theme-muted-2)]">{worker.displayName}</p>
              </div>
              <span className="rounded-full border border-[var(--theme-border)] bg-[var(--theme-card2)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--theme-muted)]">
                {dot.label}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card2)] px-3 py-2">
                <p className="text-[var(--theme-muted)]">Model</p>
                <p className="mt-1 truncate text-[var(--theme-text)]">{getShortModelName(worker.model)}</p>
              </div>
              <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card2)] px-3 py-2">
                <p className="text-[var(--theme-muted)]">Tokens</p>
                <p className="mt-1 text-[var(--theme-text)]">{worker.tokenUsageLabel}</p>
              </div>
              <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card2)] px-3 py-2">
                <p className="text-[var(--theme-muted)]">Elapsed</p>
                <p className="mt-1 text-[var(--theme-text)]">{formatElapsedTime(workerStartedAt, workerEndTime)}</p>
              </div>
              <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card2)] px-3 py-2">
                <p className="text-[var(--theme-muted)]">Last update</p>
                <p className="mt-1 text-[var(--theme-text)]">{formatRelativeTime(worker.updatedAt, now)}</p>
              </div>
            </div>

            <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)] px-4 py-4">
              {workerOutput ? (
                <pre className="max-h-[400px] max-w-none overflow-auto whitespace-pre-wrap text-sm text-[var(--theme-text)]">{workerOutput}</pre>
              ) : (
                <CyclingStatus steps={WORKING_STEPS} intervalMs={3500} isPaused={conductor.isPaused} />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
