import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ds/card'
import { StatusBadge } from '@/components/ds/status-badge'
import { CostTracker } from './cost-tracker'
import { WorkerCard } from './worker-card'
import { fetchMission } from '@/lib/missions-api'

interface MissionCompleteProps {
  missionId: string
  onNewMission: () => void
}

export function MissionComplete({ missionId, onNewMission }: MissionCompleteProps) {
  const { data: mission } = useQuery({
    queryKey: ['mission', missionId],
    queryFn: () => fetchMission(missionId),
  })

  if (!mission) {
    return <StatusBadge status="running" label="Loading..." />
  }

  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>
            Mission {mission.status === 'completed' ? 'Complete' : 'Aborted'}
          </h2>
          <StatusBadge
            status={mission.status === 'completed' ? 'success' : 'error'}
            label={mission.status}
          />
        </div>
        <CostTracker totalTokens={mission.totalTokens} totalCostUsd={mission.totalCostUsd} />
      </div>

      <Card>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--theme-muted)' }}>
            Goal
          </label>
          <p className="text-sm" style={{ color: 'var(--theme-text)' }}>{mission.goal}</p>
          {mission.completedAt && (
            <p className="text-xs mt-1" style={{ color: 'var(--theme-muted)' }}>
              Duration: {Math.round((mission.completedAt - mission.createdAt) / 1000)}s
            </p>
          )}
        </div>
      </Card>

      <div>
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--theme-muted)' }}>
          Workers
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mission.workers.map((w) => (
            <WorkerCard key={w.id} worker={w} />
          ))}
        </div>
      </div>

      <Button onClick={onNewMission}>New Mission</Button>
    </div>
  )
}
