interface CostTrackerProps {
  totalTokens: number
  totalCostUsd: number
}

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export function CostTracker({ totalTokens, totalCostUsd }: CostTrackerProps) {
  return (
    <div
      className="inline-flex items-center gap-3 rounded-md px-3 py-1.5 text-xs"
      style={{
        background: 'var(--theme-panel)',
        border: '1px solid var(--theme-border)',
        color: 'var(--theme-muted)',
      }}
    >
      <span>
        <span style={{ color: 'var(--theme-text)' }}>{formatTokens(totalTokens)}</span>
        {' tokens'}
      </span>
      <span
        style={{
          width: '1px',
          height: '12px',
          background: 'var(--theme-border)',
          display: 'inline-block',
        }}
      />
      <span>
        <span style={{ color: 'var(--theme-text)' }}>${totalCostUsd.toFixed(4)}</span>
      </span>
    </div>
  )
}
