import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface SettingsRowProps {
  label: string
  description?: string
  danger?: boolean
  children: ReactNode
}

export function SettingsRow({ label, description, danger = false, children }: SettingsRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 px-4 py-3 border-l-2',
        danger ? 'border-l-[var(--theme-danger)]' : 'border-l-transparent',
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-[var(--theme-text)]">{label}</div>
        {description && (
          <div className="mt-0.5 text-xs text-[var(--theme-muted)]">{description}</div>
        )}
      </div>
      <div className="flex shrink-0 items-center">{children}</div>
    </div>
  )
}
