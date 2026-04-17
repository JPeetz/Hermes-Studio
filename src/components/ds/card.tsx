import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface CardProps {
  variant?: 'default' | 'panel' | 'subtle'
  header?: ReactNode
  footer?: ReactNode
  className?: string
  children: ReactNode
}

const variantStyles = {
  default: 'bg-[var(--theme-card)] border-[var(--theme-border)]',
  panel:   'bg-[var(--theme-panel)] border-[var(--theme-border)]',
  subtle:  'bg-[var(--theme-accent-subtle)] border-[var(--theme-accent-border)]',
}

export function Card({ variant = 'default', header, footer, className, children }: CardProps) {
  return (
    <div className={cn('rounded-lg border', variantStyles[variant], className)}>
      {header && (
        <div className="border-b border-[var(--theme-border)] px-4 py-3">
          {header}
        </div>
      )}
      <div className="p-4">{children}</div>
      {footer && (
        <div className="border-t border-[var(--theme-border)] px-4 py-3">
          {footer}
        </div>
      )}
    </div>
  )
}
