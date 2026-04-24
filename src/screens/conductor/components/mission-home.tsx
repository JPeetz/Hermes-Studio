import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ds/card'
import { StatusBadge } from '@/components/ds/status-badge'
import { Button } from '@/components/ui/button'
import { fetchTemplates } from '@/lib/templates-api'
import { fetchMissions } from '@/lib/missions-api'
import type { Mission } from '@/types/conductor'
import type { CrewTemplate } from '@/types/template'

interface MissionHomeProps {
  onStartMission: (goal: string, templateId?: string) => void
  onViewMission: (mission: Mission) => void
}

function getMissionStatus(mission: Mission): 'running' | 'success' | 'error' | 'pending' | 'idle' {
  switch (mission.status) {
    case 'running': return 'running'
    case 'completed': return 'success'
    case 'aborted': return 'error'
    case 'paused': return 'pending'
    default: return 'idle'
  }
}

export function MissionHome({ onStartMission, onViewMission }: MissionHomeProps) {
  const [goal, setGoal] = useState('')

  const { data: allTemplates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
  })

  const { data: missions = [], isLoading: missionsLoading } = useQuery({
    queryKey: ['missions'],
    queryFn: fetchMissions,
    refetchInterval: 5000,
  })

  const conductorTemplates = allTemplates.filter((t: CrewTemplate) => t.templateType === 'conductor')
  const recentMissions = missions.slice(0, 10)

  function handleLaunch() {
    const trimmed = goal.trim()
    if (!trimmed) return
    onStartMission(trimmed)
  }

  function handleTemplateClick(template: CrewTemplate) {
    const g = goal.trim() || template.defaultGoal
    onStartMission(g, template.id)
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full px-4 py-6">
      {/* Goal input */}
      <Card>
        <div className="flex flex-col gap-3">
          <label
            className="text-sm font-medium"
            style={{ color: 'var(--theme-text)' }}
          >
            Mission Goal
          </label>
          <textarea
            rows={3}
            placeholder="Describe what the crew should accomplish..."
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full resize-none rounded-md px-3 py-2 text-sm outline-none focus:ring-1"
            style={{
              background: 'var(--theme-input)',
              border: '1px solid var(--theme-border)',
              color: 'var(--theme-text)',
              '--tw-ring-color': 'var(--theme-accent)',
            } as React.CSSProperties}
          />
          <div className="flex justify-end">
            <Button onClick={handleLaunch} disabled={!goal.trim()}>
              Launch Mission
            </Button>
          </div>
        </div>
      </Card>

      {/* Conductor templates */}
      {conductorTemplates.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>
            Templates
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {conductorTemplates.map((template: CrewTemplate) => (
              <button
                key={template.id}
                onClick={() => handleTemplateClick(template)}
                className="text-left rounded-lg border p-4 transition-colors"
                style={{
                  background: 'var(--theme-card)',
                  borderColor: 'var(--theme-border)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--theme-hover)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--theme-card)'
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{template.icon}</span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--theme-text)' }}
                  >
                    {template.name}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--theme-muted)' }}>
                  {template.description}
                </p>
                <p className="mt-2 text-xs truncate" style={{ color: 'var(--theme-muted)' }}>
                  {template.defaultMembers.length} members
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent missions */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>
          Recent Missions
        </h2>
        {missionsLoading ? (
          <StatusBadge status="running" label="Loading missions..." />
        ) : recentMissions.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--theme-muted)' }}>
            No missions yet. Launch one above!
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentMissions.map((mission: Mission) => (
              <button
                key={mission.id}
                onClick={() => onViewMission(mission)}
                className="text-left rounded-lg border px-4 py-3 transition-colors"
                style={{
                  background: 'var(--theme-card)',
                  borderColor: 'var(--theme-border)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--theme-hover)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--theme-card)'
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm truncate" style={{ color: 'var(--theme-text)' }}>
                    {mission.goal}
                  </p>
                  <StatusBadge status={getMissionStatus(mission)} size="sm" />
                </div>
                <p className="mt-1 text-xs" style={{ color: 'var(--theme-muted)' }}>
                  {new Date(mission.createdAt).toLocaleString()} &middot; {mission.workers.length} workers
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
