'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  Delete01Icon,
  Edit01Icon,
  Search01Icon,
  UserMultiple02Icon,
  LockIcon,
  Copy01Icon,
} from '@hugeicons/core-free-icons'
import {
  fetchAgents,
  createAgent,
  updateAgent,
  deleteAgent,
} from '@/lib/agents-api'
import type { AgentDefinition, CreateAgentInput } from '@/types/agent'
import { AgentEditorDialog } from './agent-editor-dialog'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

const QUERY_KEY = ['agents'] as const

// ─── Agent card ───────────────────────────────────────────────────────────────

function AgentCard({
  agent,
  onEdit,
  onDelete,
  onDuplicate,
}: {
  agent: AgentDefinition
  onEdit: (agent: AgentDefinition) => void
  onDelete: (agent: AgentDefinition) => void
  onDuplicate: (agent: AgentDefinition) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="group rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-4 transition-colors hover:border-[var(--theme-accent)]/40 hover:bg-[var(--theme-hover)]">
      <div className="flex items-start gap-3">
        {/* Emoji + color */}
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--theme-bg)] text-xl border border-[var(--theme-border)]',
            agent.color,
          )}
        >
          {agent.emoji}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-[var(--theme-text)] truncate">
              {agent.name}
            </span>
            {agent.isBuiltIn && (
              <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-[var(--theme-bg)] text-[var(--theme-muted)] border border-[var(--theme-border)]">
                <HugeiconsIcon icon={LockIcon} size={9} />
                built-in
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--theme-muted)] truncate">{agent.roleLabel}</p>

          {/* Tags */}
          {agent.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {agent.tags.slice(0, 5).map((tag) => (
                <span
                  key={tag}
                  className="rounded px-1.5 py-0.5 text-[10px] bg-[var(--theme-bg)] text-[var(--theme-muted)] border border-[var(--theme-border)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* System prompt preview */}
          {agent.systemPrompt && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 text-left text-xs text-[var(--theme-muted)] hover:text-[var(--theme-text)] transition-colors"
            >
              {expanded ? (
                <span className="whitespace-pre-wrap font-mono leading-relaxed">
                  {agent.systemPrompt}
                </span>
              ) : (
                <span className="line-clamp-2 italic">
                  {agent.systemPrompt.slice(0, 120)}
                  {agent.systemPrompt.length > 120 ? '…' : ''}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onDuplicate(agent)}
            className="rounded p-1.5 text-[var(--theme-muted)] hover:bg-[var(--theme-bg)] hover:text-[var(--theme-text)] transition-colors"
            title="Duplicate"
          >
            <HugeiconsIcon icon={Copy01Icon} size={14} />
          </button>
          {!agent.isBuiltIn && (
            <>
              <button
                onClick={() => onEdit(agent)}
                className="rounded p-1.5 text-[var(--theme-muted)] hover:bg-[var(--theme-bg)] hover:text-[var(--theme-text)] transition-colors"
                title="Edit"
              >
                <HugeiconsIcon icon={Edit01Icon} size={14} />
              </button>
              <button
                onClick={() => onDelete(agent)}
                className="rounded p-1.5 text-[var(--theme-muted)] hover:bg-[var(--theme-bg)] hover:text-[var(--theme-danger)] transition-colors"
                title="Delete"
              >
                <HugeiconsIcon icon={Delete01Icon} size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

type Filter = 'all' | 'builtin' | 'custom'

export function AgentLibraryScreen() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<AgentDefinition | null>(null)

  const { data: agents = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchAgents,
    refetchInterval: false,
  })

  const createMutation = useMutation({
    mutationFn: createAgent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      setEditorOpen(false)
      setEditingAgent(null)
      toast('Agent created', { type: 'success' })
    },
    onError: (err: Error) => toast(err.message, { type: 'error' }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: CreateAgentInput }) =>
      updateAgent(id, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      setEditorOpen(false)
      setEditingAgent(null)
      toast('Agent updated', { type: 'success' })
    },
    onError: (err: Error) => toast(err.message, { type: 'error' }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAgent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      toast('Agent deleted', { type: 'success' })
    },
    onError: (err: Error) => toast(err.message, { type: 'error' }),
  })

  function handleEdit(agent: AgentDefinition) {
    setEditingAgent(agent)
    setEditorOpen(true)
  }

  function handleDelete(agent: AgentDefinition) {
    if (!confirm(`Delete agent "${agent.name}"? This cannot be undone.`)) return
    deleteMutation.mutate(agent.id)
  }

  function handleDuplicate(agent: AgentDefinition) {
    createMutation.mutate({
      name: `${agent.name} (copy)`,
      emoji: agent.emoji,
      color: agent.color,
      roleLabel: agent.roleLabel,
      systemPrompt: agent.systemPrompt,
      model: agent.model ?? undefined,
      tags: agent.tags,
    })
  }

  function handleSubmit(input: CreateAgentInput) {
    if (editingAgent && !editingAgent.isBuiltIn) {
      updateMutation.mutate({ id: editingAgent.id, updates: input })
    } else {
      createMutation.mutate(input)
    }
  }

  // Filter + search
  const displayed = agents.filter((a) => {
    if (filter === 'builtin' && !a.isBuiltIn) return false
    if (filter === 'custom' && a.isBuiltIn) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        a.name.toLowerCase().includes(q) ||
        a.roleLabel.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    return true
  })

  const builtInCount = agents.filter((a) => a.isBuiltIn).length
  const customCount = agents.filter((a) => !a.isBuiltIn).length

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Page header */}
      <div className="border-b border-[var(--theme-border)] bg-[var(--theme-bg)] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[var(--theme-text)]">Agent Library</h1>
            <p className="text-xs text-[var(--theme-muted)] mt-0.5">
              {builtInCount} built-in · {customCount} custom
            </p>
          </div>
          <button
            onClick={() => {
              setEditingAgent(null)
              setEditorOpen(true)
            }}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--theme-accent)] px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <HugeiconsIcon icon={Add01Icon} size={15} />
            New Agent
          </button>
        </div>

        {/* Search + filter */}
        <div className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <HugeiconsIcon
              icon={Search01Icon}
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-muted)]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agents…"
              className="w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-card)] py-2 pl-8 pr-3 text-sm text-[var(--theme-text)] placeholder:text-[var(--theme-muted)] focus:border-[var(--theme-accent)] focus:outline-none"
            />
          </div>
          <div className="flex rounded-lg border border-[var(--theme-border)] bg-[var(--theme-card)] p-0.5 text-xs">
            {(['all', 'builtin', 'custom'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'rounded px-3 py-1.5 capitalize transition-colors',
                  filter === f
                    ? 'bg-[var(--theme-accent)] text-white'
                    : 'text-[var(--theme-muted)] hover:text-[var(--theme-text)]',
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Agent grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-[var(--theme-muted)] text-sm">
            Loading…
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <HugeiconsIcon icon={UserMultiple02Icon} size={40} className="text-[var(--theme-muted)]" />
            <p className="text-sm text-[var(--theme-muted)]">
              {search ? 'No agents match your search.' : 'No agents yet. Create your first one!'}
            </p>
            {!search && (
              <button
                onClick={() => {
                  setEditingAgent(null)
                  setEditorOpen(true)
                }}
                className="text-sm text-[var(--theme-accent)] hover:underline"
              >
                + Create Agent
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {displayed.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Editor dialog */}
      <AgentEditorDialog
        open={editorOpen}
        agent={editingAgent}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onOpenChange={setEditorOpen}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
