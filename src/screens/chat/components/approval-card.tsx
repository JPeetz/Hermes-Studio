/**
 * ApprovalCard
 *
 * Renders a single pending (or recently resolved) approval request.
 * - Expand/collapse to reveal the full context/args
 * - Three approval scopes: once, session, always
 * - Shows a brief resolved receipt before the parent removes it
 */
import { useState } from 'react'
import type { ApprovalRequest } from '@/lib/approvals-store'
import { cn } from '@/lib/utils'

interface ApprovalCardProps {
  approval: ApprovalRequest
  onResolve: (
    approval: ApprovalRequest,
    status: 'approved' | 'denied' | 'always-allowed',
    scope?: 'once' | 'session' | 'always',
  ) => void
}

export function ApprovalCard({ approval, onResolve }: ApprovalCardProps) {
  const [expanded, setExpanded] = useState(false)

  const isResolved = approval.status !== 'pending'
  const wasApproved =
    approval.status === 'approved' || approval.status === 'always-allowed'

  // ── Resolved receipt ──────────────────────────────────────────────
  if (isResolved) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 text-xs',
          wasApproved
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
            : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
        )}
      >
        <span className="shrink-0 font-bold">
          {wasApproved ? '✓' : '✗'}
        </span>
        <span className="font-medium">
          {wasApproved ? 'Approved' : 'Denied'}:
        </span>
        <span className="truncate font-mono">{approval.action}</span>
      </div>
    )
  }

  // ── Pending card ──────────────────────────────────────────────────
  const hasContext = Boolean(approval.context)

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-900/15">
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
            🔐 Approval Required &mdash; {approval.agentName || 'Agent'}
          </p>

          {/* Action / command — always shown, not truncated */}
          <p className="mt-1 break-all font-mono text-xs text-amber-600 dark:text-amber-500">
            {approval.action}
          </p>

          {/* Context / args — collapsible */}
          {hasContext && expanded && (
            <pre className="mt-2 max-h-40 overflow-auto rounded bg-amber-100/60 p-2 text-[10px] leading-relaxed text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 whitespace-pre-wrap break-all">
              {approval.context}
            </pre>
          )}
        </div>

        {/* Expand toggle */}
        {hasContext && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 text-[10px] text-amber-500 underline hover:text-amber-700 dark:text-amber-600 dark:hover:text-amber-400"
          >
            {expanded ? 'less' : 'details'}
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onResolve(approval, 'approved', 'once')}
          className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 active:bg-emerald-700"
        >
          Approve Once
        </button>
        <button
          type="button"
          onClick={() => onResolve(approval, 'approved', 'session')}
          className="rounded-lg bg-emerald-600/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 active:bg-emerald-800"
        >
          This Session
        </button>
        <button
          type="button"
          onClick={() => onResolve(approval, 'always-allowed', 'always')}
          className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 active:bg-blue-700"
        >
          Always Allow
        </button>
        <button
          type="button"
          onClick={() => onResolve(approval, 'denied')}
          className="rounded-lg border border-red-200 bg-surface px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 active:bg-red-100 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-900/30"
        >
          Deny
        </button>
      </div>
    </div>
  )
}
