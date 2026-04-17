import { Moon01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { SettingsThemeMode } from '@/hooks/use-settings'
import { applyTheme, useSettingsStore } from '@/hooks/use-settings'
import { cn } from '@/lib/utils'

const MODES: Array<{
  value: SettingsThemeMode
  icon: typeof Moon01Icon
  label: string
}> = [{ value: 'dark', icon: Moon01Icon, label: 'Dark' }]

type ThemeToggleProps = {
  /** "icon" = small icon button, "pill" = pill toggle (default) */
  variant?: 'icon' | 'pill'
}

export function ThemeToggle({ variant = 'pill' }: ThemeToggleProps) {
  const settings = useSettingsStore((state) => state.settings)
  const updateSettings = useSettingsStore((state) => state.updateSettings)

  function setThemeMode(theme: SettingsThemeMode) {
    applyTheme(theme)
    updateSettings({ theme })
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={() => setThemeMode('dark')}
        className="inline-flex size-7 items-center justify-center rounded-md text-primary-400 transition-colors hover:text-primary-700 dark:hover:text-primary-300"
        aria-label="Dark mode"
        title="Dark mode"
      >
        <HugeiconsIcon icon={Moon01Icon} size={16} strokeWidth={1.5} />
      </button>
    )
  }

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-full border border-[var(--theme-border)] bg-[var(--theme-panel)] p-0.5"
      role="group"
      aria-label="Theme mode: Dark"
    >
      {MODES.map((mode) => {
        const active = settings.theme === mode.value
        return (
          <button
            key={mode.value}
            type="button"
            onClick={() => setThemeMode(mode.value)}
            className={cn(
              'inline-flex size-7 items-center justify-center rounded-full transition-all duration-200',
              active
                ? 'bg-accent-500 text-white shadow-sm'
                : 'text-[var(--theme-muted)] hover:text-[var(--theme-text)]',
            )}
            aria-label={active ? `${mode.label} theme (current)` : `${mode.label} theme`}
            title={mode.label}
          >
            <HugeiconsIcon icon={mode.icon} size={14} strokeWidth={1.8} />
          </button>
        )
      })}
    </div>
  )
}
