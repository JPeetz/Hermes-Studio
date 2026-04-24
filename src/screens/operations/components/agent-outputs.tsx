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

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

interface AgentOutputsProps {
  agents: OperationAgent[]
}

export function AgentOutputs({ agents }: AgentOutputsProps) {
  if (agents.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed py-20 text-center"
        style={{
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-muted)',
        }}
      >
        <p className="text-sm max-w-xs">
          No agents running. Start a Crew or Conductor mission to see agent outputs here.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {agents.map((agent) => {
        const contextLabel =
          agent.source === 'crew' && agent.crewName
            ? `Crew: ${agent.crewName}`
            : agent.missionGoal
              ? `Mission: ${agent.missionGoal.slice(0, 80)}${agent.missionGoal.length > 80 ? '…' : ''}`
              : agent.source === 'conductor'
                ? 'Conductor'
                : 'Standalone'

        const header = (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg leading-none">{agent.emoji}</span>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: 'var(--theme-text)' }}>
                  {agent.name}
                </div>
                <div className="text-xs truncate" style={{ color: 'var(--theme-muted)' }}>
                  {contextLabel}
                </div>
              </div>
            </div>
            <StatusBadge status={agentStatusToStatus(agent.status)} />
          </div>
        )

        return (
          <Card key={agent.id} header={header}>
            {agent.lastActivity ? (
              <div className="flex flex-col gap-2">
                <div
                  className="rounded p-3 text-xs font-mono whitespace-pre-wrap break-all"
                  style={{
                    background: 'var(--theme-input)',
                    color: 'var(--theme-text)',
                    border: '1px solid var(--theme-border)',
                    minHeight: '3rem',
                  }}
                >
                  Last activity: {timeAgo(agent.lastActivity)}
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--theme-muted)' }}>
                  {agent.model && (
                    <span
                      className="rounded px-1.5 py-0.5 font-mono"
                      style={{
                        background: 'var(--theme-accent-subtle)',
                        color: 'var(--theme-accent)',
                        border: '1px solid var(--theme-accent-border)',
                      }}
                    >
                      {agent.model}
                    </span>
                  )}
                  <span>{agent.totalTokens.toLocaleString()} tokens</span>
                  <span>{agent.taskCount} task{agent.taskCount !== 1 ? 's' : ''}</span>
                  {agent.totalCostUsd > 0 && (
                    <span>${agent.totalCostUsd.toFixed(4)}</span>
                  )}
                </div>
              </div>
            ) : (
              <div
                className="rounded p-3 text-xs"
                style={{
                  background: 'var(--theme-input)',
                  color: 'var(--theme-muted)',
                  border: '1px solid var(--theme-border)',
                }}
              >
                No activity recorded yet.
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
