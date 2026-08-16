/**
 * Users & Access — the UI half of Issue #8 Phase 2c/2d.
 *
 * /api/admin/users and /api/admin/orphan-tasks shipped with no interface at
 * all, so promoting a super admin, binding a profile, or rescuing tasks
 * stranded by the identity migration were curl-only operations. A permission
 * system an operator cannot actually operate is not really shipped.
 *
 * Renders nothing outside multi-user mode (HERMES_USERS unset) — there are no
 * users to manage and nothing is hidden — and shows a plain explanation rather
 * than an empty box when the caller is not a super admin.
 */
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

type AdminUser = {
  userId: string
  role: 'super_admin' | 'regular_admin'
  profileIds: Array<string>
  envSuperAdmin: boolean
}

type OrphanTask = {
  id: string
  title: string
  column: string
  createdBy: string
  profileId: string | null
  createdAt: number
}

type LoadState = 'loading' | 'ready' | 'unavailable' | 'forbidden' | 'error'

const CARD =
  'rounded-xl border border-[var(--theme-border)] bg-[var(--theme-panel)]/60 p-3'

export function UserAdminPanel() {
  const [state, setState] = useState<LoadState>('loading')
  const [message, setMessage] = useState('')
  const [users, setUsers] = useState<Array<AdminUser>>([])
  const [orphans, setOrphans] = useState<Array<OrphanTask>>([])
  const [assignable, setAssignable] = useState<Array<string>>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [assignTo, setAssignTo] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setState('loading')
    try {
      const res = await fetch('/api/admin/users')
      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        users?: Array<AdminUser>
        error?: string
      }

      if (res.status === 400) {
        // Single-user mode — not an error, just nothing to manage.
        setState('unavailable')
        setMessage(payload.error ?? '')
        return
      }
      if (res.status === 403) {
        setState('forbidden')
        setMessage(payload.error ?? 'Requires super_admin')
        return
      }
      if (!res.ok || payload.ok === false) {
        setState('error')
        setMessage(payload.error ?? `HTTP ${res.status}`)
        return
      }

      setUsers(payload.users ?? [])

      const orphanRes = await fetch('/api/admin/orphan-tasks')
      const orphanPayload = (await orphanRes.json().catch(() => ({}))) as {
        orphans?: Array<OrphanTask>
        assignableUsers?: Array<string>
      }
      setOrphans(orphanPayload.orphans ?? [])
      setAssignable(orphanPayload.assignableUsers ?? [])
      setAssignTo(orphanPayload.assignableUsers?.[0] ?? '')
      setSelected(new Set())
      setState('ready')
    } catch (err) {
      setState('error')
      setMessage(err instanceof Error ? err.message : String(err))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function patchUser(userId: string, updates: Partial<AdminUser>) {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...updates }),
      })
      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
      }
      if (!res.ok || payload.ok === false) {
        setMessage(payload.error ?? `HTTP ${res.status}`)
        return
      }
      setMessage('')
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function reassignSelected() {
    if (selected.size === 0 || !assignTo) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/orphan-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds: [...selected], createdBy: assignTo }),
      })
      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        reassigned?: Array<string>
        skipped?: Array<string>
        error?: string
      }
      if (!res.ok || payload.ok === false) {
        setMessage(payload.error ?? `HTTP ${res.status}`)
        return
      }
      const skipped = payload.skipped?.length ?? 0
      setMessage(
        `Reassigned ${payload.reassigned?.length ?? 0} task(s) to ${assignTo}` +
          (skipped > 0 ? ` — ${skipped} skipped (no longer orphaned)` : ''),
      )
      await load()
    } finally {
      setBusy(false)
    }
  }

  if (state === 'loading') {
    return <p className="text-sm text-[var(--theme-muted)]">Loading users…</p>
  }

  // Single-user mode: say so plainly instead of rendering an empty panel.
  if (state === 'unavailable') {
    return (
      <p className="text-sm text-[var(--theme-muted)]">
        {message ||
          'Multi-user mode is off. Set HERMES_USERS to enable per-user logins and task visibility.'}
      </p>
    )
  }

  if (state === 'forbidden') {
    return (
      <p className="text-sm text-[var(--theme-muted)]">
        {message}. Ask a super admin to change roles or profile bindings.
      </p>
    )
  }

  if (state === 'error') {
    return (
      <div className="space-y-2">
        <p className="text-sm text-red-400">{message}</p>
        <Button variant="secondary" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.userId} className={CARD}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--theme-text)]">
                  {user.userId}
                </p>
                <p className="text-xs text-[var(--theme-muted)]">
                  {user.profileIds.length > 0
                    ? `Profiles: ${user.profileIds.join(', ')}`
                    : 'No profile bindings'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={user.role}
                  disabled={busy || user.envSuperAdmin}
                  onChange={(e) =>
                    void patchUser(user.userId, {
                      role: e.target.value as AdminUser['role'],
                    })
                  }
                  className="h-8 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] px-2 text-xs text-[var(--theme-text)] disabled:opacity-50"
                  aria-label={`Role for ${user.userId}`}
                >
                  <option value="regular_admin">Regular admin</option>
                  <option value="super_admin">Super admin</option>
                </select>
              </div>
            </div>
            {user.envSuperAdmin ? (
              <p className="mt-1 text-xs text-[var(--theme-muted)]">
                Super admin via HERMES_SUPER_ADMINS — re-granted at every login,
                so demoting here would not stick.
              </p>
            ) : null}
            <label className="mt-2 block">
              <span className="sr-only">Profile bindings for {user.userId}</span>
              <input
                type="text"
                defaultValue={user.profileIds.join(', ')}
                disabled={busy}
                placeholder="Profile bindings, comma-separated"
                onBlur={(e) => {
                  const next = e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                  if (next.join(',') === user.profileIds.join(',')) return
                  void patchUser(user.userId, { profileIds: next })
                }}
                className="h-8 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] px-2 text-xs text-[var(--theme-text)]"
              />
            </label>
          </div>
        ))}
      </div>

      {orphans.length > 0 ? (
        <div className={CARD}>
          <p className="text-sm font-medium text-[var(--theme-text)]">
            {orphans.length} task(s) belong to nobody
          </p>
          <p className="mb-2 text-xs text-[var(--theme-muted)]">
            Created before per-user logins were enabled, so no regular admin can
            see them. Assign them to a real account to bring them back onto that
            user&apos;s board.
          </p>
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {orphans.map((task) => (
              <label
                key={task.id}
                className="flex items-center gap-2 text-xs text-[var(--theme-text)]"
              >
                <input
                  type="checkbox"
                  checked={selected.has(task.id)}
                  onChange={(e) => {
                    const next = new Set(selected)
                    if (e.target.checked) next.add(task.id)
                    else next.delete(task.id)
                    setSelected(next)
                  }}
                />
                <span className="truncate">{task.title}</span>
                <span className="shrink-0 text-[var(--theme-muted)]">
                  ({task.column} · was &quot;{task.createdBy}&quot;)
                </span>
              </label>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setSelected(new Set(orphans.map((t) => t.id)))}
              disabled={busy}
            >
              Select all
            </Button>
            <select
              value={assignTo}
              onChange={(e) => setAssignTo(e.target.value)}
              disabled={busy}
              className="h-8 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] px-2 text-xs text-[var(--theme-text)]"
              aria-label="Assign orphaned tasks to"
            >
              {assignable.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <Button
              onClick={() => void reassignSelected()}
              disabled={busy || selected.size === 0 || !assignTo}
            >
              Assign {selected.size > 0 ? `${selected.size} ` : ''}to {assignTo}
            </Button>
          </div>
        </div>
      ) : null}

      {message ? (
        <p className="text-xs text-[var(--theme-muted)]">{message}</p>
      ) : null}
    </div>
  )
}
