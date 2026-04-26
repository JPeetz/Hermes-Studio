/**
 * Mission event log — cycling status indicator for active missions.
 *
 * Adapted from upstream conductor.tsx CyclingStatus/PlanningIndicator.
 */
import { useEffect, useState } from 'react'

const PLANNING_STEPS = ['Planning the mission…', 'Analyzing requirements…', 'Preparing agents…', 'Writing the spec…']
const WORKING_STEPS = [
  '📋 Reviewing the brief…',
  '🔍 Scanning existing patterns…',
  '✏️ Drafting the implementation…',
  '☕ Grabbing a coffee…',
  '🧠 Thinking through edge cases…',
  '🎨 Polishing the design…',
  '🔧 Wiring up components…',
  '📐 Checking the layout…',
  '🚀 Almost there…',
]

export function CyclingStatus({
  steps,
  intervalMs = 3000,
  isPaused = false,
}: {
  steps: string[]
  intervalMs?: number
  isPaused?: boolean
}) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (isPaused) return
    const timer = window.setInterval(() => setStep((current) => (current + 1) % steps.length), intervalMs)
    return () => window.clearInterval(timer)
  }, [isPaused, steps.length, intervalMs])

  if (isPaused) {
    return (
      <div className="flex items-center gap-3 py-3">
        <div className="flex size-3.5 items-center justify-center rounded-full border border-amber-400/60 bg-amber-500/10 text-[9px] text-amber-300">
          ||
        </div>
        <p className="text-sm" style={{ color: 'var(--theme-muted)' }}>Paused</p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="size-3.5 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
      <p className="text-sm transition-opacity duration-500" style={{ color: 'var(--theme-muted)' }}>{steps[step]}</p>
    </div>
  )
}

export function PlanningIndicator() {
  return <CyclingStatus steps={PLANNING_STEPS} intervalMs={2500} />
}

export function WorkingIndicator({ isPaused = false }: { isPaused?: boolean }) {
  return <CyclingStatus steps={WORKING_STEPS} intervalMs={3500} isPaused={isPaused} />
}
