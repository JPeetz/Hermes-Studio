import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { StatusBadge } from '@/components/ds/status-badge'
import { Button } from '@/components/ui/button'
import { AgentGrid } from './components/agent-grid'
import { AgentOutputs } from './components/agent-outputs'
import { fetchOperationsOverview } from '@/lib/operations-api'
import type { OperationAgentStatus } from '@/types/operation'

type ViewMode = 'grid' | 'outputs'
type StatusFilter = 'all' | OperationAgentStatus

export function OperationsScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const { data: agents = [] } = useQuery({
    queryKey: ['operations'],
    queryFn: fetchOperationsOverview,
    refetchInterval: 3_000,
  })

  const filteredAgents = useMemo(() => {
    if (statusFilter === 'all') return agents
    return agents.filter((a) => a.status === statusFilter)
  }, [agents, statusFilter])

  const onlineCount = useMemo(
    () => agents.filter((a) => a.status === 'online').length,
    [agents],
  )

  const totalCostUsd = useMemo(
    () => agents.reduce((sum, a) => sum + a.totalCostUsd, 0),
    [agents],
  )

  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{ background: 'var(--theme-bg)' }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-6 py-4 border-b"
        style={{
          background: 'var(--theme-bg)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Title + stats */}
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>
              Operations
            </h1>
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--theme-muted)' }}>
              <span>{agents.length} agent{agents.length !== 1 ? 's' : ''}</span>
              <span>·</span>
              <StatusBadge
                status="running"
                label={`${onlineCount} online`}
                size="sm"
              />
              <span>·</span>
              <span>${totalCostUsd.toFixed(4)} total cost</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-md border px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1"
              style={{
                background: 'var(--theme-input)',
                color: 'var(--theme-text)',
                borderColor: 'var(--theme-border)',
              }}
            >
              <option value="all">All statuses</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="error">Error</option>
              <option value="unknown">Unknown</option>
            </select>

            {/* View toggle */}
            <div
              className="flex rounded-md border overflow-hidden"
              style={{ borderColor: 'var(--theme-border)' }}
            >
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-none border-0 px-3 text-xs"
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'outputs' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('outputs')}
                className="rounded-none border-0 border-l px-3 text-xs"
                style={{ borderColor: 'var(--theme-border)' }}
              >
                Outputs
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 pb-28">
        {viewMode === 'grid' ? (
          <AgentGrid agents={filteredAgents} />
        ) : (
          <AgentOutputs agents={filteredAgents} />
        )}
      </div>
    </div>
  )
}
