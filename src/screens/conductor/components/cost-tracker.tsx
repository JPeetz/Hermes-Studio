/**
 * Mission cost tracker — token count + estimated USD per worker and total.
 *
 * Adapted from upstream conductor.tsx MissionCostSection.
 */
import { cn } from '@/lib/utils'

const BLENDED_COST_PER_MILLION_TOKENS = 5

export function estimateTokenCost(totalTokens: number): number {
  return (Math.max(0, totalTokens) / 1_000_000) * BLENDED_COST_PER_MILLION_TOKENS
}

export function formatUsd(value: number): string {
  return `$${value.toFixed(value >= 0.1 ? 2 : 3)}`
}

export type CostWorker = {
  id: string
  label: string
  totalTokens: number
  personaEmoji: string
  personaName: string
}

export function CostTracker({
  totalTokens,
  workers,
  expanded,
  onToggle,
}: {
  totalTokens: number
  workers: CostWorker[]
  expanded: boolean
  onToggle: () => void
}) {
  const estimatedCost = estimateTokenCost(totalTokens)

  return (
    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg)' }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--theme-muted)' }}>Mission Cost</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--theme-muted-2)' }}>Approximate at $5 / 1M tokens blended.</p>
        </div>
        <span
          className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium"
          style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-card2)', color: 'var(--theme-text)' }}
        >
          {expanded ? 'Hide' : 'Show'}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={cn('transition-transform duration-200', expanded ? 'rotate-180' : 'rotate-0')}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      {expanded ? (
        <div className="space-y-4 px-5 pb-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg)' }}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--theme-muted)' }}>Total Tokens</p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: 'var(--theme-text)' }}>{totalTokens.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg)' }}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--theme-muted)' }}>Estimated Cost</p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: 'var(--theme-text)' }}>{formatUsd(estimatedCost)}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg)' }}>
            <div className="flex items-center justify-between border-b px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-muted)' }}>
              <span>Workers</span>
              <span>Cost</span>
            </div>
            {workers.length > 0 ? (
              <div>
                {workers.map((worker) => (
                  <div key={worker.id} className="flex items-center gap-3 border-t px-4 py-3 text-sm" style={{ borderColor: 'var(--theme-border)' }}>
                    <span className="font-medium" style={{ color: 'var(--theme-text)' }}>{worker.personaEmoji} {worker.personaName}</span>
                    <span className="min-w-0 flex-1 truncate" style={{ color: 'var(--theme-muted)' }}>{worker.label}</span>
                    <span className="text-xs" style={{ color: 'var(--theme-muted)' }}>{worker.totalTokens.toLocaleString()} tok</span>
                    <span className="min-w-[4.5rem] text-right font-medium" style={{ color: 'var(--theme-text)' }}>{formatUsd(estimateTokenCost(worker.totalTokens))}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 text-sm" style={{ color: 'var(--theme-muted)' }}>Per-worker token details were not captured.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
