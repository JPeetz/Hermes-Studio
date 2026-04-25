'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Cancel01Icon,
  Delete01Icon,
  Add01Icon,
} from '@hugeicons/core-free-icons'
import {
  fetchTemplates,
  deleteUserTemplate,
} from '@/lib/templates-api'
import type { CrewTemplate, CrewTemplateCategory } from '@/lib/templates-api'
import { fetchAgents } from '@/lib/agents-api'
import type { AgentDefinition } from '@/types/agent'
import { AGENT_PERSONAS } from '@/lib/agent-personas'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

const CATEGORIES: Array<{ value: 'all' | CrewTemplateCategory; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'research', label: 'Research' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'creative', label: 'Creative' },
  { value: 'operations', label: 'Operations' },
  { value: 'conductor', label: 'Conductor' },
]

const CATEGORY_COLORS: Record<CrewTemplateCategory, string> = {
  research: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  engineering: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  creative: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  operations: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  conductor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTemplate: (template: CrewTemplate) => void
}

function TemplateCard({
  template,
  agents,
  onSelect,
  onDelete,
  isDeleting,
}: {
  template: CrewTemplate
  agents: AgentDefinition[]
  onSelect: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  return (
    <div className="group flex flex-col rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-4 transition-colors hover:border-[var(--theme-accent)]/40">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl leading-none">{template.icon}</span>
          <div>
            <div className="text-sm font-semibold text-[var(--theme-text)]">
              {template.name}
            </div>
            <span
              className={cn(
                'mt-0.5 inline-block rounded-full border px-2 py-px text-[10px] font-medium',
                CATEGORY_COLORS[template.category],
              )}
            >
              {template.category}
            </span>
          </div>
        </div>
        {!template.isBuiltIn && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            disabled={isDeleting}
            title="Delete template"
            className="shrink-0 rounded-lg p-1.5 text-[var(--theme-muted)] opacity-0 transition-all hover:text-[var(--theme-danger)] group-hover:opacity-100 disabled:opacity-30"
          >
            <HugeiconsIcon icon={Delete01Icon} size={13} />
          </button>
        )}
      </div>

      {/* Description */}
      <p className="mb-3 line-clamp-2 text-xs text-[var(--theme-muted)] leading-relaxed">
        {template.description}
      </p>

      {/* Members */}
      <div className="mb-4 flex flex-wrap gap-1">
        {template.defaultMembers.map((m, i) => {
          const agent = agents.find((a) => a.name.toLowerCase() === m.persona)
          const builtIn = AGENT_PERSONAS.find((p) => p.name.toLowerCase() === m.persona)
          const emoji = agent?.emoji ?? builtIn?.emoji ?? '🤖'
          const displayName = agent?.name ?? builtIn?.name ?? m.persona
          return (
            <span
              key={i}
              title={`${displayName} — ${m.role}`}
              className="flex items-center gap-1 rounded-full border border-[var(--theme-border)] bg-[var(--theme-card2)] px-2 py-0.5 text-[10px] text-[var(--theme-muted)]"
            >
              <span>{emoji}</span>
              <span>{displayName}</span>
            </span>
          )
        })}
      </div>

      {/* Use button */}
      <button
        onClick={onSelect}
        className="mt-auto flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--theme-accent)] px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
      >
        <HugeiconsIcon icon={Add01Icon} size={13} />
        Use Template
      </button>
    </div>
  )
}

export function TemplatesGallery({ open, onOpenChange, onSelectTemplate }: Props) {
  const [activeCategory, setActiveCategory] = useState<'all' | CrewTemplateCategory>('all')
  const queryClient = useQueryClient()

  const templatesQuery = useQuery({
    queryKey: ['crew-templates'],
    queryFn: fetchTemplates,
    enabled: open,
  })

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgents,
    enabled: open,
    staleTime: 30_000,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUserTemplate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['crew-templates'] })
      toast('Template deleted')
    },
    onError: (err) => {
      toast(err instanceof Error ? err.message : 'Failed to delete template', {
        type: 'error',
      })
    },
  })

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onOpenChange])

  if (!open) return null

  const templates = templatesQuery.data ?? []
  const filtered =
    activeCategory === 'all'
      ? templates
      : templates.filter((t) => t.category === activeCategory)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="relative z-10 flex w-full max-w-3xl flex-col rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)] shadow-2xl"
        style={{ maxHeight: 'min(680px, 90vh)' }}>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--theme-border)] px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--theme-text)]">
              Crew Templates
            </h2>
            <p className="mt-0.5 text-xs text-[var(--theme-muted)]">
              Start from a pre-built configuration
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-1.5 text-[var(--theme-muted)] transition-colors hover:bg-[var(--theme-hover)] hover:text-[var(--theme-text)]"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </button>
        </div>

        {/* Category filter */}
        <div className="flex shrink-0 gap-1.5 border-b border-[var(--theme-border)] px-6 py-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                activeCategory === cat.value
                  ? 'bg-[var(--theme-accent)] text-white'
                  : 'text-[var(--theme-muted)] hover:bg-[var(--theme-hover)] hover:text-[var(--theme-text)]',
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {templatesQuery.isLoading ? (
            <div className="flex h-40 items-center justify-center text-sm text-[var(--theme-muted)]">
              Loading templates…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-[var(--theme-muted)]">
              No templates in this category
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  agents={agents}
                  onSelect={() => {
                    onOpenChange(false)
                    onSelectTemplate(template)
                  }}
                  onDelete={() => deleteMutation.mutate(template.id)}
                  isDeleting={deleteMutation.isPending && deleteMutation.variables === template.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
