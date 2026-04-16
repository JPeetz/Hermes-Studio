import { HugeiconsIcon } from '@hugeicons/react'
import {
  Loading03Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Alert02Icon,
  MinusSignCircleIcon,
  Clock01Icon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'

export type Status = 'running' | 'success' | 'error' | 'warning' | 'idle' | 'pending'

interface StatusBadgeProps {
  status: Status
  label?: string
  size?: 'sm' | 'md'
  className?: string
}

const statusConfig: Record<
  Status,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { icon: any; colorVar: string; defaultLabel: string; spin?: boolean }
> = {
  running: { icon: Loading03Icon,          colorVar: 'var(--theme-active)',   defaultLabel: 'Running', spin: true },
  success: { icon: CheckmarkCircle01Icon,  colorVar: 'var(--theme-success)',  defaultLabel: 'Success' },
  error:   { icon: Cancel01Icon,           colorVar: 'var(--theme-danger)',   defaultLabel: 'Error' },
  warning: { icon: Alert02Icon,            colorVar: 'var(--theme-warning)',  defaultLabel: 'Warning' },
  idle:    { icon: MinusSignCircleIcon,    colorVar: 'var(--theme-muted)',    defaultLabel: 'Idle' },
  pending: { icon: Clock01Icon,            colorVar: 'var(--theme-muted)',    defaultLabel: 'Pending' },
}

export function StatusBadge({ status, label, size = 'sm', className }: StatusBadgeProps) {
  const { icon, colorVar, defaultLabel, spin } = statusConfig[status]
  const iconSize = size === 'sm' ? 14 : 16
  const textClass = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      style={{ color: colorVar }}
    >
      <span className={cn(spin && 'animate-spin')}>
        <HugeiconsIcon icon={icon} size={iconSize} />
      </span>
      <span className={textClass}>{label ?? defaultLabel}</span>
    </span>
  )
}
