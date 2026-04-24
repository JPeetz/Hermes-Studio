import { AgentCard } from './agent-card'
import type { OperationAgent } from '@/types/operation'

interface AgentGridProps {
  agents: OperationAgent[]
}

export function AgentGrid({ agents }: AgentGridProps) {
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
          No agents running. Start a Crew or Conductor mission to see agents here.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  )
}
