import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ds/status-badge'
import { WorkerCard } from './worker-card'
import { MissionEventLog } from './mission-event-log'
import { CostTracker } from './cost-tracker'
import { fetchMission, fetchMissionEvents } from '@/lib/missions-api'

interface MissionActiveProps {
  missionId: string
  onAbort: () => void
}

export function MissionActive({ missionId, onAbort }: MissionActiveProps) {
  const { data: mission } = useQuery({
    queryKey: ['mission', missionId],
    queryFn: () => fetchMission(missionId),
    refetchInterval: 3_000,
  })

  const { data: events = [] } = useQuery({
    queryKey: ['mission-events', missionId],
    queryFn: () => fetchMissionEvents(missionId),
    refetchInterval: 3_000,
  })

  if (!mission) {
    return <StatusBadge status="running" label="Loading mission..." />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>
            {mission.goal}
          </h2>
          <StatusBadge
            status={mission.status === 'running' ? 'running' : 'idle'}
            label={mission.status}
          />
        </div>
        <div className="flex items-center gap-3">
          <CostTracker totalTokens={mission.totalTokens} totalCostUsd={mission.totalCostUsd} />
          {mission.status === 'running' && (
            <Button variant="ghost" onClick={onAbort} style={{ color: 'var(--theme-danger)' }}>
              Abort
            </Button>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--theme-muted)' }}>
          Workers ({mission.workers.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {mission.workers.map((w) => (
            <WorkerCard key={w.id} worker={w} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--theme-muted)' }}>
          Event Log
        </h3>
        <MissionEventLog events={events} />
      </div>
    </div>
  )
}
