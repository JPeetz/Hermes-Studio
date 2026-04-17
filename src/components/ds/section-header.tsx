import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
  divider?: boolean
  className?: string
}

export function SectionHeader({
  title,
  subtitle,
  action,
  divider = true,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-muted)]">
          {title}
        </h2>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {divider && <div className="mt-2 border-b border-[var(--theme-border)]" />}
      {subtitle && (
        <p className="mt-2 text-xs text-[var(--theme-muted)]">{subtitle}</p>
      )}
    </div>
  )
}
