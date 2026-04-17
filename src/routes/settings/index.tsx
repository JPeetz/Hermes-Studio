import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkCircle02Icon,
  CloudIcon,
  LockIcon,
  MessageMultiple01Icon,
  Mic01Icon,
  Notification03Icon,
  PaintBoardIcon,
  Settings02Icon,
  SourceCodeSquareIcon,
  SparklesIcon,
  UserIcon,
  VolumeHighIcon,
} from '@hugeicons/core-free-icons'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import type * as React from 'react'
import type { LoaderStyle } from '@/hooks/use-chat-settings'
import type { BrailleSpinnerPreset } from '@/components/ui/braille-spinner'
import type { ThemeId } from '@/lib/theme'
import { usePageTitle } from '@/hooks/use-page-title'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useSettings } from '@/hooks/use-settings'
import { THEMES, getTheme, setTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'
import {
  getChatProfileDisplayName,
  useChatSettingsStore,
} from '@/hooks/use-chat-settings'
import { UserAvatar } from '@/components/avatars'
import { Input } from '@/components/ui/input'
import { LogoLoader } from '@/components/logo-loader'
import { BrailleSpinner } from '@/components/ui/braille-spinner'
import { ThreeDotsSpinner } from '@/components/ui/three-dots-spinner'
// useWorkspaceStore removed — hamburger eliminated on mobile

export const Route = createFileRoute('/settings/')({
  component: SettingsRoute,
})

function PageThemeSwatch({
  colors,
}: {
  colors: {
    bg: string
    panel: string
    border: string
    accent: string
    text: string
  }
}) {
  return (
    <div
      className="flex h-10 w-full overflow-hidden rounded-md border"
      style={{ borderColor: colors.border, backgroundColor: colors.bg }}
    >
      <div
        className="flex h-full w-4 flex-col gap-0.5 p-0.5"
        style={{ backgroundColor: colors.panel }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-1.5 w-full rounded-sm"
            style={{ backgroundColor: colors.border }}
          />
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 p-1">
        <div
          className="h-1.5 w-3/4 rounded"
          style={{ backgroundColor: colors.text, opacity: 0.8 }}
        />
        <div
          className="h-1 w-1/2 rounded"
          style={{ backgroundColor: colors.text, opacity: 0.3 }}
        />
        <div
          className="mt-0.5 h-1.5 w-6 rounded-full"
          style={{ backgroundColor: colors.accent }}
        />
      </div>
    </div>
  )
}

const THEME_PREVIEWS: Record<
  ThemeId,
  { bg: string; panel: string; border: string; accent: string; text: string }
> = {
  'hermes-os': {
    bg: '#080c14',
    panel: '#0f1828',
    border: '#18263c',
    accent: '#38bdf8',
    text: '#e4edff',
  },
  'hermes-official': {
    bg: '#0A0E1A',
    panel: '#11182A',
    border: '#24304A',
    accent: '#6366F1',
    text: '#E6EAF2',
  },
  'hermes-classic': {
    bg: '#0d0f12',
    panel: '#1a1f26',
    border: '#2a313b',
    accent: '#b98a44',
    text: '#eceff4',
  },
  'hermes-slate': {
    bg: '#0d1117',
    panel: '#1c2128',
    border: '#30363d',
    accent: '#7eb8f6',
    text: '#c9d1d9',
  },
  'hermes-mono': {
    bg: '#111111',
    panel: '#222222',
    border: '#333333',
    accent: '#aaaaaa',
    text: '#e6edf3',
  },
}

function WorkspaceThemePicker() {
  const { updateSettings } = useSettings()
  const [current, setCurrent] = useState<ThemeId>(() => getTheme())

  function applyWorkspaceTheme(id: ThemeId) {
    setTheme(id)
    updateSettings({ theme: 'dark' })
    setCurrent(id)
  }

  return (
    <div className="grid w-full gap-2 md:grid-cols-3">
      {THEMES.map((t) => {
        const isActive = current === t.id
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => applyWorkspaceTheme(t.id)}
            className={cn(
              'flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors',
              isActive
                ? 'border-[var(--theme-accent)] bg-[var(--theme-accent-subtle)] text-[var(--theme-text)]'
                : 'border-[var(--theme-border)] bg-[var(--theme-card)] text-[var(--theme-text)] hover:bg-[var(--theme-card2)]',
            )}
          >
            <PageThemeSwatch colors={THEME_PREVIEWS[t.id]} />
            <div className="flex items-center gap-1.5">
              <span className="text-xs">{t.icon}</span>
              <span className="text-xs font-semibold">{t.label}</span>
              {isActive && (
                <span className="ml-auto text-[9px] font-bold uppercase tracking-wide text-[var(--theme-accent)]">
                  Active
                </span>
              )}
            </div>
            <p className="text-[10px] leading-tight text-[var(--theme-muted)]">
              {t.description}
            </p>
          </button>
        )
      })}
    </div>
  )
}

type SectionProps = {
  title: string
  description: string
  icon: React.ComponentProps<typeof HugeiconsIcon>['icon']
  children: React.ReactNode
}

function SettingsSection({ title, description, icon, children }: SectionProps) {
  return (
    <section className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-panel)] p-4 shadow-sm backdrop-blur-xl md:p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="inline-flex size-9 items-center justify-center rounded-xl border border-[var(--theme-border)] bg-[var(--theme-panel)]/70">
          <HugeiconsIcon icon={icon} size={20} strokeWidth={1.5} />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-medium text-[var(--theme-text)] text-balance">
            {title}
          </h2>
          <p className="text-sm text-[var(--theme-muted)] text-pretty">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

type RowProps = {
  label: string
  description?: React.ReactNode
  children: React.ReactNode
}

function SettingsRow({ label, description, children }: RowProps) {
  return (
    <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--theme-text)] text-balance">
          {label}
        </p>
        {description ? (
          <p className="text-xs text-[var(--theme-muted)] text-pretty">{description}</p>
        ) : null}
      </div>
      <div className="flex w-full items-center gap-2 md:w-auto md:justify-end">
        {children}
      </div>
    </div>
  )
}

type SettingsSectionId =
  | 'profile'
  | 'appearance'
  | 'chat'
  | 'hermes'
  | 'agent'
  | 'permissions'
  | 'routing'
  | 'voice'
  | 'display'
  | 'notifications'
  | 'integrations'
  | 'identity'
  | 'autostart'
  | 'advanced'

type SettingsNavItem = {
  id: SettingsSectionId | 'mcp'
  label: string
  to?: '/settings/mcp'
}

const SETTINGS_NAV_ITEMS: Array<SettingsNavItem> = [
  { id: 'hermes', label: 'Model & Provider' },
  { id: 'agent', label: 'Agent Behavior' },
  { id: 'permissions', label: 'Permissions & Toolsets' },
  { id: 'routing', label: 'Smart Routing' },
  { id: 'voice', label: 'Voice' },
  { id: 'display', label: 'Display' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'chat', label: 'Chat' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'identity', label: 'Identity' },
  { id: 'autostart', label: 'Auto-start' },
  { id: 'mcp', label: 'MCP Servers', to: '/settings/mcp' },
]

function SettingsRoute() {
  usePageTitle('Settings')
  const { settings, updateSettings } = useSettings()

  // Phase 4.2: Fetch models for preferred model dropdowns
  const [availableModels, setAvailableModels] = useState<
    Array<{ id: string; label: string }>
  >([])
  const [modelsError, setModelsError] = useState(false)

  useEffect(() => {
    async function fetchModels() {
      setModelsError(false)
      try {
        const res = await fetch('/api/models')
        if (!res.ok) {
          setModelsError(true)
          return
        }
        const data = await res.json()
        const models = Array.isArray(data.models) ? data.models : []
        setAvailableModels(
          models.map((m: any) => ({
            id: m.id || '',
            label: m.id?.split('/').pop() || m.id || '',
          })),
        )
      } catch {
        setModelsError(true)
      }
    }
    void fetchModels()
  }, [])

  const [activeSection, setActiveSection] =
    useState<SettingsSectionId>('hermes')

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)]">
      <div className="pointer-events-none fixed inset-0 bg-radial from-primary-400/20 via-transparent to-transparent" />
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-primary-100/25 via-transparent to-primary-300/20" />

      <main className="relative mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pt-6 pb-24 sm:px-6 md:flex-row md:gap-6 md:pb-8 lg:pt-8">
        {/* Sidebar nav */}
        <nav className="hidden w-48 shrink-0 md:block">
          <div className="sticky top-8">
            <h1 className="mb-4 text-lg font-semibold text-[var(--theme-text)] px-3">
              Settings
            </h1>
            <div className="flex flex-col gap-0.5">
              {SETTINGS_NAV_ITEMS.map((item) =>
                item.to ? (
                  <Link
                    key={item.id}
                    to={item.to}
                    className="rounded-lg px-3 py-2 text-left text-sm text-[var(--theme-muted)] transition-colors hover:bg-[var(--theme-panel)] hover:text-[var(--theme-text)]"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setActiveSection(item.id as SettingsSectionId)
                    }
                    className={cn(
                      'rounded-lg px-3 py-2 text-left text-sm transition-colors',
                      activeSection === item.id
                        ? 'bg-[var(--theme-accent)]/10 text-accent-600 font-medium'
                        : 'text-[var(--theme-muted)] hover:bg-[var(--theme-panel)] hover:text-[var(--theme-text)]',
                    )}
                  >
                    {item.label}
                  </button>
                ),
              )}
            </div>
          </div>
        </nav>

        {/* Mobile header — intentionally omitted; MobilePageHeader above shows "Settings" */}

        {/* Mobile section pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none md:hidden">
          {SETTINGS_NAV_ITEMS.map((item) =>
            item.to ? (
              <Link
                key={item.id}
                to={item.to}
                className="shrink-0 rounded-full bg-[var(--theme-panel)] px-3 py-1.5 text-xs font-medium text-[var(--theme-muted)] transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id as SettingsSectionId)}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  activeSection === item.id
                    ? 'bg-[var(--theme-accent)] text-white'
                    : 'bg-[var(--theme-panel)] text-[var(--theme-muted)]',
                )}
              >
                {item.label}
              </button>
            ),
          )}
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* ── Hermes Agent ──────────────────────────────────── */}
          {activeSection === 'hermes' && (
            <HermesConfigSection activeView="hermes" />
          )}
          {activeSection === 'agent' && (
            <HermesConfigSection activeView="agent" />
          )}
          {activeSection === 'routing' && (
            <HermesConfigSection activeView="routing" />
          )}
          {activeSection === 'voice' && (
            <HermesConfigSection activeView="voice" />
          )}
          {activeSection === 'display' && (
            <HermesConfigSection activeView="display" />
          )}
          {activeSection === 'permissions' && (
            <HermesConfigSection activeView="permissions" />
          )}

          {/* ── Appearance ──────────────────────────────────────── */}
          {activeSection === 'appearance' && (
            <>
              <SettingsSection
                title="Appearance"
                description="Choose a workspace theme and accent color."
                icon={PaintBoardIcon}
              >
                <SettingsRow
                  label="Theme"
                  description="All workspace themes are dark. Pick the palette you want to use."
                >
                  <div className="w-full">
                    <WorkspaceThemePicker />
                  </div>
                </SettingsRow>

                {/* Accent color removed — themes control accent */}
              </SettingsSection>
              {/* LoaderStyleSection removed — not relevant for Hermes */}
            </>
          )}

          {/* ── Chat ────────────────────────────────────────────── */}
          {activeSection === 'chat' && <ChatDisplaySection />}

          {/* ── Editor ──────────────────────────────────────────── */}
          {activeSection === ('editor' as SettingsSectionId) && (
            <SettingsSection
              title="Editor"
              description="Configure Monaco defaults for the files workspace."
              icon={SourceCodeSquareIcon}
            >
              <SettingsRow
                label="Font size"
                description="Adjust editor font size between 12 and 20."
              >
                <div className="flex w-full items-center gap-2 md:max-w-xs">
                  <input
                    type="range"
                    min={12}
                    max={20}
                    value={settings.editorFontSize}
                    onChange={(e) =>
                      updateSettings({ editorFontSize: Number(e.target.value) })
                    }
                    className="w-full accent-primary-900 dark:accent-primary-400"
                    aria-label={`Editor font size: ${settings.editorFontSize} pixels`}
                    aria-valuemin={12}
                    aria-valuemax={20}
                    aria-valuenow={settings.editorFontSize}
                  />
                  <span className="w-12 text-right text-sm tabular-nums text-[var(--theme-text)]">
                    {settings.editorFontSize}px
                  </span>
                </div>
              </SettingsRow>
              <SettingsRow
                label="Word wrap"
                description="Wrap long lines in the editor by default."
              >
                <Switch
                  checked={settings.editorWordWrap}
                  onCheckedChange={(checked) =>
                    updateSettings({ editorWordWrap: checked })
                  }
                  aria-label="Word wrap"
                />
              </SettingsRow>
              <SettingsRow
                label="Minimap"
                description="Show minimap preview in Monaco editor."
              >
                <Switch
                  checked={settings.editorMinimap}
                  onCheckedChange={(checked) =>
                    updateSettings({ editorMinimap: checked })
                  }
                  aria-label="Show minimap"
                />
              </SettingsRow>
            </SettingsSection>
          )}

          {/* ── Notifications ───────────────────────────────────── */}
          {activeSection === 'notifications' && (
            <>
              <SettingsSection
                title="Notifications"
                description="Control alert delivery and usage warning threshold."
                icon={Notification03Icon}
              >
                <SettingsRow
                  label="Enable alerts"
                  description="Show usage and system alert notifications."
                >
                  <Switch
                    checked={settings.notificationsEnabled}
                    onCheckedChange={(checked) =>
                      updateSettings({ notificationsEnabled: checked })
                    }
                    aria-label="Enable alerts"
                  />
                </SettingsRow>
                <SettingsRow
                  label="Usage threshold"
                  description="Set usage warning trigger between 50% and 100%."
                >
                  <div className="flex w-full items-center gap-2 md:max-w-xs">
                    <input
                      type="range"
                      min={50}
                      max={100}
                      value={settings.usageThreshold}
                      onChange={(e) =>
                        updateSettings({
                          usageThreshold: Number(e.target.value),
                        })
                      }
                      className="w-full accent-primary-900 dark:accent-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!settings.notificationsEnabled}
                      aria-label={`Usage threshold: ${settings.usageThreshold} percent`}
                      aria-valuemin={50}
                      aria-valuemax={100}
                      aria-valuenow={settings.usageThreshold}
                    />
                    <span className="w-12 text-right text-sm tabular-nums text-[var(--theme-text)]">
                      {settings.usageThreshold}%
                    </span>
                  </div>
                </SettingsRow>
              </SettingsSection>

              <SettingsSection
                title="Smart Suggestions"
                description="Get proactive model suggestions to optimize cost and quality."
                icon={Settings02Icon}
              >
                <SettingsRow
                  label="Enable smart suggestions"
                  description="Suggest cheaper models for simple tasks or better models for complex work."
                >
                  <Switch
                    checked={settings.smartSuggestionsEnabled}
                    onCheckedChange={(checked) =>
                      updateSettings({ smartSuggestionsEnabled: checked })
                    }
                    aria-label="Enable smart suggestions"
                  />
                </SettingsRow>
                <SettingsRow
                  label="Preferred budget model"
                  description="Default model for cheaper suggestions (leave empty for auto-detect)."
                >
                  <select
                    value={settings.preferredBudgetModel}
                    onChange={(e) =>
                      updateSettings({ preferredBudgetModel: e.target.value })
                    }
                    className="h-9 w-full rounded-lg border border-[var(--theme-border)] dark:border-gray-600 bg-[var(--theme-bg)] dark:bg-gray-800 px-3 text-sm text-[var(--theme-text)] dark:text-gray-100 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary-400 dark:focus-visible:ring-primary-500 md:max-w-xs"
                    aria-label="Preferred budget model"
                  >
                    <option value="">Auto-detect</option>
                    {modelsError && (
                      <option disabled>Failed to load models</option>
                    )}
                    {availableModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.label}
                      </option>
                    ))}
                  </select>
                </SettingsRow>
                <SettingsRow
                  label="Preferred premium model"
                  description="Default model for upgrade suggestions (leave empty for auto-detect)."
                >
                  <select
                    value={settings.preferredPremiumModel}
                    onChange={(e) =>
                      updateSettings({ preferredPremiumModel: e.target.value })
                    }
                    className="h-9 w-full rounded-lg border border-[var(--theme-border)] dark:border-gray-600 bg-[var(--theme-bg)] dark:bg-gray-800 px-3 text-sm text-[var(--theme-text)] dark:text-gray-100 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary-400 dark:focus-visible:ring-primary-500 md:max-w-xs"
                    aria-label="Preferred premium model"
                  >
                    <option value="">Auto-detect</option>
                    {modelsError && (
                      <option disabled>Failed to load models</option>
                    )}
                    {availableModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.label}
                      </option>
                    ))}
                  </select>
                </SettingsRow>
                <SettingsRow
                  label="Only suggest cheaper models"
                  description="Never suggest upgrades, only suggest cheaper alternatives."
                >
                  <Switch
                    checked={settings.onlySuggestCheaper}
                    onCheckedChange={(checked) =>
                      updateSettings({ onlySuggestCheaper: checked })
                    }
                    aria-label="Only suggest cheaper models"
                  />
                </SettingsRow>
              </SettingsSection>
            </>
          )}

          {/* ── Integrations ────────────────────────────────────── */}
          {activeSection === 'integrations' && <IntegrationsSection />}

          {/* ── Identity ────────────────────────────────────────── */}
          {activeSection === 'identity' && <IdentityFileEditor />}

          {/* ── Auto-start ──────────────────────────────────────── */}
          {activeSection === 'autostart' && <SystemdAutoStartSection />}

          <footer className="mt-auto pt-4">
            <div className="flex items-center gap-2 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)]/70 p-3 text-sm text-[var(--theme-muted)] backdrop-blur-sm">
              <HugeiconsIcon
                icon={Settings02Icon}
                size={20}
                strokeWidth={1.5}
              />
              <span className="text-pretty">
                Changes are saved automatically to local storage.
              </span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  )
}

// ── Identity File Editor ──────────────────────────────────────────────────────

/**
 * Reads and writes the three identity-defining files in ~/.hermes:
 *   • SOUL.md      — agent persona / tone (loaded every message, no restart)
 *   • persona.md   — startup directives (read at session start)
 *   • CLAUDE.md    — coding guidelines / project context
 *
 * All I/O goes through GET|POST /api/files which is scoped to ~/.hermes.
 */
const IDENTITY_FILES = [
  {
    path: 'SOUL.md',
    label: 'Soul (persona)',
    description:
      'Defines the agent\'s personality and tone. Loaded fresh on every message — changes take effect immediately without restarting Hermes.',
  },
  {
    path: 'persona.md',
    label: 'Persona (startup)',
    description:
      'Startup directive read at the beginning of each session. Use this to instruct the agent to load identity files, memory logs, or user profiles.',
  },
  {
    path: 'CLAUDE.md',
    label: 'CLAUDE.md (project context)',
    description:
      'Coding guidelines and project context injected into every Claude Code session. Edit to add custom rules or remove unwanted defaults.',
  },
] as const

type IdentityFilePath = (typeof IDENTITY_FILES)[number]['path']

async function readIdentityFile(path: IdentityFilePath): Promise<string> {
  const res = await fetch(`/api/files?action=read&path=${encodeURIComponent(path)}`)
  if (!res.ok) {
    if (res.status === 404) return ''
    throw new Error(`HTTP ${res.status}`)
  }
  const data = await res.json()
  return typeof data.content === 'string' ? data.content : ''
}

async function writeIdentityFile(
  path: IdentityFilePath,
  content: string,
): Promise<void> {
  const res = await fetch('/api/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'write', path, content }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

function IdentityFileEditor() {
  const [selectedPath, setSelectedPath] = useState<IdentityFilePath>('SOUL.md')
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{
    text: string
    kind: 'success' | 'error'
  } | null>(null)

  const selectedFile = IDENTITY_FILES.find((f) => f.path === selectedPath)!
  const isDirty = content !== originalContent

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setMessage(null)
    readIdentityFile(selectedPath)
      .then((text) => {
        if (!cancelled) {
          setContent(text)
          setOriginalContent(text)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setMessage({
            text: err instanceof Error ? err.message : 'Failed to load',
            kind: 'error',
          })
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [selectedPath])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await writeIdentityFile(selectedPath, content)
      setOriginalContent(content)
      setMessage({ text: 'Saved.', kind: 'success' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : 'Failed to save',
        kind: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDiscard = () => {
    setContent(originalContent)
    setMessage(null)
  }

  return (
    <SettingsSection
      title="Identity Files"
      description="Edit the files that define your Hermes agent's personality, startup behaviour, and coding guidelines. Changes are saved directly to ~/.hermes."
      icon={UserIcon}
    >
      {/* File picker */}
      <div className="flex flex-wrap gap-2 mb-4">
        {IDENTITY_FILES.map((f) => (
          <button
            key={f.path}
            type="button"
            onClick={() => {
              if (isDirty && !window.confirm('Discard unsaved changes?')) return
              setSelectedPath(f.path)
            }}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border',
              selectedPath === f.path
                ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/10 text-[var(--theme-accent)]'
                : 'border-[var(--theme-border)] bg-[var(--theme-panel)] text-[var(--theme-muted)] hover:text-[var(--theme-text)]',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Description */}
      <p className="text-xs text-[var(--theme-muted)] mb-3">
        {selectedFile.description}
      </p>

      {/* Editor */}
      {loading ? (
        <div className="h-48 flex items-center justify-center text-sm text-[var(--theme-muted)]">
          Loading…
        </div>
      ) : (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          spellCheck={false}
          rows={18}
          placeholder={`# ${selectedPath}\n\nStart writing…`}
          className="w-full resize-y rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)] px-3 py-2.5 font-mono text-xs leading-relaxed text-[var(--theme-text)] outline-none focus:border-[var(--theme-accent)] transition-colors"
          style={{ minHeight: '12rem' }}
        />
      )}

      {/* Feedback message */}
      {message && (
        <div
          className="rounded-lg px-3 py-2 text-xs font-medium mt-2"
          style={{
            backgroundColor:
              message.kind === 'error'
                ? 'rgba(239,68,68,0.12)'
                : 'rgba(34,197,94,0.12)',
            color: message.kind === 'error' ? '#ef4444' : '#22c55e',
          }}
        >
          {message.text}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 mt-3">
        <span className="text-[10px] text-[var(--theme-muted)]">
          {isDirty ? 'Unsaved changes' : 'Up to date'}
        </span>
        <div className="flex gap-2">
          {isDirty && (
            <Button size="sm" variant="outline" onClick={handleDiscard}>
              Discard
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !isDirty}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </SettingsSection>
  )
}

// ── Integrations Section ─────────────────────────────────────────────────────

function IntegrationsSection() {
  const [apiKey, setApiKey] = useState('')
  const [status, setStatus] = useState<{
    keySet: boolean
    keyMasked: string
    fromEnv: boolean
  } | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    fetch('/api/skills/settings')
      .then((r) => r.json())
      .then((d: { skillsmpApiKeySet?: boolean; skillsmpApiKeyMasked?: string; skillsmpApiKeyFromEnv?: boolean }) => {
        setStatus({
          keySet: Boolean(d.skillsmpApiKeySet),
          keyMasked: d.skillsmpApiKeyMasked || '',
          fromEnv: Boolean(d.skillsmpApiKeyFromEnv),
        })
      })
      .catch(() => {})
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch('/api/skills/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillsmpApiKey: apiKey }),
      })
      const d = await res.json() as { ok?: boolean; skillsmpApiKeySet?: boolean; skillsmpApiKeyMasked?: string; skillsmpApiKeyFromEnv?: boolean; error?: string }
      if (!res.ok || !d.ok) throw new Error(d.error || 'Failed to save')
      setStatus({
        keySet: Boolean(d.skillsmpApiKeySet),
        keyMasked: d.skillsmpApiKeyMasked || '',
        fromEnv: Boolean(d.skillsmpApiKeyFromEnv),
      })
      setApiKey('')
      setShowKey(false)
      setSaveMsg('API key saved.')
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleClear() {
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch('/api/skills/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillsmpApiKey: '' }),
      })
      const d = await res.json() as { ok?: boolean; skillsmpApiKeySet?: boolean; skillsmpApiKeyMasked?: string; skillsmpApiKeyFromEnv?: boolean; error?: string }
      if (!res.ok || !d.ok) throw new Error(d.error || 'Failed to clear')
      setStatus({
        keySet: Boolean(d.skillsmpApiKeySet),
        keyMasked: d.skillsmpApiKeyMasked || '',
        fromEnv: Boolean(d.skillsmpApiKeyFromEnv),
      })
      setApiKey('')
      setSaveMsg('API key removed.')
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Failed to clear')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
    <SettingsSection
      title="Integrations"
      description="Connect external services used by Hermes Studio features."
      icon={SparklesIcon}
    >
      <SettingsRow
        label="skillsmp.com API key"
        description={
          <span>
            Required for Skills marketplace search.{' '}
            <a
              href="https://skillsmp.com/docs/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:opacity-80"
            >
              Get your key at skillsmp.com/docs/api →
            </a>
          </span>
        }
      >
        <div className="flex w-full flex-col gap-2 md:max-w-sm">
          {status?.fromEnv ? (
            <p className="text-xs text-[var(--theme-muted)]">
              Key is set via <code className="inline-code">SKILLSMP_API_KEY</code>{' '}
              environment variable and cannot be changed here.
            </p>
          ) : (
            <>
              {status?.keySet && (
                <div className="flex items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-panel)]/60 px-3 py-2 text-sm">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="shrink-0 text-green-600" />
                  <span className="font-mono text-xs text-[var(--theme-text)] flex-1 truncate">
                    {status.keyMasked}
                  </span>
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={saving}
                    className="text-xs text-[var(--theme-muted)] hover:text-red-600 transition-colors disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  type={showKey ? 'text' : 'password'}
                  placeholder={status?.keySet ? 'Enter new key to replace…' : 'sk_live_…'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1 font-mono text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && apiKey.trim()) void handleSave()
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="px-2 text-xs text-[var(--theme-muted)] hover:text-[var(--theme-text)] transition-colors"
                  aria-label={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <Button
                size="sm"
                disabled={saving || !apiKey.trim()}
                onClick={() => void handleSave()}
              >
                {saving ? 'Saving…' : 'Save key'}
              </Button>
              {saveMsg && (
                <p className="text-xs text-[var(--theme-muted)]">{saveMsg}</p>
              )}
            </>
          )}
        </div>
      </SettingsRow>
    </SettingsSection>
    <PlatformsSection />
    </>
  )
}

// ── Platforms Section (chat platform tokens → ~/.hermes/.env) ────────────────

const CHAT_PLATFORMS = [
  {
    key: 'telegram',
    label: 'Telegram',
    envVar: 'TELEGRAM_BOT_TOKEN',
    placeholder: '1234567890:AAFxxxxxx',
    hint: 'Create a bot via @BotFather on Telegram.',
    allowedUsersVar: 'TELEGRAM_ALLOWED_USERS',
    allowedUsersPlaceholder: '123456789,987654321',
  },
  {
    key: 'discord',
    label: 'Discord',
    envVar: 'DISCORD_BOT_TOKEN',
    placeholder: 'MTxxxxxxxxxxxxxxx.Gxxxxx.xxxx',
    hint: 'Create a bot at discord.com/developers.',
    allowedUsersVar: 'DISCORD_ALLOWED_USERS',
    allowedUsersPlaceholder: 'username#0000 or user ID',
  },
  {
    key: 'slack',
    label: 'Slack',
    envVar: 'SLACK_BOT_TOKEN',
    placeholder: 'xoxb-…',
    hint: 'Create a Slack App at api.slack.com.',
    allowedUsersVar: 'SLACK_ALLOWED_USERS',
    allowedUsersPlaceholder: 'U01234567',
  },
  {
    key: 'signal',
    label: 'Signal',
    envVar: 'SIGNAL_HTTP_URL',
    placeholder: 'http://localhost:8080',
    hint: 'Requires signal-cli running as an HTTP daemon.',
    allowedUsersVar: 'SIGNAL_ACCOUNT',
    allowedUsersPlaceholder: '+1234567890',
  },
  {
    key: 'bluebubbles',
    label: 'BlueBubbles (iMessage)',
    envVar: 'BLUEBUBBLES_URL',
    placeholder: 'http://your-mac:1234',
    hint: 'Requires BlueBubbles server running on a Mac.',
    allowedUsersVar: 'BLUEBUBBLES_PASSWORD',
    allowedUsersPlaceholder: 'server password',
  },
  {
    key: 'wechat',
    label: 'WeChat (Weixin)',
    envVar: 'WECHAT_ILINK_TOKEN',
    placeholder: 'iLink Bot API token',
    hint: 'Via iLink Bot API — requires WeChat Official Account.',
    allowedUsersVar: 'WECHAT_ALLOWED_USERS',
    allowedUsersPlaceholder: 'WeChat user IDs',
  },
  {
    key: 'wecom',
    label: 'WeCom (Enterprise)',
    envVar: 'WECOM_CORP_ID',
    placeholder: 'your-corp-id',
    hint: 'WeCom callback mode — self-built enterprise app.',
    allowedUsersVar: 'WECOM_AGENT_SECRET',
    allowedUsersPlaceholder: 'agent secret',
  },
] as const

type PlatformKey = (typeof CHAT_PLATFORMS)[number]['key']

function PlatformsSection() {
  // envVars: current values from ~/.hermes/.env (masked)
  const [envStatus, setEnvStatus] = useState<Record<string, boolean>>({})
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [msgs, setMsgs] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/hermes-config')
      .then((r) => r.json())
      .then((d: { config?: Record<string, unknown> }) => {
        // The GET returns config but not raw env values (masked).
        // We can only detect whether the token is configured by checking
        // the platform section in config.yaml (platforms: { telegram: { enabled } }).
        // As a proxy, treat any non-empty value in our local inputs as "set".
        // Reset — presence is inferred from the PATCH response later.
        void d
        setEnvStatus({})
      })
      .catch(() => {})
  }, [])

  const setInput = (key: string, value: string) =>
    setInputs((prev) => ({ ...prev, [key]: value }))

  const saveToken = async (platform: (typeof CHAT_PLATFORMS)[number]) => {
    const token = (inputs[platform.key] || '').trim()
    setSaving((prev) => ({ ...prev, [platform.key]: true }))
    setMsgs((prev) => ({ ...prev, [platform.key]: '' }))
    try {
      const res = await fetch('/api/hermes-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          env: { [platform.envVar]: token },
        }),
      })
      const d = (await res.json()) as { ok?: boolean; message?: string }
      if (!res.ok) throw new Error(d.message || 'Failed to save')
      setEnvStatus((prev) => ({ ...prev, [platform.key]: Boolean(token) }))
      setInputs((prev) => ({ ...prev, [platform.key]: '' }))
      setMsgs((prev) => ({
        ...prev,
        [platform.key]: token
          ? 'Saved. Restart the gateway to connect.'
          : 'Token removed.',
      }))
    } catch (err) {
      setMsgs((prev) => ({
        ...prev,
        [platform.key]: err instanceof Error ? err.message : 'Failed to save',
      }))
    }
    setSaving((prev) => ({ ...prev, [platform.key]: false }))
  }

  const saveAllowedUsers = async (
    platform: (typeof CHAT_PLATFORMS)[number],
  ) => {
    const value = (inputs[`${platform.key}_allowed`] || '').trim()
    setSaving((prev) => ({ ...prev, [`${platform.key}_allowed`]: true }))
    setMsgs((prev) => ({ ...prev, [`${platform.key}_allowed`]: '' }))
    try {
      const res = await fetch('/api/hermes-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          env: { [platform.allowedUsersVar]: value },
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setMsgs((prev) => ({
        ...prev,
        [`${platform.key}_allowed`]: 'Saved.',
      }))
      setInputs((prev) => ({ ...prev, [`${platform.key}_allowed`]: '' }))
    } catch (err) {
      setMsgs((prev) => ({
        ...prev,
        [`${platform.key}_allowed`]: err instanceof Error ? err.message : 'Failed',
      }))
    }
    setSaving((prev) => ({ ...prev, [`${platform.key}_allowed`]: false }))
  }

  return (
    <SettingsSection
      title="Messaging Platforms"
      description="Connect Hermes to chat platforms. Tokens are saved to ~/.hermes/.env and take effect after restarting the gateway with hermes --gateway."
      icon={MessageMultiple01Icon}
    >
      {CHAT_PLATFORMS.map((platform) => (
        <div key={platform.key} className="flex flex-col gap-3 border-t border-[var(--theme-border)] pt-4 first:border-0 first:pt-0">
          <p className="text-sm font-semibold text-[var(--theme-text)]">
            {platform.label}
            {envStatus[platform.key] && (
              <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                configured
              </span>
            )}
          </p>
          <p className="text-xs text-[var(--theme-muted)]">{platform.hint}</p>

          {/* Token field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[var(--theme-text)]">
              {platform.key === 'signal' ? 'HTTP URL' : 'Bot Token'}
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={inputs[platform.key] || ''}
                onChange={(e) => setInput(platform.key, e.target.value)}
                placeholder={platform.placeholder}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void saveToken(platform)
                }}
                className="flex-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 py-1.5 font-mono text-xs text-[var(--theme-text)] placeholder:text-[var(--theme-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
              />
              <button
                type="button"
                onClick={() => void saveToken(platform)}
                disabled={saving[platform.key]}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: 'var(--theme-accent)' }}
              >
                {saving[platform.key] ? 'Saving…' : 'Save'}
              </button>
              {envStatus[platform.key] && (
                <button
                  type="button"
                  onClick={() => {
                    setInputs((prev) => ({ ...prev, [platform.key]: ' ' }))
                    void saveToken({ ...platform })
                  }}
                  disabled={saving[platform.key]}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Remove
                </button>
              )}
            </div>
            {msgs[platform.key] && (
              <p className="text-xs text-[var(--theme-muted)]">
                {msgs[platform.key]}
              </p>
            )}
          </div>

          {/* Allowed users / account field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[var(--theme-text)]">
              {platform.key === 'signal' ? 'Signal Account' : 'Allowed Users'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputs[`${platform.key}_allowed`] || ''}
                onChange={(e) =>
                  setInput(`${platform.key}_allowed`, e.target.value)
                }
                placeholder={platform.allowedUsersPlaceholder}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void saveAllowedUsers(platform)
                }}
                className="flex-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 py-1.5 font-mono text-xs text-[var(--theme-text)] placeholder:text-[var(--theme-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
              />
              <button
                type="button"
                onClick={() => void saveAllowedUsers(platform)}
                disabled={saving[`${platform.key}_allowed`]}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: 'var(--theme-accent)' }}
              >
                {saving[`${platform.key}_allowed`] ? 'Saving…' : 'Save'}
              </button>
            </div>
            {msgs[`${platform.key}_allowed`] && (
              <p className="text-xs text-[var(--theme-muted)]">
                {msgs[`${platform.key}_allowed`]}
              </p>
            )}
          </div>
        </div>
      ))}
    </SettingsSection>
  )
}

// ── Profile Section ─────────────────────────────────────────────────────

const PROFILE_IMAGE_MAX_DIMENSION = 128
const PROFILE_IMAGE_MAX_FILE_SIZE = 10 * 1024 * 1024

function _ProfileSection() {
  const { settings: chatSettings, updateSettings: updateChatSettings } =
    useChatSettingsStore()
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileProcessing, setProfileProcessing] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const displayName = getChatProfileDisplayName(chatSettings.displayName)

  function handleNameChange(value: string) {
    if (value.length > 50) {
      setNameError('Display name too long (max 50 characters)')
      return
    }
    setNameError(null)
    updateChatSettings({ displayName: value })
  }

  async function handleAvatarUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setProfileError('Unsupported file type.')
      return
    }
    if (file.size > PROFILE_IMAGE_MAX_FILE_SIZE) {
      setProfileError('Image too large (max 10MB).')
      return
    }
    setProfileError(null)
    setProfileProcessing(true)
    try {
      const url = URL.createObjectURL(file)
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image()
        i.onload = () => resolve(i)
        i.onerror = () => reject(new Error('Failed to load image'))
        i.src = url
      })
      const max = PROFILE_IMAGE_MAX_DIMENSION
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      updateChatSettings({ avatarDataUrl: canvas.toDataURL(outputType, 0.82) })
    } catch {
      setProfileError('Failed to process image.')
    } finally {
      setProfileProcessing(false)
    }
  }

  return (
    <SettingsSection
      title="Profile"
      description="Your display name and avatar for chat."
      icon={UserIcon}
    >
      <div className="flex items-center gap-4">
        <UserAvatar
          size={56}
          src={chatSettings.avatarDataUrl}
          alt={displayName}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--theme-text)]">{displayName}</p>
          <p className="text-xs text-[var(--theme-muted)]">
            Shown in the sidebar and chat messages.
          </p>
        </div>
      </div>
      <SettingsRow label="Display name" description="Leave blank for default.">
        <div className="w-full md:max-w-xs">
          <Input
            value={chatSettings.displayName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="User"
            className="h-9 w-full"
            maxLength={50}
            aria-label="Display name"
            aria-invalid={!!nameError}
            aria-describedby={nameError ? 'profile-name-error' : undefined}
          />
          {nameError && (
            <p
              id="profile-name-error"
              className="mt-1 text-xs text-red-600"
              role="alert"
            >
              {nameError}
            </p>
          )}
        </div>
      </SettingsRow>
      <SettingsRow
        label="Profile picture"
        description="Resized to 128×128, stored locally."
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={profileProcessing}
                aria-label="Upload profile picture"
                className="block w-full cursor-pointer text-xs text-[var(--theme-text)] dark:text-gray-300 md:max-w-xs file:mr-2 file:cursor-pointer file:rounded-md file:border file:border-[var(--theme-border)] dark:file:border-gray-600 file:bg-[var(--theme-panel)] dark:file:bg-gray-700 file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-[var(--theme-text)] dark:file:text-gray-100 file:transition-colors hover:file:bg-[var(--theme-hover)] dark:hover:file:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateChatSettings({ avatarDataUrl: null })}
              disabled={!chatSettings.avatarDataUrl || profileProcessing}
            >
              Remove
            </Button>
          </div>
          {profileError && (
            <p className="text-xs text-red-600" role="alert">
              {profileError}
            </p>
          )}
        </div>
      </SettingsRow>
    </SettingsSection>
  )
}

// ── Chat Display Section ────────────────────────────────────────────────

function ChatDisplaySection() {
  const { settings: chatSettings, updateSettings: updateChatSettings } =
    useChatSettingsStore()
  const { settings, updateSettings } = useSettings()

  return (
    <>
      <SettingsSection
        title="Chat Display"
        description="Control what's visible in chat messages."
        icon={MessageMultiple01Icon}
      >
        <SettingsRow
          label="Show tool messages"
          description="Display tool call details when the agent uses tools."
        >
          <Switch
            checked={chatSettings.showToolMessages}
            onCheckedChange={(checked) =>
              updateChatSettings({ showToolMessages: checked })
            }
            aria-label="Show tool messages"
          />
        </SettingsRow>
        <SettingsRow
          label="Show reasoning blocks"
          description="Display model thinking and reasoning process."
        >
          <Switch
            checked={chatSettings.showReasoningBlocks}
            onCheckedChange={(checked) =>
              updateChatSettings({ showReasoningBlocks: checked })
            }
            aria-label="Show reasoning blocks"
          />
        </SettingsRow>
      </SettingsSection>
      {/* Mobile Navigation removed — not relevant for Hermes Studio */}
    </>
  )
}

// ── Loader Style Section ────────────────────────────────────────────────

type LoaderStyleOption = { value: LoaderStyle; label: string }

const LOADER_STYLES: Array<LoaderStyleOption> = [
  { value: 'dots', label: 'Dots' },
  { value: 'braille-hermes', label: 'Hermes' },
  { value: 'braille-orbit', label: 'Orbit' },
  { value: 'braille-breathe', label: 'Breathe' },
  { value: 'braille-pulse', label: 'Pulse' },
  { value: 'braille-wave', label: 'Wave' },
  { value: 'lobster', label: 'Lobster' },
  { value: 'logo', label: 'Logo' },
]

function getPreset(style: LoaderStyle): BrailleSpinnerPreset | null {
  const map: Record<string, BrailleSpinnerPreset> = {
    'braille-hermes': 'hermes',
    'braille-orbit': 'orbit',
    'braille-breathe': 'breathe',
    'braille-pulse': 'pulse',
    'braille-wave': 'wave',
  }
  return map[style] ?? null
}

function LoaderPreview({ style }: { style: LoaderStyle }) {
  if (style === 'dots') return <ThreeDotsSpinner />
  if (style === 'lobster')
    return <span className="inline-block text-sm animate-pulse">🦞</span>
  if (style === 'logo') return <LogoLoader />
  const preset = getPreset(style)
  return preset ? (
    <BrailleSpinner
      preset={preset}
      size={16}
      speed={120}
      className="text-[var(--theme-muted)]"
    />
  ) : (
    <ThreeDotsSpinner />
  )
}

function _LoaderStyleSection() {
  const { settings: chatSettings, updateSettings: updateChatSettings } =
    useChatSettingsStore()

  return (
    <SettingsSection
      title="Loading Animation"
      description="Choose the animation while the assistant is streaming."
      icon={Settings02Icon}
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {LOADER_STYLES.map((option) => {
          const active = chatSettings.loaderStyle === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => updateChatSettings({ loaderStyle: option.value })}
              className={cn(
                'flex min-h-16 flex-col items-center justify-center gap-2 rounded-xl border px-2 py-2 transition-colors',
                active
                  ? 'border-[var(--theme-accent)] bg-[var(--theme-accent-subtle)] text-[var(--theme-text)]'
                  : 'border-[var(--theme-border)] bg-[var(--theme-bg)] text-[var(--theme-text)] hover:bg-[var(--theme-panel)]',
              )}
              aria-pressed={active}
            >
              <span className="flex h-5 items-center justify-center">
                <LoaderPreview style={option.value} />
              </span>
              <span className="text-[11px] font-medium text-center leading-4">
                {option.label}
              </span>
            </button>
          )
        })}
      </div>
    </SettingsSection>
  )
}

// ── Hermes Agent Configuration ──────────────────────────────────────

type HermesProvider = {
  id: string
  name: string
  authType: string
  envKeys: Array<string>
  configured: boolean
  maskedKeys: Record<string, string>
}

type HermesConfigData = {
  config: Record<string, unknown>
  providers: Array<HermesProvider>
  activeProvider: string
  activeModel: string
  hermesHome: string
}

const HERMES_API = process.env.HERMES_API_URL || 'http://127.0.0.1:8642'

type AvailableModelsResponse = {
  provider: string
  models: Array<{ id: string; description: string }>
  providers: Array<{ id: string; label: string; authenticated: boolean }>
}

const KNOWN_PLATFORMS = [
  'telegram', 'discord', 'slack', 'whatsapp', 'signal',
  'homeassistant', 'mattermost', 'matrix', 'bluebubbles',
  'sms', 'email', 'webhook', 'cli',
]

function AddPlatformOverride({
  existing,
  onAdd,
}: {
  existing: Array<string>
  onAdd: (platform: string) => void
}) {
  const [selected, setSelected] = useState('')
  const available = KNOWN_PLATFORMS.filter((p) => !existing.includes(p))
  if (available.length === 0) return null
  return (
    <div className="flex items-center gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-2 py-1 text-xs text-[var(--theme-text)] focus:outline-none"
      >
        <option value="">add platform…</option>
        {available.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      {selected && (
        <button
          onClick={() => { onAdd(selected); setSelected('') }}
          className="rounded px-2 py-0.5 text-xs font-medium transition-colors hover:bg-[var(--theme-hover)]"
          style={{ color: 'var(--theme-accent)' }}
        >
          add
        </button>
      )}
    </div>
  )
}

function HermesConfigSection({
  activeView = 'hermes',
}: {
  activeView?: 'hermes' | 'agent' | 'permissions' | 'routing' | 'voice' | 'display'
}) {
  const [data, setData] = useState<HermesConfigData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [keyInput, setKeyInput] = useState('')
  const [modelInput, setModelInput] = useState('')
  const [providerInput, setProviderInput] = useState('')
  const [baseUrlInput, setBaseUrlInput] = useState('')
  const [newToolset, setNewToolset] = useState('')
  const [newAllowlistCmd, setNewAllowlistCmd] = useState('')
  const [newBlocklistDomain, setNewBlocklistDomain] = useState('')
  const [newQcKey, setNewQcKey] = useState('')
  const [newQcVal, setNewQcVal] = useState('')

  const [availableProviders, setAvailableProviders] = useState<
    Array<{ id: string; label: string; authenticated: boolean }>
  >([])
  const [availableModels, setAvailableModels] = useState<
    Array<{ id: string; description: string }>
  >([])
  const [loadingModels, setLoadingModels] = useState(false)

  const syncInputsFromData = useCallback((configData: HermesConfigData) => {
    setModelInput(configData.activeModel || '')
    setProviderInput(configData.activeProvider || '')
    setBaseUrlInput((configData.config?.base_url as string) || '')
  }, [])

  const fetchConfig = useCallback(async () => {
    const res = await fetch('/api/hermes-config')
    const configData = (await res.json()) as HermesConfigData
    setData(configData)
    syncInputsFromData(configData)
    return configData
  }, [syncInputsFromData])

  const fetchModelsForProvider = useCallback(async (provider: string) => {
    if (!provider) {
      setAvailableModels([])
      return
    }
    setLoadingModels(true)
    try {
      const res = await fetch(
        `/api/hermes-proxy/api/available-models?provider=${encodeURIComponent(provider)}`,
      )
      if (res.ok) {
        const result = (await res.json()) as AvailableModelsResponse
        setAvailableModels(result.models || [])
        if (result.providers?.length) setAvailableProviders(result.providers)
      }
    } catch {
      // ignore
    }
    setLoadingModels(false)
  }, [])

  useEffect(() => {
    fetchConfig()
      .then((configData) => {
        setLoading(false)
        if (configData.activeProvider) {
          void fetchModelsForProvider(configData.activeProvider)
        }
      })
      .catch(() => setLoading(false))
  }, [fetchConfig, fetchModelsForProvider])

  const saveConfig = async (updates: {
    config?: Record<string, unknown>
    env?: Record<string, string>
  }) => {
    setSaving(true)
    setSaveMessage(null)
    try {
      const res = await fetch('/api/hermes-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const result = (await res.json()) as { message?: string }
      setSaveMessage(result.message || 'Saved')
      const refreshData = await fetchConfig()
      if (refreshData.activeProvider) {
        void fetchModelsForProvider(refreshData.activeProvider)
      }
      setTimeout(() => setSaveMessage(null), 3000)
    } catch {
      setSaveMessage('Failed to save')
    }
    setSaving(false)
  }

  const selectClassName =
    'h-9 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] px-3 text-sm text-[var(--theme-text)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary-400 md:max-w-sm'

  const readNumber = (value: unknown, fallback: number) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  const readBoolean = (value: unknown, fallback: boolean) => {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') return value === 'true'
    return fallback
  }

  const saveNumberField = (
    section: string,
    field: string,
    rawValue: string,
    fallback: number,
  ) => {
    const value = rawValue === '' ? fallback : Number(rawValue)
    if (!Number.isFinite(value)) return
    void saveConfig({ config: { [section]: { [field]: value } } })
  }

  if (loading) {
    return (
      <SettingsSection
        title="Hermes Agent"
        description="Loading configuration..."
        icon={Settings02Icon}
      >
        <div
          className="h-20 animate-pulse rounded-lg"
          style={{ backgroundColor: 'var(--theme-panel)' }}
        />
      </SettingsSection>
    )
  }

  if (!data) {
    return (
      <SettingsSection
        title="Hermes Agent"
        description="Could not load Hermes configuration."
        icon={Settings02Icon}
      >
        <p className="text-sm" style={{ color: 'var(--theme-muted)' }}>
          Make sure Hermes Agent is running on localhost:8642
        </p>
      </SettingsSection>
    )
  }

  const memoryConfig = (data.config.memory as Record<string, unknown>) || {}
  const terminalConfig = (data.config.terminal as Record<string, unknown>) || {}
  const displayConfig = (data.config.display as Record<string, unknown>) || {}
  const agentConfig = (data.config.agent as Record<string, unknown>) || {}
  const smartRouting =
    (data.config.smart_model_routing as Record<string, unknown>) || {}
  const ttsConfig = (data.config.tts as Record<string, unknown>) || {}
  const sttConfig = (data.config.stt as Record<string, unknown>) || {}
  const customProviders = Array.isArray(data.config.custom_providers)
    ? (data.config.custom_providers as Array<Record<string, unknown>>)
    : []
  const securityConfig = (data.config.security as Record<string, unknown>) || {}
  const websiteBlocklist =
    (securityConfig.website_blocklist as Record<string, unknown>) || {}
  const approvalsConfig =
    (data.config.approvals as Record<string, unknown>) || {}
  const codeExecConfig =
    (data.config.code_execution as Record<string, unknown>) || {}
  const toolsets = Array.isArray(data.config.toolsets)
    ? (data.config.toolsets as Array<string>)
    : []
  const commandAllowlist = Array.isArray(data.config.command_allowlist)
    ? (data.config.command_allowlist as Array<string>)
    : []
  const blocklistDomains = Array.isArray(websiteBlocklist.domains)
    ? (websiteBlocklist.domains as Array<string>)
    : []
  const quickCommands =
    data.config.quick_commands &&
    typeof data.config.quick_commands === 'object' &&
    !Array.isArray(data.config.quick_commands)
      ? (data.config.quick_commands as Record<string, string>)
      : {}

  const sessionResetConfig =
    (data.config.session_reset as Record<string, unknown>) || {}
  const platformOverrides =
    displayConfig.platforms &&
    typeof displayConfig.platforms === 'object' &&
    !Array.isArray(displayConfig.platforms)
      ? (displayConfig.platforms as Record<string, Record<string, string>>)
      : {}

  const ttsProvider = (ttsConfig.provider as string) || 'edge'
  const ttsEdge = (ttsConfig.edge as Record<string, unknown>) || {}
  const ttsElevenLabs = (ttsConfig.elevenlabs as Record<string, unknown>) || {}
  const ttsOpenAi = (ttsConfig.openai as Record<string, unknown>) || {}
  const sttProvider = (sttConfig.provider as string) || 'local'
  const sttLocal = (sttConfig.local as Record<string, unknown>) || {}

  const renderHermesOverview = () => (
    <>
      <SettingsSection
        title="Model & Provider"
        description="Configure the default AI model for Hermes Agent."
        icon={SourceCodeSquareIcon}
      >
        <SettingsRow
          label="Provider"
          description="Select the inference provider."
        >
          <div className="flex w-full max-w-sm gap-2">
            {availableProviders.length > 0 ? (
              <select
                value={providerInput}
                onChange={(e) => {
                  const newProvider = e.target.value
                  setProviderInput(newProvider)
                  setModelInput('')
                  void fetchModelsForProvider(newProvider)
                }}
                className={selectClassName}
              >
                {availableProviders.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                    {p.authenticated ? ' ✓' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                value={providerInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setProviderInput(e.target.value)
                }
                placeholder="e.g. ollama, anthropic, openai-codex"
                className="flex-1"
              />
            )}
          </div>
        </SettingsRow>
        <SettingsRow
          label="Model"
          description="The model Hermes uses for conversations."
        >
          <div className="flex w-full max-w-sm gap-2">
            {availableModels.length > 0 ? (
              <select
                value={modelInput}
                onChange={(e) => setModelInput(e.target.value)}
                className={`${selectClassName} font-mono`}
              >
                {!availableModels.some((m) => m.id === modelInput) &&
                  modelInput && (
                    <option value={modelInput}>{modelInput} (current)</option>
                  )}
                {availableModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id}
                    {m.description ? ` — ${m.description}` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                value={modelInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setModelInput(e.target.value)
                }
                placeholder={
                  loadingModels ? 'Loading models...' : 'e.g. qwen3.5:35b'
                }
                className="flex-1 font-mono"
              />
            )}
          </div>
        </SettingsRow>
        <SettingsRow
          label="Base URL"
          description="For local providers (Ollama, LM Studio, MLX). Leave blank for cloud."
        >
          <div className="flex w-full max-w-sm gap-2">
            <Input
              value={baseUrlInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setBaseUrlInput(e.target.value)
              }
              placeholder="e.g. http://localhost:11434/v1"
              className="flex-1 font-mono text-sm"
            />
          </div>
        </SettingsRow>
        <div className="flex justify-end pt-2">
          <Button
            size="sm"
            disabled={saving}
            onClick={() => {
              const configUpdate: Record<string, unknown> = {
                model: modelInput.trim(),
                provider: providerInput.trim(),
                base_url: baseUrlInput.trim() || null,
              }
              void saveConfig({ config: configUpdate })
            }}
          >
            {saving ? 'Saving...' : 'Save Model'}
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection
        title="API Keys"
        description="Manage provider API keys stored in ~/.hermes/.env"
        icon={CloudIcon}
      >
        {data.providers
          .filter((p) => p.envKeys.length > 0)
          .map((provider) => (
            <SettingsRow
              key={provider.id}
              label={provider.name}
              description={
                provider.configured ? '✅ Configured' : '❌ Not configured'
              }
            >
              <div className="flex w-full max-w-sm items-center gap-2">
                {provider.envKeys.map((envKey) => (
                  <div key={envKey} className="flex-1">
                    {editingKey === envKey ? (
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          value={keyInput}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setKeyInput(e.target.value)
                          }
                          placeholder={`Enter ${envKey}`}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            void saveConfig({ env: { [envKey]: keyInput } })
                            setEditingKey(null)
                            setKeyInput('')
                          }}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingKey(null)
                            setKeyInput('')
                          }}
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-mono"
                          style={{ color: 'var(--theme-muted)' }}
                        >
                          {provider.maskedKeys[envKey] || 'Not set'}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingKey(envKey)
                            setKeyInput('')
                          }}
                        >
                          {provider.configured ? 'Change' : 'Add'}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </SettingsRow>
          ))}
      </SettingsSection>

      <SettingsSection
        title="Memory"
        description="Configure Hermes Agent memory and user profiles."
        icon={UserIcon}
      >
        <SettingsRow
          label="Memory enabled"
          description="Store and recall memories across sessions."
        >
          <Switch
            checked={memoryConfig.memory_enabled !== false}
            onCheckedChange={(checked: boolean) =>
              void saveConfig({
                config: { memory: { memory_enabled: checked } },
              })
            }
          />
        </SettingsRow>
        <SettingsRow
          label="User profile"
          description="Remember user preferences and context."
        >
          <Switch
            checked={memoryConfig.user_profile_enabled !== false}
            onCheckedChange={(checked: boolean) =>
              void saveConfig({
                config: { memory: { user_profile_enabled: checked } },
              })
            }
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        title="Terminal"
        description="Shell execution settings."
        icon={SourceCodeSquareIcon}
      >
        <SettingsRow label="Backend" description="Terminal execution backend.">
          <span
            className="text-sm font-mono"
            style={{ color: 'var(--theme-muted)' }}
          >
            {(terminalConfig.backend as string) || 'local'}
          </span>
        </SettingsRow>
        <SettingsRow
          label="Timeout"
          description="Max seconds for terminal commands."
        >
          <Input
            type="number"
            min={10}
            value={readNumber(terminalConfig.timeout, 180)}
            onChange={(e) =>
              saveNumberField('terminal', 'timeout', e.target.value, 180)
            }
            className="md:w-28"
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        title="Custom Providers"
        description="Read-only provider details loaded from config.yaml."
        icon={CloudIcon}
      >
        <div className="space-y-3">
          {customProviders.length === 0 ? (
            <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-panel)]/40 p-3 text-sm text-[var(--theme-muted)]">
              No custom providers configured.
            </div>
          ) : (
            customProviders.map((provider, index) => (
              <div
                key={`${String(provider.name || provider.base_url || index)}`}
                className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-panel)]/40 p-3"
              >
                <div className="grid gap-2 text-sm md:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--theme-muted)]">
                      Name
                    </p>
                    <p className="font-medium text-[var(--theme-text)]">
                      {String(provider.name || 'Unnamed')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--theme-muted)]">
                      Base URL
                    </p>
                    <p className="font-mono text-xs text-[var(--theme-text)] break-all">
                      {String(provider.base_url || 'Not set')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--theme-muted)]">
                      Type
                    </p>
                    <p className="text-[var(--theme-text)]">
                      {String(provider.type || provider.auth_type || 'Unknown')}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
          <div className="flex flex-col gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-panel)]/40 p-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-[var(--theme-muted)]">
              Edit custom providers in config.yaml for security.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                void navigator.clipboard?.writeText(data.hermesHome)
              }
            >
              Copy config path
            </Button>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="About"
        description="Hermes Agent runtime information."
        icon={Notification03Icon}
      >
        <SettingsRow
          label="Config location"
          description="Where Hermes stores its configuration."
        >
          <span
            className="text-xs font-mono"
            style={{ color: 'var(--theme-muted)' }}
          >
            {data.hermesHome}
          </span>
        </SettingsRow>
        <SettingsRow
          label="Active provider"
          description="Current inference provider."
        >
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--theme-accent)' }}
          >
            {data.providers.find((p) => p.id === data.activeProvider)?.name ||
              data.activeProvider}
          </span>
        </SettingsRow>
      </SettingsSection>
    </>
  )

  const renderAgentBehavior = () => (
    <SettingsSection
      title="Agent Behavior"
      description="Control agent execution limits and tool access."
      icon={Settings02Icon}
    >
      <SettingsRow
        label="Max turns"
        description="Maximum agent turns per request (1-100)."
      >
        <Input
          type="number"
          min={1}
          max={100}
          value={readNumber(agentConfig.max_turns, 50)}
          onChange={(e) =>
            saveNumberField('agent', 'max_turns', e.target.value, 50)
          }
          className="md:w-28"
        />
      </SettingsRow>
      <SettingsRow
        label="Gateway timeout"
        description="Seconds before gateway times out a request."
      >
        <Input
          type="number"
          min={10}
          max={600}
          value={readNumber(agentConfig.gateway_timeout, 120)}
          onChange={(e) =>
            saveNumberField('agent', 'gateway_timeout', e.target.value, 120)
          }
          className="md:w-28"
        />
      </SettingsRow>
      <SettingsRow
        label="Tool use enforcement"
        description="Whether the agent must use tools when available."
      >
        <select
          value={(agentConfig.tool_use_enforcement as string) || 'auto'}
          onChange={(e) =>
            void saveConfig({
              config: { agent: { tool_use_enforcement: e.target.value } },
            })
          }
          className={selectClassName}
        >
          <option value="auto">auto</option>
          <option value="required">required</option>
          <option value="none">none</option>
        </select>
      </SettingsRow>
      <SettingsRow
        label="Session reset mode"
        description="When to automatically clear conversation context."
      >
        <select
          value={(sessionResetConfig.mode as string) || 'both'}
          onChange={(e) =>
            void saveConfig({
              config: { session_reset: { mode: e.target.value } },
            })
          }
          className={selectClassName}
        >
          <option value="none">never</option>
          <option value="daily">daily (at hour)</option>
          <option value="idle">idle timeout</option>
          <option value="both">both</option>
        </select>
      </SettingsRow>
      {['daily', 'both'].includes(
        (sessionResetConfig.mode as string) || 'both',
      ) && (
        <SettingsRow
          label="Reset hour"
          description="Hour of day (0–23, local time) for daily session reset."
        >
          <Input
            type="number"
            min={0}
            max={23}
            value={readNumber(sessionResetConfig.at_hour, 4)}
            onChange={(e) =>
              saveNumberField('session_reset', 'at_hour', e.target.value, 4)
            }
            className="md:w-24"
          />
        </SettingsRow>
      )}
      {['idle', 'both'].includes(
        (sessionResetConfig.mode as string) || 'both',
      ) && (
        <SettingsRow
          label="Idle timeout"
          description="Minutes of inactivity before the session resets."
        >
          <Input
            type="number"
            min={1}
            value={readNumber(sessionResetConfig.idle_minutes, 1440)}
            onChange={(e) =>
              saveNumberField(
                'session_reset',
                'idle_minutes',
                e.target.value,
                1440,
              )
            }
            className="md:w-28"
          />
        </SettingsRow>
      )}
    </SettingsSection>
  )

  const renderPermissions = () => {
    const removeToolset = (ts: string) => {
      void saveConfig({ config: { toolsets: toolsets.filter((t) => t !== ts) } })
    }

    const addToolset = () => {
      const trimmed = newToolset.trim()
      if (!trimmed || toolsets.includes(trimmed)) return
      void saveConfig({ config: { toolsets: [...toolsets, trimmed] } })
      setNewToolset('')
    }

    return (
      <>
        <SettingsSection
          title="Approvals"
          description="Control how Hermes requests approval for dangerous actions."
          icon={LockIcon}
        >
          <SettingsRow
            label="Approval mode"
            description="manual = prompt the user; auto = approve automatically; off = skip approval checks."
          >
            <select
              value={(approvalsConfig.mode as string) || 'manual'}
              onChange={(e) =>
                void saveConfig({
                  config: { approvals: { mode: e.target.value } },
                })
              }
              className={selectClassName}
            >
              <option value="manual">manual</option>
              <option value="auto">auto</option>
              <option value="off">off</option>
            </select>
          </SettingsRow>
          <SettingsRow
            label="Approval timeout (seconds)"
            description="Seconds to wait for user response before auto-denying."
          >
            <Input
              type="number"
              min={5}
              max={600}
              value={readNumber(approvalsConfig.timeout, 60)}
              onChange={(e) =>
                saveNumberField('approvals', 'timeout', e.target.value, 60)
              }
              className="md:w-28"
            />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection
          title="Toolsets"
          description="Which tool collections are available to the agent. Changes take effect after gateway restart."
          icon={LockIcon}
        >
          <SettingsRow
            label="Active toolsets"
            description="Remove a toolset to revoke access to that group of tools."
          >
            <div className="flex w-full flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                {toolsets.length === 0 ? (
                  <span className="text-xs text-[var(--theme-muted)]">
                    No toolsets configured
                  </span>
                ) : (
                  toolsets.map((ts) => (
                    <span
                      key={ts}
                      className="flex items-center gap-1 rounded-full border border-[var(--theme-border)] bg-[var(--theme-card)] px-2.5 py-1 text-xs font-medium text-[var(--theme-text)]"
                    >
                      {ts}
                      <button
                        type="button"
                        onClick={() => removeToolset(ts)}
                        className="ml-0.5 text-[var(--theme-muted)] hover:text-[var(--theme-danger)] transition-colors"
                        aria-label={`Remove ${ts}`}
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input
                  value={newToolset}
                  onChange={(e) => setNewToolset(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addToolset()
                    }
                  }}
                  placeholder="hermes-web, hermes-memory…"
                  className="flex-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 py-1.5 text-xs text-[var(--theme-text)] placeholder:text-[var(--theme-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] md:max-w-xs"
                />
                <button
                  type="button"
                  onClick={addToolset}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ background: 'var(--theme-accent)' }}
                  disabled={!newToolset.trim()}
                >
                  Add
                </button>
              </div>
            </div>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection
          title="Security"
          description="Tirith security scanner and secret redaction settings."
          icon={LockIcon}
        >
          <SettingsRow
            label="Redact secrets"
            description="Automatically redact API keys and tokens from agent memory and logs."
          >
            <Switch
              checked={readBoolean(securityConfig.redact_secrets, true)}
              onCheckedChange={(checked) =>
                void saveConfig({
                  config: { security: { redact_secrets: checked } },
                })
              }
            />
          </SettingsRow>
          <SettingsRow
            label="Tirith security scanner"
            description="Block dangerous commands using the Tirith policy engine."
          >
            <Switch
              checked={readBoolean(securityConfig.tirith_enabled, true)}
              onCheckedChange={(checked) =>
                void saveConfig({
                  config: { security: { tirith_enabled: checked } },
                })
              }
            />
          </SettingsRow>
          <SettingsRow
            label="Website blocklist"
            description="Prevent the agent from browsing blocked domains."
          >
            <Switch
              checked={readBoolean(websiteBlocklist.enabled, false)}
              onCheckedChange={(checked) =>
                void saveConfig({
                  config: {
                    security: { website_blocklist: { enabled: checked } },
                  },
                })
              }
            />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection
          title="Code Execution"
          description="Limits applied to sandboxed code and tool execution."
          icon={LockIcon}
        >
          <SettingsRow
            label="Execution timeout (seconds)"
            description="Maximum seconds for a single code execution block."
          >
            <Input
              type="number"
              min={10}
              max={3600}
              value={readNumber(codeExecConfig.timeout, 300)}
              onChange={(e) =>
                saveNumberField('code_execution', 'timeout', e.target.value, 300)
              }
              className="md:w-28"
            />
          </SettingsRow>
          <SettingsRow
            label="Max tool calls per turn"
            description="Hard limit on tool invocations per agent turn."
          >
            <Input
              type="number"
              min={1}
              max={500}
              value={readNumber(codeExecConfig.max_tool_calls, 50)}
              onChange={(e) =>
                saveNumberField(
                  'code_execution',
                  'max_tool_calls',
                  e.target.value,
                  50,
                )
              }
              className="md:w-28"
            />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection
          title="Agent Reasoning"
          description="Reasoning effort and verbosity controls."
          icon={LockIcon}
        >
          <SettingsRow
            label="Reasoning effort"
            description="How much time the agent spends thinking before responding."
          >
            <select
              value={(agentConfig.reasoning_effort as string) || 'medium'}
              onChange={(e) =>
                void saveConfig({
                  config: { agent: { reasoning_effort: e.target.value } },
                })
              }
              className={selectClassName}
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </SettingsRow>
          <SettingsRow
            label="Verbose mode"
            description="Show detailed tool output and internal agent steps."
          >
            <Switch
              checked={readBoolean(agentConfig.verbose, false)}
              onCheckedChange={(checked) =>
                void saveConfig({ config: { agent: { verbose: checked } } })
              }
            />
          </SettingsRow>
        </SettingsSection>

        {/* ── Command Allowlist ──────────────────────────────────── */}
        <SettingsSection
          title="Command Allowlist"
          description="Shell commands that bypass the Tirith security scanner and never require approval."
          icon={LockIcon}
        >
          <SettingsRow
            label="Allowed commands"
            description="Add exact command names (e.g. git, npm). Wildcards are not supported."
          >
            <div className="flex w-full flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                {commandAllowlist.length === 0 ? (
                  <span className="text-xs text-[var(--theme-muted)]">No commands allowlisted</span>
                ) : (
                  commandAllowlist.map((cmd) => (
                    <span
                      key={cmd}
                      className="flex items-center gap-1 rounded-full border border-[var(--theme-border)] bg-[var(--theme-card)] px-2.5 py-1 font-mono text-xs font-medium text-[var(--theme-text)]"
                    >
                      {cmd}
                      <button
                        type="button"
                        onClick={() =>
                          void saveConfig({
                            config: {
                              command_allowlist: commandAllowlist.filter(
                                (c) => c !== cmd,
                              ),
                            },
                          })
                        }
                        className="ml-0.5 text-[var(--theme-muted)] hover:text-[var(--theme-danger)] transition-colors"
                        aria-label={`Remove ${cmd}`}
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input
                  value={newAllowlistCmd}
                  onChange={(e) => setNewAllowlistCmd(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const trimmed = newAllowlistCmd.trim()
                      if (!trimmed || commandAllowlist.includes(trimmed)) return
                      void saveConfig({
                        config: {
                          command_allowlist: [...commandAllowlist, trimmed],
                        },
                      })
                      setNewAllowlistCmd('')
                    }
                  }}
                  placeholder="git, npm, make…"
                  className="flex-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 py-1.5 font-mono text-xs text-[var(--theme-text)] placeholder:text-[var(--theme-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] md:max-w-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = newAllowlistCmd.trim()
                    if (!trimmed || commandAllowlist.includes(trimmed)) return
                    void saveConfig({
                      config: {
                        command_allowlist: [...commandAllowlist, trimmed],
                      },
                    })
                    setNewAllowlistCmd('')
                  }}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ background: 'var(--theme-accent)' }}
                  disabled={!newAllowlistCmd.trim()}
                >
                  Add
                </button>
              </div>
            </div>
          </SettingsRow>
        </SettingsSection>

        {/* ── Website Blocklist Domains ──────────────────────────── */}
        {readBoolean(websiteBlocklist.enabled, false) && (
          <SettingsSection
            title="Blocked Domains"
            description="Domains the agent cannot browse. Active because the website blocklist is enabled above."
            icon={LockIcon}
          >
            <SettingsRow
              label="Blocked domains"
              description="Enter one domain per entry (e.g. example.com). Subdomains are included."
            >
              <div className="flex w-full flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  {blocklistDomains.length === 0 ? (
                    <span className="text-xs text-[var(--theme-muted)]">
                      No domains blocked yet
                    </span>
                  ) : (
                    blocklistDomains.map((domain) => (
                      <span
                        key={domain}
                        className="flex items-center gap-1 rounded-full border border-[var(--theme-border)] bg-[var(--theme-card)] px-2.5 py-1 font-mono text-xs font-medium text-[var(--theme-text)]"
                      >
                        {domain}
                        <button
                          type="button"
                          onClick={() =>
                            void saveConfig({
                              config: {
                                security: {
                                  website_blocklist: {
                                    domains: blocklistDomains.filter(
                                      (d) => d !== domain,
                                    ),
                                  },
                                },
                              },
                            })
                          }
                          className="ml-0.5 text-[var(--theme-muted)] hover:text-[var(--theme-danger)] transition-colors"
                          aria-label={`Remove ${domain}`}
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    value={newBlocklistDomain}
                    onChange={(e) => setNewBlocklistDomain(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const trimmed = newBlocklistDomain.trim().toLowerCase()
                        if (!trimmed || blocklistDomains.includes(trimmed)) return
                        void saveConfig({
                          config: {
                            security: {
                              website_blocklist: {
                                domains: [...blocklistDomains, trimmed],
                              },
                            },
                          },
                        })
                        setNewBlocklistDomain('')
                      }
                    }}
                    placeholder="example.com"
                    className="flex-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 py-1.5 font-mono text-xs text-[var(--theme-text)] placeholder:text-[var(--theme-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] md:max-w-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = newBlocklistDomain.trim().toLowerCase()
                      if (!trimmed || blocklistDomains.includes(trimmed)) return
                      void saveConfig({
                        config: {
                          security: {
                            website_blocklist: {
                              domains: [...blocklistDomains, trimmed],
                            },
                          },
                        },
                      })
                      setNewBlocklistDomain('')
                    }}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                    style={{ background: 'var(--theme-accent)' }}
                    disabled={!newBlocklistDomain.trim()}
                  >
                    Add
                  </button>
                </div>
              </div>
            </SettingsRow>
          </SettingsSection>
        )}

        {/* ── Quick Commands ─────────────────────────────────────── */}
        <SettingsSection
          title="Quick Commands"
          description="Custom slash-command shortcuts. Type /key in chat to expand to the full value."
          icon={LockIcon}
        >
          <SettingsRow
            label="Shortcuts"
            description="Key: the slash-command name (no slash). Value: the text it expands to."
          >
            <div className="flex w-full flex-col gap-2">
              {Object.keys(quickCommands).length === 0 ? (
                <span className="text-xs text-[var(--theme-muted)]">
                  No quick commands configured
                </span>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {Object.entries(quickCommands).map(([key, val]) => (
                    <div
                      key={key}
                      className="flex items-start gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-card)] px-3 py-2 text-xs"
                    >
                      <span className="shrink-0 font-mono font-semibold text-[var(--theme-accent)]">
                        /{key}
                      </span>
                      <span className="min-w-0 flex-1 break-words text-[var(--theme-text)]">
                        {val}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = { ...quickCommands }
                          delete next[key]
                          void saveConfig({ config: { quick_commands: next } })
                        }}
                        className="shrink-0 text-[var(--theme-muted)] hover:text-[var(--theme-danger)] transition-colors"
                        aria-label={`Remove /${key}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* Add new quick command */}
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex gap-2">
                  <input
                    value={newQcKey}
                    onChange={(e) =>
                      setNewQcKey(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))
                    }
                    placeholder="key"
                    className="w-28 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 py-1.5 font-mono text-xs text-[var(--theme-text)] placeholder:text-[var(--theme-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
                  />
                  <input
                    value={newQcVal}
                    onChange={(e) => setNewQcVal(e.target.value)}
                    placeholder="expansion text…"
                    className="flex-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 py-1.5 text-xs text-[var(--theme-text)] placeholder:text-[var(--theme-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const k = newQcKey.trim()
                        const v = newQcVal.trim()
                        if (!k || !v) return
                        void saveConfig({
                          config: {
                            quick_commands: { ...quickCommands, [k]: v },
                          },
                        })
                        setNewQcKey('')
                        setNewQcVal('')
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const k = newQcKey.trim()
                      const v = newQcVal.trim()
                      if (!k || !v) return
                      void saveConfig({
                        config: {
                          quick_commands: { ...quickCommands, [k]: v },
                        },
                      })
                      setNewQcKey('')
                      setNewQcVal('')
                    }}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                    style={{ background: 'var(--theme-accent)' }}
                    disabled={!newQcKey.trim() || !newQcVal.trim()}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </SettingsRow>
        </SettingsSection>
      </>
    )
  }

  const renderSmartRouting = () => (
    <SettingsSection
      title="Smart Model Routing"
      description="Automatically route simple queries to cheaper models."
      icon={SparklesIcon}
    >
      <SettingsRow
        label="Enable smart routing"
        description="Route simple queries to a cheaper model automatically."
      >
        <Switch
          checked={readBoolean(smartRouting.enabled, false)}
          onCheckedChange={(checked) =>
            void saveConfig({
              config: { smart_model_routing: { enabled: checked } },
            })
          }
        />
      </SettingsRow>
      <SettingsRow
        label="Cheap model"
        description="Model to use for simple queries."
      >
        <select
          value={(smartRouting.cheap_model as string) || ''}
          onChange={(e) =>
            void saveConfig({
              config: { smart_model_routing: { cheap_model: e.target.value } },
            })
          }
          className={selectClassName}
        >
          <option value="">Select model</option>
          {availableModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.id}
            </option>
          ))}
        </select>
      </SettingsRow>
      <SettingsRow
        label="Max simple chars"
        description="Messages shorter than this use the cheap model."
      >
        <Input
          type="number"
          min={1}
          value={readNumber(smartRouting.max_simple_chars, 500)}
          onChange={(e) =>
            saveNumberField(
              'smart_model_routing',
              'max_simple_chars',
              e.target.value,
              500,
            )
          }
          className="md:w-32"
        />
      </SettingsRow>
      <SettingsRow
        label="Max simple words"
        description="Messages with fewer words use the cheap model."
      >
        <Input
          type="number"
          min={1}
          value={readNumber(smartRouting.max_simple_words, 80)}
          onChange={(e) =>
            saveNumberField(
              'smart_model_routing',
              'max_simple_words',
              e.target.value,
              80,
            )
          }
          className="md:w-32"
        />
      </SettingsRow>
    </SettingsSection>
  )

  const renderVoice = () => (
    <div className="space-y-4">
      <SettingsSection
        title="Text-to-Speech"
        description="Configure voice output for agent responses."
        icon={VolumeHighIcon}
      >
        <SettingsRow
          label="TTS provider"
          description="Which TTS engine to use."
        >
          <select
            value={ttsProvider}
            onChange={(e) =>
              void saveConfig({ config: { tts: { provider: e.target.value } } })
            }
            className={selectClassName}
          >
            <option value="edge">Edge TTS (free)</option>
            <option value="elevenlabs">ElevenLabs</option>
            <option value="openai">OpenAI TTS</option>
            <option value="neutts">NeuTTS</option>
          </select>
        </SettingsRow>

        {ttsProvider === 'edge' && (
          <SettingsRow label="Voice" description="Edge voice name.">
            <Input
              value={(ttsEdge.voice as string) || ''}
              onChange={(e) =>
                void saveConfig({
                  config: { tts: { edge: { voice: e.target.value } } },
                })
              }
              placeholder="en-US-AriaNeural"
              className="md:w-64"
            />
          </SettingsRow>
        )}

        {ttsProvider === 'elevenlabs' && (
          <>
            <SettingsRow label="Voice ID" description="ElevenLabs voice_id.">
              <Input
                value={(ttsElevenLabs.voice_id as string) || ''}
                onChange={(e) =>
                  void saveConfig({
                    config: {
                      tts: { elevenlabs: { voice_id: e.target.value } },
                    },
                  })
                }
                className="md:w-64"
              />
            </SettingsRow>
            <SettingsRow label="Model" description="ElevenLabs model name.">
              <Input
                value={(ttsElevenLabs.model as string) || ''}
                onChange={(e) =>
                  void saveConfig({
                    config: { tts: { elevenlabs: { model: e.target.value } } },
                  })
                }
                className="md:w-64"
              />
            </SettingsRow>
          </>
        )}

        {ttsProvider === 'openai' && (
          <>
            <SettingsRow
              label="Voice"
              description="alloy, echo, fable, onyx, nova, shimmer"
            >
              <select
                value={(ttsOpenAi.voice as string) || 'alloy'}
                onChange={(e) =>
                  void saveConfig({
                    config: { tts: { openai: { voice: e.target.value } } },
                  })
                }
                className={selectClassName}
              >
                {['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'].map(
                  (voice) => (
                    <option key={voice} value={voice}>
                      {voice}
                    </option>
                  ),
                )}
              </select>
            </SettingsRow>
            <SettingsRow label="Model" description="OpenAI TTS model.">
              <Input
                value={(ttsOpenAi.model as string) || ''}
                onChange={(e) =>
                  void saveConfig({
                    config: { tts: { openai: { model: e.target.value } } },
                  })
                }
                placeholder="tts-1"
                className="md:w-64"
              />
            </SettingsRow>
          </>
        )}
      </SettingsSection>

      <SettingsSection
        title="Speech-to-Text"
        description="Configure voice input recognition."
        icon={Mic01Icon}
      >
        <SettingsRow label="Enable STT" description="Turn on voice input.">
          <Switch
            checked={readBoolean(sttConfig.enabled, false)}
            onCheckedChange={(checked) =>
              void saveConfig({ config: { stt: { enabled: checked } } })
            }
          />
        </SettingsRow>
        <SettingsRow
          label="STT provider"
          description="Which speech engine to use."
        >
          <select
            value={sttProvider}
            onChange={(e) =>
              void saveConfig({ config: { stt: { provider: e.target.value } } })
            }
            className={selectClassName}
          >
            <option value="local">Local (Whisper)</option>
            <option value="openai">OpenAI Whisper API</option>
          </select>
        </SettingsRow>
        {sttProvider === 'local' && (
          <SettingsRow
            label="Model size"
            description="tiny, base, small, medium, large"
          >
            <select
              value={(sttLocal.model_size as string) || 'base'}
              onChange={(e) =>
                void saveConfig({
                  config: { stt: { local: { model_size: e.target.value } } },
                })
              }
              className={selectClassName}
            >
              {['tiny', 'base', 'small', 'medium', 'large'].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </SettingsRow>
        )}
      </SettingsSection>
    </div>
  )

  const renderDisplay = () => (
    <SettingsSection
      title="Display"
      description="CLI display preferences reflected in the agent UI."
      icon={PaintBoardIcon}
    >
      <SettingsRow label="Personality" description="Agent response style.">
        <select
          value={(displayConfig.personality as string) || 'default'}
          onChange={(e) =>
            void saveConfig({
              config: { display: { personality: e.target.value } },
            })
          }
          className={selectClassName}
        >
          {['default', 'concise', 'verbose', 'creative'].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </SettingsRow>
      <SettingsRow
        label="Streaming"
        description="Stream tokens as they arrive."
      >
        <Switch
          checked={readBoolean(displayConfig.streaming, true)}
          onCheckedChange={(checked) =>
            void saveConfig({ config: { display: { streaming: checked } } })
          }
        />
      </SettingsRow>
      <SettingsRow
        label="Status messages"
        description="Show natural mid-turn assistant status messages while a run is in progress."
      >
        <Switch
          checked={readBoolean(displayConfig.interim_assistant_messages, true)}
          onCheckedChange={(checked) =>
            void saveConfig({
              config: { display: { interim_assistant_messages: checked } },
            })
          }
        />
      </SettingsRow>
      <SettingsRow
        label="Show reasoning"
        description="Expose model reasoning blocks in the UI."
      >
        <Switch
          checked={readBoolean(displayConfig.show_reasoning, false)}
          onCheckedChange={(checked) =>
            void saveConfig({
              config: { display: { show_reasoning: checked } },
            })
          }
        />
      </SettingsRow>
      <SettingsRow label="Show cost" description="Display usage cost metadata.">
        <Switch
          checked={readBoolean(displayConfig.show_cost, false)}
          onCheckedChange={(checked) =>
            void saveConfig({ config: { display: { show_cost: checked } } })
          }
        />
      </SettingsRow>
      <SettingsRow label="Compact" description="Use a denser display layout.">
        <Switch
          checked={readBoolean(displayConfig.compact, false)}
          onCheckedChange={(checked) =>
            void saveConfig({ config: { display: { compact: checked } } })
          }
        />
      </SettingsRow>
      <SettingsRow label="Skin" description="CLI theme skin.">
        <span
          className="text-sm font-mono"
          style={{ color: 'var(--theme-muted)' }}
        >
          {(displayConfig.skin as string) || 'default'}
        </span>
      </SettingsRow>
      <SettingsRow
        label="Per-platform tool progress"
        description="Override tool progress display for specific messaging platforms."
      >
        <div className="flex flex-col gap-2">
          {Object.entries(platformOverrides).map(([platform, overrides]) => (
            <div key={platform} className="flex items-center gap-2">
              <span
                className="w-24 shrink-0 text-xs font-mono text-[var(--theme-text)]"
              >
                {platform}
              </span>
              <select
                value={(overrides.tool_progress as string) || 'all'}
                onChange={(e) => {
                  const updated = {
                    ...platformOverrides,
                    [platform]: { ...overrides, tool_progress: e.target.value },
                  }
                  void saveConfig({ config: { display: { platforms: updated } } })
                }}
                className={selectClassName}
              >
                <option value="all">all</option>
                <option value="new">new only</option>
                <option value="verbose">verbose</option>
                <option value="off">off</option>
              </select>
              <button
                onClick={() => {
                  const updated = { ...platformOverrides }
                  delete updated[platform]
                  void saveConfig({ config: { display: { platforms: updated } } })
                }}
                className="rounded px-2 py-0.5 text-xs transition-colors hover:bg-[var(--theme-hover)]"
                style={{ color: 'var(--theme-danger)' }}
              >
                remove
              </button>
            </div>
          ))}
          <AddPlatformOverride
            existing={Object.keys(platformOverrides)}
            onAdd={(platform) => {
              const updated = {
                ...platformOverrides,
                [platform]: { tool_progress: 'all' },
              }
              void saveConfig({ config: { display: { platforms: updated } } })
            }}
          />
        </div>
      </SettingsRow>
    </SettingsSection>
  )

  const sectionContent = {
    hermes: renderHermesOverview(),
    agent: renderAgentBehavior(),
    permissions: renderPermissions(),
    routing: renderSmartRouting(),
    voice: renderVoice(),
    display: renderDisplay(),
  } as const

  return (
    <>
      {saveMessage && (
        <div
          className="rounded-lg px-3 py-2 text-sm font-medium"
          style={{
            backgroundColor: saveMessage.includes('Failed')
              ? 'rgba(239,68,68,0.15)'
              : 'rgba(34,197,94,0.15)',
            color: saveMessage.includes('Failed') ? '#ef4444' : '#22c55e',
          }}
        >
          {saveMessage}
        </div>
      )}
      {sectionContent[activeView]}
    </>
  )
}

// ── Systemd Auto-start ────────────────────────────────────────────────────────

interface SystemdStatus {
  ok: boolean
  available: boolean
  installed: boolean
  active: boolean
  enabled: boolean
  output: string
}

function SystemdAutoStartSection() {
  const [status, setStatus] = useState<SystemdStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(
    null,
  )

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/systemd-status')
      const data = (await res.json()) as SystemdStatus
      setStatus(data)
    } catch {
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchStatus()
  }, [fetchStatus])

  const runAction = useCallback(
    async (action: string) => {
      setBusy(true)
      setMessage(null)
      try {
        const res = await fetch('/api/systemd-control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        })
        const data = (await res.json()) as { ok: boolean; output?: string }
        setMessage({
          text: data.output ?? (data.ok ? 'Done.' : 'Failed.'),
          ok: data.ok,
        })
        await fetchStatus()
      } catch (err: unknown) {
        setMessage({
          text: err instanceof Error ? err.message : 'Request failed',
          ok: false,
        })
      } finally {
        setBusy(false)
      }
    },
    [fetchStatus],
  )

  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--theme-surface)',
    border: '1px solid var(--theme-border)',
    borderRadius: '0.75rem',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  }

  const headingStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--theme-text)',
    margin: 0,
  }

  const muteStyle: React.CSSProperties = {
    fontSize: '0.8125rem',
    color: 'var(--theme-muted)',
    lineHeight: 1.5,
  }

  const statusDotStyle = (active: boolean): React.CSSProperties => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
    background: active ? '#22c55e' : 'var(--theme-muted)',
  })

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.8125rem',
    color: 'var(--theme-text)',
  }

  const btnStyle = (variant: 'primary' | 'danger' | 'ghost'): React.CSSProperties => ({
    padding: '0.375rem 0.875rem',
    borderRadius: '0.5rem',
    fontSize: '0.8125rem',
    fontWeight: 500,
    cursor: busy ? 'not-allowed' : 'pointer',
    opacity: busy ? 0.6 : 1,
    border: '1px solid',
    background:
      variant === 'primary'
        ? 'var(--theme-accent)'
        : variant === 'danger'
          ? 'rgba(239,68,68,0.12)'
          : 'transparent',
    borderColor:
      variant === 'primary'
        ? 'var(--theme-accent)'
        : variant === 'danger'
          ? 'rgba(239,68,68,0.4)'
          : 'var(--theme-border)',
    color:
      variant === 'primary'
        ? 'var(--theme-bg)'
        : variant === 'danger'
          ? '#ef4444'
          : 'var(--theme-text)',
  })

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginTop: '0.25rem',
  }

  if (loading) {
    return (
      <div style={{ color: 'var(--theme-muted)', fontSize: '0.875rem' }}>
        Checking systemd status…
      </div>
    )
  }

  if (!status?.available) {
    return (
      <div style={sectionStyle}>
        <p style={muteStyle}>
          Systemd auto-start is only available on Linux systems running systemd.
          This host does not support it.
        </p>
        <div
          style={{
            ...cardStyle,
            background: 'transparent',
            border: '1px dashed var(--theme-border)',
          }}
        >
          <p style={{ ...headingStyle, fontWeight: 400, ...muteStyle }}>
            You can still start Hermes Studio manually:
          </p>
          <pre
            style={{
              background: 'var(--theme-surface)',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              fontSize: '0.8125rem',
              color: 'var(--theme-text)',
              overflowX: 'auto',
              margin: 0,
            }}
          >
            {`cd /path/to/hermes-studio\npnpm build && node server-entry.js`}
          </pre>
        </div>
      </div>
    )
  }

  return (
    <div style={sectionStyle}>
      {/* Status Card */}
      <div style={cardStyle}>
        <h3 style={headingStyle}>Service Status</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={rowStyle}>
            <span style={statusDotStyle(status.installed)} />
            <span>
              {status.installed ? 'Unit installed' : 'Unit not installed'}
            </span>
          </div>
          {status.installed && (
            <>
              <div style={rowStyle}>
                <span style={statusDotStyle(status.active)} />
                <span>{status.active ? 'Running' : 'Stopped'}</span>
              </div>
              <div style={rowStyle}>
                <span style={statusDotStyle(status.enabled)} />
                <span>
                  {status.enabled ? 'Enabled (starts at login)' : 'Disabled'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={cardStyle}>
        <h3 style={headingStyle}>Actions</h3>
        <p style={muteStyle}>
          Manages a systemd user service unit at{' '}
          <code
            style={{
              fontFamily: 'monospace',
              background: 'var(--theme-surface)',
              borderRadius: 4,
              padding: '1px 5px',
            }}
          >
            ~/.config/systemd/user/hermes-studio.service
          </code>
          .
        </p>
        <div style={actionsStyle}>
          {!status.installed ? (
            <button
              style={btnStyle('primary')}
              disabled={busy}
              onClick={() => runAction('install')}
            >
              Install Service
            </button>
          ) : (
            <>
              {!status.active ? (
                <button
                  style={btnStyle('primary')}
                  disabled={busy}
                  onClick={() => runAction('start')}
                >
                  Start
                </button>
              ) : (
                <button
                  style={btnStyle('ghost')}
                  disabled={busy}
                  onClick={() => runAction('stop')}
                >
                  Stop
                </button>
              )}
              {!status.enabled ? (
                <button
                  style={btnStyle('ghost')}
                  disabled={busy}
                  onClick={() => runAction('enable')}
                >
                  Enable (start at login)
                </button>
              ) : (
                <button
                  style={btnStyle('ghost')}
                  disabled={busy}
                  onClick={() => runAction('disable')}
                >
                  Disable auto-start
                </button>
              )}
              <button
                style={btnStyle('danger')}
                disabled={busy}
                onClick={() => runAction('uninstall')}
              >
                Uninstall
              </button>
            </>
          )}
          <button
            style={btnStyle('ghost')}
            disabled={busy || loading}
            onClick={() => fetchStatus()}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Output */}
      {message && (
        <div
          style={{
            ...cardStyle,
            background: message.ok
              ? 'rgba(34,197,94,0.08)'
              : 'rgba(239,68,68,0.08)',
            borderColor: message.ok
              ? 'rgba(34,197,94,0.3)'
              : 'rgba(239,68,68,0.3)',
          }}
        >
          <pre
            style={{
              margin: 0,
              fontSize: '0.8125rem',
              color: message.ok ? '#22c55e' : '#ef4444',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {message.text}
          </pre>
        </div>
      )}

      {/* systemctl status output */}
      {status.installed && status.output && (
        <div style={cardStyle}>
          <h3 style={headingStyle}>systemctl status</h3>
          <pre
            style={{
              margin: 0,
              fontSize: '0.75rem',
              color: 'var(--theme-muted)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowX: 'auto',
              maxHeight: '16rem',
            }}
          >
            {status.output}
          </pre>
        </div>
      )}

      {/* Manual script */}
      <div
        style={{
          ...cardStyle,
          background: 'transparent',
          border: '1px dashed var(--theme-border)',
        }}
      >
        <h3 style={headingStyle}>Command-line install</h3>
        <p style={muteStyle}>
          You can also manage the service from a terminal using the bundled
          script:
        </p>
        <pre
          style={{
            background: 'var(--theme-surface)',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            fontSize: '0.8125rem',
            color: 'var(--theme-text)',
            overflowX: 'auto',
            margin: 0,
          }}
        >
          {`scripts/install-systemd.sh install\nscripts/install-systemd.sh enable\nscripts/install-systemd.sh start`}
        </pre>
      </div>
    </div>
  )
}
