'use client'

/**
 * Analytics Screen — aggregate insights from the Studio event store.
 *
 * Data comes from GET /api/state-analytics which reads .runtime/events.db
 * entirely through SQL aggregation (GROUP BY, json_extract). Shows:
 *   • 4 stat cards  — total events, sessions, tool calls, messages
 *   • 14-day event  — stacked bar chart of tool / message / approval events
 *   • Tool frequency — horizontal bar chart of top 15 tools by usage
 */

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { StateAnalyticsResponse } from '@/routes/api/state-analytics'

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchAnalytics(): Promise<StateAnalyticsResponse> {
  const res = await fetch('/api/state-analytics')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<StateAnalyticsResponse>
}

const analyticsQuery = {
  queryKey: ['state-analytics'],
  queryFn: fetchAnalytics,
  refetchInterval: 30_000,
  staleTime: 10_000,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function fmtDate(iso: string): string {
  // iso = "YYYY-MM-DD"
  const [, m, d] = iso.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[Number(m) - 1]} ${Number(d)}`
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string | number
  accent: string
}) {
  return (
    <div
      style={{
        background: 'var(--theme-card)',
        border: '1px solid var(--theme-border)',
        borderRadius: 12,
        padding: '1rem 1.25rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: '0 0 auto 0',
          height: 2,
          background: `linear-gradient(90deg, ${accent}, ${accent}60, transparent)`,
        }}
      />
      <div
        style={{
          fontSize: '0.65rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--theme-text-muted)',
          marginBottom: '0.35rem',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: 'var(--theme-text)',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function SectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: 'var(--theme-card)',
        border: '1px solid var(--theme-border)',
        borderRadius: 12,
        padding: '1rem 1.25rem',
      }}
    >
      <div
        style={{
          fontSize: '0.65rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--theme-text-muted)',
          marginBottom: '0.75rem',
        }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function AnalyticsScreen() {
  const { data, isPending, isError } = useQuery(analyticsQuery)

  const dailyData = useMemo(
    () =>
      (data?.dailyVolume ?? []).map((d) => ({
        ...d,
        label: fmtDate(d.date),
      })),
    [data],
  )

  const toolData = useMemo(
    () =>
      (data?.toolFrequency ?? []).map((t) => ({
        ...t,
        successRate:
          t.count + t.errors > 0
            ? Math.round((t.count / (t.count + t.errors)) * 100)
            : 100,
      })),
    [data],
  )

  const totalToolCalls =
    (data?.eventTypeCounts?.['tool'] ?? 0)
  const totalMessages =
    (data?.eventTypeCounts?.['user_message'] ?? 0)

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--theme-bg)',
        color: 'var(--theme-text)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      {/* Header */}
      <div>
        <h1
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--theme-text)',
            marginBottom: '0.25rem',
          }}
        >
          Event Store Analytics
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--theme-text-muted)' }}>
          Aggregate insights from <code style={{ fontFamily: 'monospace' }}>.runtime/events.db</code> · auto-refreshes every 30 s
        </p>
      </div>

      {isError && (
        <div
          style={{
            background: 'var(--theme-error-bg, #2d1b1b)',
            border: '1px solid var(--theme-error, #ef4444)',
            borderRadius: 8,
            padding: '0.75rem 1rem',
            fontSize: '0.8rem',
            color: 'var(--theme-error, #ef4444)',
          }}
        >
          Failed to load analytics. The event store may be unavailable.
        </div>
      )}

      {isPending && !data ? (
        <div style={{ color: 'var(--theme-text-muted)', fontSize: '0.85rem' }}>
          Loading…
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '0.75rem',
            }}
          >
            <StatCard
              label="Total Events"
              value={fmtNum(data?.totalEvents ?? 0)}
              accent="#6366f1"
            />
            <StatCard
              label="Sessions"
              value={fmtNum(data?.totalSessions ?? 0)}
              accent="#22c55e"
            />
            <StatCard
              label="Tool Calls"
              value={fmtNum(totalToolCalls)}
              accent="#f59e0b"
            />
            <StatCard
              label="User Messages"
              value={fmtNum(totalMessages)}
              accent="#3b82f6"
            />
          </div>

          {/* 14-day volume chart */}
          <SectionCard title="Event volume — last 14 days">
            {dailyData.every(
              (d) => d.tool === 0 && d.user_message === 0 && d.approval === 0,
            ) ? (
              <div
                style={{
                  height: 140,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--theme-text-muted)',
                }}
              >
                No events recorded yet.
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '0.5rem',
                    fontSize: '0.65rem',
                    color: 'var(--theme-text-muted)',
                  }}
                >
                  <Legend color="#6366f1" label="Tool calls" />
                  <Legend color="#3b82f6" label="Messages" />
                  <Legend color="#f59e0b" label="Approvals" />
                </div>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart
                    data={dailyData}
                    margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                    barCategoryGap="25%"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--theme-border)"
                      opacity={0.5}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 9, fill: 'var(--theme-text-muted)' }}
                      tickLine={false}
                      axisLine={false}
                      interval={2}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: 'var(--theme-text-muted)' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--theme-surface-2, #1e1e2e)',
                        border: '1px solid var(--theme-border)',
                        borderRadius: 8,
                        fontSize: 11,
                        color: 'var(--theme-text)',
                      }}
                      cursor={{ fill: 'var(--theme-border)', opacity: 0.15 }}
                    />
                    <Bar dataKey="tool" stackId="a" fill="#6366f1" radius={[0,0,0,0]} />
                    <Bar dataKey="user_message" stackId="a" fill="#3b82f6" radius={[0,0,0,0]} name="messages" />
                    <Bar dataKey="approval" stackId="a" fill="#f59e0b" radius={[2,2,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </SectionCard>

          {/* Tool frequency */}
          <SectionCard title="Top tools by usage">
            {toolData.length === 0 ? (
              <div
                style={{
                  height: 80,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--theme-text-muted)',
                }}
              >
                No tool calls recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(180, toolData.length * 28)}>
                <BarChart
                  data={toolData}
                  layout="vertical"
                  margin={{ top: 0, right: 60, left: 8, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--theme-border)"
                    opacity={0.4}
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 9, fill: 'var(--theme-text-muted)' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="tool"
                    tick={{ fontSize: 10, fill: 'var(--theme-text-muted)' }}
                    tickLine={false}
                    axisLine={false}
                    width={110}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--theme-surface-2, #1e1e2e)',
                      border: '1px solid var(--theme-border)',
                      borderRadius: 8,
                      fontSize: 11,
                      color: 'var(--theme-text)',
                    }}
                    cursor={{ fill: 'var(--theme-border)', opacity: 0.15 }}
                    formatter={(value: number, name: string) => [
                      value,
                      name === 'count' ? 'Completed' : 'Errors',
                    ]}
                  />
                  <Bar dataKey="count" fill="#6366f1" opacity={0.85} radius={[0, 3, 3, 0]} />
                  <Bar dataKey="errors" fill="#ef4444" opacity={0.7} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {toolData.length > 0 && (
              <div
                style={{
                  marginTop: '0.75rem',
                  display: 'flex',
                  gap: '1rem',
                  fontSize: '0.65rem',
                  color: 'var(--theme-text-muted)',
                }}
              >
                <Legend color="#6366f1" label="Completed" />
                <Legend color="#ef4444" label="Errors" />
              </div>
            )}
          </SectionCard>

          {/* Time range footer */}
          {data?.timeRange && (
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--theme-text-muted)',
                textAlign: 'right',
              }}
            >
              Oldest event:{' '}
              {new Date(data.timeRange.oldest).toLocaleString()} · Newest:{' '}
              {new Date(data.timeRange.newest).toLocaleString()} · Retention: 7 days
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
      <span
        style={{
          display: 'inline-block',
          width: 10,
          height: 10,
          borderRadius: 2,
          background: color,
        }}
      />
      {label}
    </span>
  )
}
