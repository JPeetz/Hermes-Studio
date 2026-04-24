import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MissionHome } from './components/mission-home'
import { MissionPreview } from './components/mission-preview'
import { MissionActive } from './components/mission-active'
import { MissionComplete } from './components/mission-complete'
import { createMission, abortMission as apiAbortMission } from '@/lib/missions-api'
import { fetchTemplates } from '@/lib/templates-api'
import type { ConductorPhase, Mission } from '@/types/conductor'

export function ConductorScreen() {
  const queryClient = useQueryClient()
  const [phase, setPhase] = useState<ConductorPhase>('home')
  const [currentGoal, setCurrentGoal] = useState('')
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null)
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null)

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
  })

  const createMutation = useMutation({
    mutationFn: createMission,
    onSuccess: (mission) => {
      setActiveMissionId(mission.id)
      setPhase('active')
      queryClient.invalidateQueries({ queryKey: ['missions'] })
    },
  })

  const abortMutation = useMutation({
    mutationFn: (id: string) => apiAbortMission(id),
    onSuccess: () => {
      setPhase('complete')
      queryClient.invalidateQueries({ queryKey: ['missions'] })
    },
  })

  const handleStartMission = useCallback(
    (goal: string, templateId?: string) => {
      setCurrentGoal(goal)
      setCurrentTemplateId(templateId ?? null)
      if (templateId) {
        setPhase('preview')
      } else {
        createMutation.mutate({ goal })
      }
    },
    [createMutation],
  )

  const handleViewMission = useCallback((mission: Mission) => {
    setActiveMissionId(mission.id)
    if (mission.status === 'running') {
      setPhase('active')
    } else {
      setPhase('complete')
    }
  }, [])

  const handleConfirmPreview = useCallback(() => {
    createMutation.mutate({
      goal: currentGoal,
      templateId: currentTemplateId ?? undefined,
    })
  }, [currentGoal, currentTemplateId, createMutation])

  const handleAbort = useCallback(() => {
    if (activeMissionId) {
      abortMutation.mutate(activeMissionId)
    }
  }, [activeMissionId, abortMutation])

  const handleNewMission = useCallback(() => {
    setPhase('home')
    setActiveMissionId(null)
    setCurrentGoal('')
    setCurrentTemplateId(null)
  }, [])

  const selectedTemplate = currentTemplateId
    ? templates.find((t) => t.id === currentTemplateId) ?? null
    : null

  return (
    <div
      className="flex flex-col h-full overflow-y-auto p-6"
      style={{ background: 'var(--theme-bg)' }}
    >
      {phase === 'home' && (
        <MissionHome
          onStartMission={handleStartMission}
          onViewMission={handleViewMission}
        />
      )}
      {phase === 'preview' && (
        <MissionPreview
          goal={currentGoal}
          template={selectedTemplate}
          onConfirm={handleConfirmPreview}
          onCancel={handleNewMission}
        />
      )}
      {phase === 'active' && activeMissionId && (
        <MissionActive missionId={activeMissionId} onAbort={handleAbort} />
      )}
      {phase === 'complete' && activeMissionId && (
        <MissionComplete missionId={activeMissionId} onNewMission={handleNewMission} />
      )}
    </div>
  )
}
