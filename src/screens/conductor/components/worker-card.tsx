import { Card } from '@/components/ds/card'
import { StatusBadge } from '@/components/ds/status-badge'
import type { MissionWorker, WorkerStatus } from '@/types/conductor'
import type { Status } from '@/components/ds/status-badge'

function workerStatusToStatus(ws: WorkerStatus): Status {
  switch (ws) {
    case 'pending': return 'pending'
    case 'running': return 'running'
    case 'done': return 'success'
    case 'error': return 'error'
  }
}

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

interface WorkerCardProps {
  worker: MissionWorker
}

export function WorkerCard({ worker }: WorkerCardProps) {
  return (
    <Card>
      <div className="flex flex-col gap-2">
        {/* Header: emoji + label + persona */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg leading-none">{worker.personaEmoji}</span>
            <div className="min-w-0">
              <div
                className="text-sm font-medium truncate"
                style={{ color: 'var(--theme-text)' }}
              >
                {worker.label}
              </div>
              <div className="text-xs truncate" style={{ color: 'var(--theme-muted)' }}>
                {worker.personaName}
              </div>
            </div>
          </div>
          <StatusBadge status={workerStatusToStatus(worker.status)} />
        </div>

        {/* Model badge */}
        {worker.model && (
          <div className="flex items-center gap-2">
            <span
              className="inline-block rounded px-1.5 py-0.5 text-xs font-mono"
              style={{
                background: 'var(--theme-accent-subtle)',
                color: 'var(--theme-accent)',
                border: '1px solid var(--theme-accent-border)',
              }}
            >
              {worker.model}
            </span>
          </div>
        )}

        {/* Token count */}
        {worker.totalTokens > 0 && (
          <div className="text-xs" style={{ color: 'var(--theme-muted)' }}>
            {formatTokens(worker.totalTokens)} tokens
          </div>
        )}

        {/* Output preview */}
        {worker.output && (
          <div
            className="max-h-24 overflow-y-auto rounded p-2 text-xs font-mono whitespace-pre-wrap break-all"
            style={{
              background: 'var(--theme-input)',
              color: 'var(--theme-text)',
              border: '1px solid var(--theme-border)',
            }}
          >
            {worker.output}
          </div>
        )}
      </div>
    </Card>
  )
}
