/**
 * Conductor screen — phase router wiring use-conductor-gateway to child components.
 *
 * Phases: home → decomposing/running (active) → complete
 */
import { useMemo, useState } from 'react'
import { useConductorGateway } from './hooks/use-conductor-gateway'
import { ConductorHome } from './components/conductor-home'
import { ConductorActive } from './components/conductor-active'
import { ConductorComplete } from './components/conductor-complete'
import { ConductorSettingsDrawer } from './components/conductor-settings'

type ScreenPhase = 'home' | 'active' | 'complete'

export function ConductorScreen() {
  const conductor = useConductorGateway()
  const [goalDraft, setGoalDraft] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)

  const screenPhase: ScreenPhase = useMemo(() => {
    if (conductor.phase === 'idle') return 'home'
    if (conductor.phase === 'decomposing' || conductor.phase === 'running') return 'active'
    return 'complete'
  }, [conductor.phase])

  const handleSubmit = async () => {
    const trimmed = goalDraft.trim()
    if (!trimmed) return
    await conductor.sendMission(trimmed)
  }

  const handleNewMission = () => {
    conductor.resetMission()
    setGoalDraft('')
  }

  const updateSettings = (patch: Partial<typeof conductor.conductorSettings>) => {
    conductor.setConductorSettings({ ...conductor.conductorSettings, ...patch })
  }

  return (
    <>
      <div
        className="flex h-full flex-col overflow-y-auto"
        style={{ background: 'var(--theme-bg)', color: 'var(--theme-text)' }}
      >
        {screenPhase === 'home' && (
          <ConductorHome
            conductor={conductor}
            goalDraft={goalDraft}
            setGoalDraft={setGoalDraft}
            onSubmit={handleSubmit}
            onSettingsOpen={() => setSettingsOpen(true)}
          />
        )}
        {screenPhase === 'active' && (
          <ConductorActive conductor={conductor} />
        )}
        {screenPhase === 'complete' && (
          <ConductorComplete conductor={conductor} onNewMission={handleNewMission} />
        )}
      </div>
      <ConductorSettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={conductor.conductorSettings}
        onUpdate={updateSettings}
      />
    </>
  )
}
