/**
 * AgentStatusStrip — top telemetry bar for the hermes-os theme.
 *
 * Shows: brand mark | session context | active model | latency | connection status
 * Visible only when [data-theme='hermes-os'] is active (controlled via CSS).
 */
import { useQuery } from '@tanstack/react-query'
import { useRouterState } from '@tanstack/react-router'

type ConnectionStatus = {
  status: 'connected' | 'enhanced' | 'partial' | 'disconnected'
  activeModel: string
  hermesUrl: string
  chatReady: boolean
}

async function fetchStatus(): Promise<ConnectionStatus> {
  const res = await fetch('/api/connection-status', {
    signal: AbortSignal.timeout(4000),
  })
  if (!res.ok) throw new Error('fetch failed')
  return res.json() as Promise<ConnectionStatus>
}

function StatusPip({ status }: { status: ConnectionStatus['status'] | undefined }) {
  const color =
    status === 'enhanced' || status === 'connected'
      ? '#22d3ee'
      : status === 'partial'
        ? '#fbbf24'
        : '#f87171'
  return (
    <span
      className="inline-block rounded-full shrink-0"
      style={{
        width: 6,
        height: 6,
        background: color,
        boxShadow: `0 0 6px ${color}88`,
      }}
    />
  )
}

function truncateModel(model: string): string {
  if (!model) return '—'
  // Strip common prefixes for display
  return model.replace(/^(accounts\/|fireworks\/|openai\/|anthropic\/|meta-llama\/)/i, '')
}

export function AgentStatusStrip() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const { data, isLoading } = useQuery({
    queryKey: ['hermes', 'connection-status'],
    queryFn: fetchStatus,
    refetchInterval: 20_000,
    retry: false,
    staleTime: 15_000,
  })

  // Derive session label from route
  const sessionLabel = (() => {
    const m = pathname.match(/^\/chat\/(.+)$/)
    if (m) return m[1].slice(0, 12)
    if (pathname === '/new') return 'new'
    return null
  })()

  const model = truncateModel(data?.activeModel ?? '')
  const statusLabel =
    isLoading ? 'PROBING' :
    data?.status === 'enhanced' ? 'ENHANCED' :
    data?.status === 'connected' ? 'ONLINE' :
    data?.status === 'partial' ? 'PARTIAL' :
    'OFFLINE'

  return (
    <div className="agent-status-strip" aria-hidden="true">
      {/* Brand */}
      <span
        className="flex items-center gap-1.5 shrink-0 select-none"
        style={{ color: '#38bdf8', fontWeight: 600, letterSpacing: '0.12em' }}
      >
        <span style={{ fontSize: 13, lineHeight: 1 }}>◈</span>
        <span style={{ fontSize: 9.5 }}>HERMES OS</span>
      </span>

      {/* Separator */}
      <span style={{ color: '#18263c', fontSize: 16, lineHeight: 1, userSelect: 'none' }}>│</span>

      {/* Session */}
      {sessionLabel ? (
        <span style={{ color: 'rgba(103,232,249,0.55)', fontSize: 9 }}>
          SESSION <span style={{ color: 'rgba(103,232,249,0.85)' }}>{sessionLabel}</span>
        </span>
      ) : (
        <span style={{ color: 'rgba(103,232,249,0.3)', fontSize: 9 }}>NO ACTIVE SESSION</span>
      )}

      {/* Grow */}
      <span className="flex-1" />

      {/* Model */}
      {model !== '—' && (
        <span style={{ color: 'rgba(129,140,248,0.8)', fontSize: 9, maxWidth: 180 }} className="truncate">
          {model}
        </span>
      )}

      {/* Separator */}
      <span style={{ color: '#18263c', fontSize: 16, lineHeight: 1, userSelect: 'none' }}>│</span>

      {/* Status */}
      <span className="flex items-center gap-1.5">
        <StatusPip status={data?.status} />
        <span style={{ color: data?.status === 'connected' || data?.status === 'enhanced' ? 'rgba(34,211,238,0.75)' : 'rgba(251,191,36,0.75)', fontSize: 9 }}>
          {statusLabel}
        </span>
      </span>
    </div>
  )
}
