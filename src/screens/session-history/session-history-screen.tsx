'use client'

/**
 * Session History Archive — browse all Hermes sessions with full metadata.
 *
 * Two-pane layout:
 *   Left  — searchable, sortable list of all sessions
 *   Right — message thread for the selected session (lazy-loaded)
 *
 * Data sources:
 *   GET /api/sessions  — session list with token/cost/model metadata
 *   GET /api/history?sessionKey=<key>  — conversation messages for a session
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChatMessage } from '@/screens/chat/types'
import {
  normalise,
  fmtDate,
  fmtTokens,
  fmtCost,
  sessionTitle,
} from '@/lib/session-utils'
import type { RichSession } from '@/lib/session-utils'

// ── Types ─────────────────────────────────────────────────────────────────────

type SortField = 'updatedAt' | 'model' | 'messageCount' | 'tokens' | 'cost'
type SortDir = 'asc' | 'desc'

// ── API ───────────────────────────────────────────────────────────────────────

async function fetchSessions(): Promise<RichSession[]> {
  const res = await fetch('/api/sessions')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const arr: any[] = Array.isArray(data)
    ? data
    : Array.isArray(data.sessions)
      ? data.sessions
      : []
  return arr.map(normalise)
}

async function fetchMessages(sessionKey: string): Promise<ChatMessage[]> {
  const res = await fetch(
    `/api/history?sessionKey=${encodeURIComponent(sessionKey)}&limit=200`,
  )
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data.messages) ? data.messages : []
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SortHeader({
  field,
  label,
  current,
  dir,
  onClick,
}: {
  field: SortField
  label: string
  current: SortField
  dir: SortDir
  onClick: (f: SortField) => void
}) {
  const active = current === field
  return (
    <th
      onClick={() => onClick(field)}
      style={{
        padding: '0.45rem 0.6rem',
        textAlign: 'left',
        fontSize: '0.65rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: active ? 'var(--theme-text)' : 'var(--theme-text-muted)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        borderBottom: '1px solid var(--theme-border)',
      }}
    >
      {label} {active ? (dir === 'desc' ? '↓' : '↑') : ''}
    </th>
  )
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'
  const text =
    typeof msg.content === 'string'
      ? msg.content
      : Array.isArray(msg.content)
        ? msg.content
            .filter((c: any) => c.type === 'text')
            .map((c: any) => c.text)
            .join('\n')
        : ''

  if (!text.trim()) return null

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '0.6rem',
      }}
    >
      <div
        style={{
          maxWidth: '85%',
          padding: '0.5rem 0.8rem',
          borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
          background: isUser
            ? 'var(--theme-accent, #6366f1)'
            : 'var(--theme-card)',
          color: isUser ? '#fff' : 'var(--theme-text)',
          fontSize: '0.78rem',
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          border: isUser ? 'none' : '1px solid var(--theme-border)',
        }}
      >
        {text.length > 600 ? text.slice(0, 600) + '…' : text}
      </div>
    </div>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export function SessionHistoryScreen() {
  const [sessions, setSessions] = useState<RichSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('updatedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selected, setSelected] = useState<RichSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [msgLoading, setMsgLoading] = useState(false)
  const threadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    fetchSessions()
      .then((s) => {
        setSessions(s)
        setLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load')
        setLoading(false)
      })
  }, [])

  // Load messages when a session is selected
  useEffect(() => {
    if (!selected) return
    setMsgLoading(true)
    setMessages([])
    fetchMessages(selected.key)
      .then((msgs) => {
        setMessages(msgs)
        setMsgLoading(false)
        setTimeout(
          () => threadRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' }),
          50,
        )
      })
      .catch(() => setMsgLoading(false))
  }, [selected])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sessions.filter((s) => {
      if (!q) return true
      return (
        sessionTitle(s).toLowerCase().includes(q) ||
        (s as any).model?.toLowerCase().includes(q) ||
        s.friendlyId.toLowerCase().includes(q)
      )
    })
  }, [sessions, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let va: number, vb: number
      switch (sortField) {
        case 'updatedAt':
          va = a.updatedAt || 0
          vb = b.updatedAt || 0
          break
        case 'messageCount':
          va = a.messageCount
          vb = b.messageCount
          break
        case 'tokens':
          va = a.totalTokens
          vb = b.totalTokens
          break
        case 'cost':
          va = a.cost
          vb = b.cost
          break
        case 'model':
          return sortDir === 'desc'
            ? ((b as any).model ?? '').localeCompare((a as any).model ?? '')
            : ((a as any).model ?? '').localeCompare((b as any).model ?? '')
        default:
          return 0
      }
      return sortDir === 'desc' ? vb - va : va - vb
    })
  }, [filtered, sortField, sortDir])

  // Aggregate stats
  const totals = useMemo(
    () => ({
      sessions: sessions.length,
      tokens: sessions.reduce((sum, s) => sum + s.totalTokens, 0),
      cost: sessions.reduce((sum, s) => sum + s.cost, 0),
      messages: sessions.reduce((sum, s) => sum + s.messageCount, 0),
    }),
    [sessions],
  )

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--theme-bg)',
        color: 'var(--theme-text)',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem 0.75rem', borderBottom: '1px solid var(--theme-border)' }}>
        <h1 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          Session History
        </h1>
        {!loading && !error && (
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--theme-text-muted)' }}>
            <span><strong style={{ color: 'var(--theme-text)' }}>{totals.sessions}</strong> sessions</span>
            <span><strong style={{ color: 'var(--theme-text)' }}>{fmtTokens(totals.tokens)}</strong> tokens</span>
            <span><strong style={{ color: 'var(--theme-text)' }}>{fmtCost(totals.cost)}</strong> total cost</span>
            <span><strong style={{ color: 'var(--theme-text)' }}>{totals.messages}</strong> messages</span>
          </div>
        )}
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1.5rem', fontSize: '0.8rem', color: '#ef4444' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '2rem 1.5rem', fontSize: '0.85rem', color: 'var(--theme-text-muted)' }}>
          Loading sessions…
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: selected ? '1fr 1fr' : '1fr',
            minHeight: 0,
          }}
        >
          {/* Session list */}
          <div style={{ display: 'flex', flexDirection: 'column', borderRight: selected ? '1px solid var(--theme-border)' : 'none' }}>
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--theme-border)' }}>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sessions…"
                style={{
                  width: '100%',
                  background: 'var(--theme-card)',
                  border: '1px solid var(--theme-border)',
                  borderRadius: 8,
                  padding: '0.4rem 0.7rem',
                  fontSize: '0.78rem',
                  color: 'var(--theme-text)',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--theme-bg)', zIndex: 1 }}>
                  <tr>
                    <SortHeader field="updatedAt" label="Date" current={sortField} dir={sortDir} onClick={handleSort} />
                    <th style={{ padding: '0.45rem 0.6rem', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--theme-text-muted)', borderBottom: '1px solid var(--theme-border)' }}>Title</th>
                    <SortHeader field="model" label="Model" current={sortField} dir={sortDir} onClick={handleSort} />
                    <SortHeader field="messageCount" label="Msgs" current={sortField} dir={sortDir} onClick={handleSort} />
                    <SortHeader field="tokens" label="Tokens" current={sortField} dir={sortDir} onClick={handleSort} />
                    <SortHeader field="cost" label="Cost" current={sortField} dir={sortDir} onClick={handleSort} />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((s) => {
                    const isSelected = selected?.key === s.key
                    return (
                      <tr
                        key={s.key}
                        onClick={() => setSelected(isSelected ? null : s)}
                        style={{
                          cursor: 'pointer',
                          background: isSelected ? 'var(--theme-card)' : 'transparent',
                          borderBottom: '1px solid var(--theme-border)',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--theme-surface-2, #1e1e2e)'
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'
                        }}
                      >
                        <td style={{ padding: '0.5rem 0.6rem', fontSize: '0.72rem', color: 'var(--theme-text-muted)', whiteSpace: 'nowrap' }}>
                          {fmtDate(s.updatedAt)}
                        </td>
                        <td style={{ padding: '0.5rem 0.6rem', fontSize: '0.78rem', color: 'var(--theme-text)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {sessionTitle(s)}
                        </td>
                        <td style={{ padding: '0.5rem 0.6rem', fontSize: '0.7rem', color: 'var(--theme-text-muted)', whiteSpace: 'nowrap' }}>
                          {((s as any).model ?? '—').split('/').pop()}
                        </td>
                        <td style={{ padding: '0.5rem 0.6rem', fontSize: '0.72rem', color: 'var(--theme-text-muted)', textAlign: 'right' }}>
                          {s.messageCount || '—'}
                        </td>
                        <td style={{ padding: '0.5rem 0.6rem', fontSize: '0.72rem', color: 'var(--theme-text-muted)', textAlign: 'right' }}>
                          {s.totalTokens ? fmtTokens(s.totalTokens) : '—'}
                        </td>
                        <td style={{ padding: '0.5rem 0.6rem', fontSize: '0.72rem', color: 'var(--theme-text-muted)', textAlign: 'right' }}>
                          {fmtCost(s.cost)}
                        </td>
                      </tr>
                    )
                  })}
                  {sorted.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--theme-text-muted)' }}>
                        {search ? 'No sessions match your search.' : 'No sessions found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Message thread */}
          {selected && (
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {/* Thread header */}
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--theme-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--theme-text)' }}>
                    {sessionTitle(selected)}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--theme-text-muted)' }}>
                    {fmtDate(selected.updatedAt)} · {(selected as any).model ?? ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  style={{
                    fontSize: '1rem',
                    lineHeight: 1,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--theme-text-muted)',
                    padding: '0.2rem 0.4rem',
                  }}
                  aria-label="Close thread"
                >
                  ✕
                </button>
              </div>

              {/* Messages */}
              <div
                ref={threadRef}
                style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem' }}
              >
                {msgLoading ? (
                  <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--theme-text-muted)', paddingTop: '2rem' }}>
                    Loading messages…
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--theme-text-muted)', paddingTop: '2rem' }}>
                    No messages available for this session.
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <MessageBubble key={i} msg={msg} />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
