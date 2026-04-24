import { Card } from '@/components/ds/card'
import { Button } from '@/components/ui/button'
import type { CrewTemplate } from '@/types/template'

interface MissionPreviewProps {
  goal: string
  template: CrewTemplate
  onCancel: () => void
  onConfirm: () => void
  isPending?: boolean
}

const roleColors: Record<string, string> = {
  coordinator: 'var(--theme-accent)',
  executor: 'var(--theme-success)',
  reviewer: 'var(--theme-warning)',
  specialist: 'var(--theme-text)',
}

export function MissionPreview({
  goal,
  template,
  onCancel,
  onConfirm,
  isPending,
}: MissionPreviewProps) {
  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full px-4 py-6">
      {/* Goal */}
      <Card header={<span className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>Mission Goal</span>}>
        <p className="text-sm" style={{ color: 'var(--theme-text)' }}>
          {goal}
        </p>
      </Card>

      {/* Template info */}
      <Card
        header={
          <div className="flex items-center gap-2">
            <span className="text-xl">{template.icon}</span>
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>
                {template.name}
              </div>
              <div className="text-xs" style={{ color: 'var(--theme-muted)' }}>
                {template.description}
              </div>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          {/* Members */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium" style={{ color: 'var(--theme-muted)' }}>
              Members
            </span>
            <div className="flex flex-wrap gap-2">
              {template.defaultMembers.map((member, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"
                  style={{
                    background: 'var(--theme-panel)',
                    border: '1px solid var(--theme-border)',
                    color: 'var(--theme-text)',
                  }}
                >
                  <span className="capitalize">{member.persona}</span>
                  <span
                    className="rounded px-1 py-0.5 text-xs"
                    style={{
                      color: roleColors[member.role] ?? 'var(--theme-muted)',
                      background: 'var(--theme-accent-subtle)',
                    }}
                  >
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Conductor config */}
          {template.conductorConfig && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium" style={{ color: 'var(--theme-muted)' }}>
                Configuration
              </span>
              <div className="flex gap-4 text-xs" style={{ color: 'var(--theme-text)' }}>
                <div>
                  Max parallel:{' '}
                  <span className="font-semibold">{template.conductorConfig.maxParallel}</span>
                </div>
                <div>
                  Supervised:{' '}
                  <span className="font-semibold">
                    {template.conductorConfig.supervised ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end">
        <Button variant="ghost" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={onConfirm} disabled={isPending}>
          {isPending ? 'Launching…' : 'Launch Mission'}
        </Button>
      </div>
    </div>
  )
}
