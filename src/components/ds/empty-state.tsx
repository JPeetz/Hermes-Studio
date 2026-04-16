import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 text-center',
        className,
      )}
    >
      <div className="mb-4 text-[var(--theme-muted)] opacity-40">{icon}</div>
      <h3 className="mb-1 text-sm font-medium text-[var(--theme-text)]">{title}</h3>
      {description && (
        <p className="mb-4 max-w-xs text-xs text-[var(--theme-muted)]">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}
