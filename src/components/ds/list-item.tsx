import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface ListItemProps {
  icon?: ReactNode
  label: string
  description?: string
  meta?: ReactNode
  onClick?: () => void
  active?: boolean
  className?: string
}

export function ListItem({
  icon,
  label,
  description,
  meta,
  onClick,
  active = false,
  className,
}: ListItemProps) {
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      className={cn(
        'flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors',
        active
          ? 'bg-[var(--theme-accent-subtle)]'
          : 'hover:bg-[var(--theme-hover)]',
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      {icon && (
        <span className="mt-0.5 shrink-0 text-[var(--theme-muted)]">{icon}</span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-[var(--theme-text)]">
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block truncate text-xs text-[var(--theme-muted)]">
            {description}
          </span>
        )}
      </span>
      {meta && <span className="ml-2 shrink-0">{meta}</span>}
    </Tag>
  )
}
