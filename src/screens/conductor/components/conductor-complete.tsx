/**
 * Conductor complete phase — summary, worker outputs, cost tracker,
 * retry/new/export actions.
 *
 * Ported from upstream conductor.tsx complete phase rendering.
 */

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Markdown } from '@/components/prompt-kit/markdown'
import { cn } from '@/lib/utils'
import { CostTracker, estimateTokenCost, formatUsd, type CostWorker } from './cost-tracker'
import { getAgentPersona } from './agent-avatar'
import type { useConductorGateway } from '../hooks/use-conductor-gateway'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ConductorCompleteProps = {
  conductor: ReturnType<typeof useConductorGateway>
  onNewMission: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatElapsedTime(startIso: string | null | undefined, endMs: number): string {
  if (!startIso) return '0s'
  const startMs = new Date(startIso).getTime()
  if (!Number.isFinite(startMs)) return '0s'
  const totalSeconds = Math.max(0, Math.floor((endMs - startMs) / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

function getShortModelName(model: string | null | undefined): string {
  if (!model) return 'Unknown'
  const parts = model.split('/')
  return parts[parts.length - 1] || model
}

function extractProjectPath(text: string): string | null {
  const patterns = [
    /\b(?:Created|Output|Wrote|Saved to|Built|Generated|Written to)\s+(\/tmp\/dispatch-[^\s"')`\]>]+)/gi,
    /\/tmp\/dispatch-[^\s"')`\]>]+/g,
    /\/tmp\/[a-zA-Z0-9][^\s"')`\]>]+/g,
  ]
  for (const pattern of patterns) {
    const match = pattern.exec(text)
    if (match) {
      const raw = match[1] ?? match[0]
      return raw.replace(/[.,;:!?\-`]+$/, '').replace(/\/(index\.html|dist|build)\/?$/i, '')
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConductorComplete({ conductor, onNewMission }: ConductorCompleteProps) {
  const [costExpanded, setCostExpanded] = useState(true)
  const now = useMemo(() => Date.now(), [])

  const totalWorkers = conductor.workers.length
  const completedWorkers = conductor.workers.filter((w) => w.status === 'complete').length
  const totalTokens = conductor.workers.reduce((sum, w) => sum + w.totalTokens, 0)

  const completeMissionCostWorkers = useMemo<CostWorker[]>(
    () =>
      conductor.workers.map((worker, index) => {
        const persona = getAgentPersona(index)
        return {
          id: worker.key,
          label: worker.label,
          totalTokens: worker.totalTokens,
          personaEmoji: persona.emoji,
          personaName: persona.name,
        }
      }),
    [conductor.workers],
  )

  // Build summary text
  const completeSummary = useMemo(() => {
    const isFailed = !!conductor.streamError
    const endMs = conductor.completedAt ? new Date(conductor.completedAt).getTime() : now
    const lines = [
      isFailed ? `Mission failed: ${conductor.streamError}` : 'Mission completed successfully',
      '',
      `**Goal:** ${conductor.goal}`,
      `**Duration:** ${formatElapsedTime(conductor.missionStartedAt, endMs)}`,
    ]
    if (totalWorkers > 0) {
      lines.push(`**Workers:** ${totalWorkers} ran, ${totalTokens.toLocaleString()} tokens`)
    }
    return lines.join('\n')
  }, [conductor.streamError, conductor.goal, conductor.missionStartedAt, conductor.completedAt, totalWorkers, totalTokens, now])

  // Derive output path from worker outputs
  const outputPath = useMemo(() => {
    const texts = [
      ...Object.values(conductor.workerOutputs),
      conductor.streamText,
    ].filter(Boolean)
    for (const text of texts) {
      const path = extractProjectPath(text)
      if (path) return path
    }
    for (const task of conductor.tasks) {
      if (task.output) {
        const path = extractProjectPath(task.output)
        if (path) return path
      }
    }
    return null
  }, [conductor.workerOutputs, conductor.streamText, conductor.tasks])

  // Worker output sections
  const workerOutputSections = useMemo(() => {
    return conductor.workers
      .map((worker, index) => {
        const output = (conductor.workerOutputs[worker.key] ?? '').trim()
        if (!output) return null
        const persona = getAgentPersona(index)
        return { key: worker.key, persona, label: worker.label, output }
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
  }, [conductor.workers, conductor.workerOutputs])

  // Export to clipboard
  const handleExport = () => {
    const sections = [
      `# Mission: ${conductor.goal}`,
      '',
      completeSummary,
      '',
    ]
    if (workerOutputSections.length > 0) {
      sections.push('---', '')
      for (const section of workerOutputSections) {
        sections.push(`## ${section.persona.emoji} ${section.persona.name} - ${section.label}`, '', section.output, '')
      }
    } else if (conductor.streamText) {
      sections.push('---', '', conductor.streamText)
    }
    void navigator.clipboard.writeText(sections.join('\n'))
  }

  return (
    <div className="space-y-6">
      {/* Header badge */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--theme-border)] bg-[var(--theme-card)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--theme-muted)]">
          Conductor
          <span className="size-2 rounded-full bg-emerald-400" />
        </div>
      </div>

      {/* Error banner */}
      {conductor.streamError && (
        <div className="rounded-2xl border border-[var(--theme-danger-border)] bg-[var(--theme-danger-soft)] px-5 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="pt-0.5 text-[var(--theme-danger)]">&#10060;</span>
              <div>
                <p className="text-sm font-semibold text-[var(--theme-danger)]">Mission failed</p>
                <p className="mt-1 text-sm text-[var(--theme-danger)]/90">{conductor.streamError}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                onClick={() => void conductor.retryMission()}
                className="rounded-xl border border-[var(--theme-danger-border)] bg-[var(--theme-danger-soft)] px-4 text-[var(--theme-danger)] hover:bg-[var(--theme-danger-soft-strong)]"
              >
                Retry Mission
              </Button>
              <Button
                type="button"
                onClick={onNewMission}
                className="rounded-xl bg-[var(--theme-accent)] px-4 text-white hover:bg-[var(--theme-accent-strong)]"
              >
                New Mission
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Summary card */}
      <div className="overflow-hidden rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-6 shadow-[0_24px_80px_var(--theme-shadow)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className={cn('text-xs font-semibold uppercase tracking-[0.24em]', conductor.streamError ? 'text-red-400' : 'text-[var(--theme-accent)]')}>
              {conductor.streamError ? 'Mission Stopped' : 'Mission Complete'}
            </p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight text-[var(--theme-text)] sm:text-2xl">{conductor.goal}</h1>
            <p className="mt-2 text-xs text-[var(--theme-muted-2)]">
              {completedWorkers}/{Math.max(totalWorkers, completedWorkers)} workers finished &middot; {formatElapsedTime(conductor.missionStartedAt, conductor.completedAt ? new Date(conductor.completedAt).getTime() : now)} total elapsed
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={onNewMission}
              className="rounded-xl bg-[var(--theme-accent)] px-5 text-white hover:bg-[var(--theme-accent-strong)]"
            >
              New Mission
            </Button>
          </div>
        </div>
      </div>

      {/* Output path */}
      {outputPath && (
        <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] px-5 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--theme-muted)]">Output Path</p>
              <p className="mt-1 truncate text-sm text-[var(--theme-text)]">{outputPath}</p>
            </div>
          </div>
        </div>
      )}

      {/* Worker output panels */}
      {workerOutputSections.length > 0 && (
        <section className="overflow-hidden rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-6 shadow-[0_24px_80px_var(--theme-shadow)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--theme-muted)]">Output</p>
          <p className="mt-1 text-xs text-[var(--theme-muted-2)]">Agent work output</p>
          <div className="mt-4 space-y-4">
            {workerOutputSections.map((section) => (
              <div key={section.key} className="overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)] px-5 py-4">
                <p className="text-xs font-medium text-[var(--theme-muted)]">{section.persona.emoji} {section.persona.name} &middot; {section.label}</p>
                <pre className="mt-3 max-h-[400px] max-w-none overflow-auto whitespace-pre-wrap text-sm text-[var(--theme-text)]">{section.output}</pre>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Fallback: stream text if no worker outputs */}
      {workerOutputSections.length === 0 && conductor.streamText && (
        <section className="overflow-hidden rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-6 shadow-[0_24px_80px_var(--theme-shadow)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--theme-muted)]">Output</p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)] px-5 py-4">
            <Markdown className="max-h-[600px] max-w-none overflow-auto text-sm text-[var(--theme-text)]">{conductor.streamText}</Markdown>
          </div>
        </section>
      )}

      {/* Agent summary with worker list */}
      <section className="overflow-hidden rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-6 shadow-[0_24px_80px_var(--theme-shadow)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--theme-muted)]">Agent Summary</p>
          <span className={cn(
            'rounded-full px-3 py-1 text-xs font-medium',
            conductor.streamError
              ? 'border border-red-400/35 bg-red-500/10 text-red-300'
              : 'border border-emerald-400/35 bg-emerald-500/10 text-emerald-300',
          )}>
            {conductor.streamError ? 'Stopped' : 'Complete'}
          </span>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)] px-5 py-4">
          {completeSummary ? (
            <Markdown className="max-h-[400px] max-w-none overflow-auto text-sm text-[var(--theme-text)]">{completeSummary}</Markdown>
          ) : (
            <p className="text-sm text-[var(--theme-muted)]">No summary captured.</p>
          )}
        </div>
        {conductor.workers.length > 0 && (
          <div className="mt-4 space-y-2">
            {conductor.workers.map((worker, index) => {
              const persona = getAgentPersona(index)
              return (
                <div key={worker.key} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm">
                  <span className="size-2 rounded-full bg-emerald-400" />
                  <span className="font-medium text-[var(--theme-text)]">{persona.emoji} {persona.name}</span>
                  <span className="text-[var(--theme-muted)]">{worker.label}</span>
                  <span className="ml-auto text-xs text-[var(--theme-muted)]">{getShortModelName(worker.model)} &middot; {worker.totalTokens.toLocaleString()} tok</span>
                </div>
              )
            })}
          </div>
        )}
        {(totalTokens > 0 || completeMissionCostWorkers.length > 0) && (
          <div className="mt-4">
            <CostTracker
              totalTokens={totalTokens}
              workers={completeMissionCostWorkers}
              expanded={costExpanded}
              onToggle={() => setCostExpanded((c) => !c)}
            />
          </div>
        )}
      </section>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {!conductor.streamError && (
          <Button
            type="button"
            onClick={() => void conductor.retryMission()}
            className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card2)] px-4 text-[var(--theme-text)] hover:border-[var(--theme-accent)] hover:text-[var(--theme-accent-strong)]"
          >
            Retry Mission
          </Button>
        )}
        <Button
          type="button"
          onClick={handleExport}
          className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card2)] px-4 text-[var(--theme-text)] hover:border-[var(--theme-accent)] hover:text-[var(--theme-accent-strong)]"
        >
          Export Markdown
        </Button>
        <Button
          type="button"
          onClick={onNewMission}
          className="rounded-xl bg-[var(--theme-accent)] px-5 text-white hover:bg-[var(--theme-accent-strong)]"
        >
          New Mission
        </Button>
      </div>
    </div>
  )
}
