import { Link } from '@tanstack/react-router'
import { Card } from '@/components/ds/card'
import { StatusBadge } from '@/components/ds/status-badge'
import type { OperationAgent, OperationAgentStatus } from '@/types/operation'
import type { Status } from '@/components/ds/status-badge'

function agentStatusToStatus(s: OperationAgentStatus): Status {
  switch (s) {
    case 'online':  return 'running'
    case 'offline': return 'idle'
    case 'error':   return 'error'
    case 'unknown': return 'pending'
  }
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

interface AgentCardProps {
  agent: OperationAgent
}

export function AgentCard({ agent }: AgentCardProps) {
  const href =
    agent.source === 'crew' && agent.crewId
      ? `/crews/${agent.crewId}`
      : '/conductor'

  const contextLabel =
    agent.source === 'crew' && agent.crewName
      ? agent.crewName
      : agent.missionGoal
        ? agent.missionGoal.slice(0, 60) + (agent.missionGoal.length > 60 ? '…' : '')
        : null

  return (
    <Link to={href as '/conductor'} className="block focus:outline-none">
      <Card className="transition-colors hover:border-[var(--theme-accent-border)] cursor-pointer h-full">
        <div className="flex flex-col gap-3">
          {/* Header: emoji + name + status */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl leading-none">{agent.emoji}</span>
              <div className="min-w-0">
                <div
                  className="text-sm font-medium truncate"
                  style={{ color: 'var(--theme-text)' }}
                >
                  {agent.name}
                </div>
                {contextLabel && (
                  <div className="text-xs truncate" style={{ color: 'var(--theme-muted)' }}>
                    {contextLabel}
                  </div>
                )}
              </div>
            </div>
            <StatusBadge status={agentStatusToStatus(agent.status)} />
          </div>

          {/* Model badge */}
          {agent.model && (
            <span
              className="inline-block self-start rounded px-1.5 py-0.5 text-xs font-mono"
              style={{
                background: 'var(--theme-accent-subtle)',
                color: 'var(--theme-accent)',
                border: '1px solid var(--theme-accent-border)',
              }}
            >
              {agent.model}
            </span>
          )}

          {/* Footer: tokens + last activity */}
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--theme-muted)' }}>
            {agent.totalTokens > 0 ? (
              <span>{formatTokens(agent.totalTokens)} tokens</span>
            ) : (
              <span>0 tokens</span>
            )}
            {agent.lastActivity && (
              <span>{timeAgo(agent.lastActivity)}</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
