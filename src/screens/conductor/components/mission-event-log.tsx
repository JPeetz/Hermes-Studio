import type { MissionEvent } from '@/types/conductor'

interface MissionEventLogProps {
  events: MissionEvent[]
}

export function MissionEventLog({ events }: MissionEventLogProps) {
  if (events.length === 0) {
    return (
      <div
        className="flex items-center justify-center max-h-64 py-8 text-sm"
        style={{ color: 'var(--theme-muted)' }}
      >
        No events yet
      </div>
    )
  }

  return (
    <div
      className="max-h-64 overflow-y-auto rounded-lg border"
      style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-panel)' }}
    >
      {events.map((event) => {
        const dataStr = JSON.stringify(event.data)
        const truncated = dataStr.length > 80 ? `${dataStr.slice(0, 80)}…` : dataStr
        const time = new Date(event.timestamp).toLocaleTimeString()

        return (
          <div
            key={event.id}
            className="flex items-start gap-3 px-3 py-2 border-b last:border-b-0 text-xs"
            style={{ borderColor: 'var(--theme-border)' }}
          >
            <span
              className="shrink-0 tabular-nums"
              style={{ color: 'var(--theme-muted)', minWidth: '6rem' }}
            >
              {time}
            </span>
            <span
              className="shrink-0 rounded px-1.5 py-0.5 font-mono"
              style={{
                background: 'var(--theme-accent-subtle)',
                color: 'var(--theme-accent)',
                border: '1px solid var(--theme-accent-border)',
              }}
            >
              {event.type}
            </span>
            <span
              className="font-mono break-all"
              style={{ color: 'var(--theme-muted)' }}
            >
              {truncated}
            </span>
          </div>
        )
      })}
    </div>
  )
}
