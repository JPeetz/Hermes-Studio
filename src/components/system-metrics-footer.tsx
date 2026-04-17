/**
 * SystemMetricsFooter — slim sticky bar at the bottom of the workspace shell.
 *
 * Polls GET /api/system-health every 10 seconds and shows CPU load%, memory
 * used/total, disk used/total, and system uptime. Only rendered on desktop
 * (isMobile check is done by the parent) when showSystemMetricsFooter is true.
 *
 * Color thresholds: <60% green, 60-80% amber, >80% red — matching VS Code's
 * status-bar indicator convention.
 */
'use client'

import { useEffect, useRef, useState } from 'react'
import type { SystemHealthResponse } from '@/routes/api/system-health'

const POLL_INTERVAL_MS = 10_000

function usageColor(pct: number): string {
  if (pct >= 80) return 'var(--theme-error, #ef4444)'
  if (pct >= 60) return 'var(--theme-warning, #f59e0b)'
  return 'var(--theme-success, #22c55e)'
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function SystemMetricsFooter() {
  const [data, setData] = useState<SystemHealthResponse | null>(null)
  const [error, setError] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function poll() {
    try {
      const res = await fetch('/api/system-health')
      if (!res.ok) throw new Error('non-ok')
      const json: SystemHealthResponse = await res.json()
      setData(json)
      setError(false)
    } catch {
      setError(true)
    }
  }

  useEffect(() => {
    poll()
    timerRef.current = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current)
    }
  }, [])

  return (
    <div
      role="status"
      aria-label="System metrics"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '1.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        background: 'var(--theme-surface-2, #1e1e2e)',
        borderTop: '1px solid var(--theme-border, #313244)',
        zIndex: 50,
        fontSize: '0.7rem',
        color: 'var(--theme-text-muted, #a6adc8)',
        fontFamily: 'var(--font-mono, monospace)',
        userSelect: 'none',
      }}
    >
      {error || !data ? (
        <span style={{ color: 'var(--theme-text-muted)' }}>
          {error ? 'System metrics unavailable' : 'Loading…'}
        </span>
      ) : (
        <>
          {/* CPU */}
          <MetricChip
            label="CPU"
            value={`${data.cpu.loadPercent}%`}
            pct={data.cpu.loadPercent}
            title={`${data.cpu.cores} logical cores · 1-min load avg`}
          />

          {/* Memory */}
          <MetricChip
            label="MEM"
            value={`${data.memory.usedMb >= 1024 ? `${(data.memory.usedMb / 1024).toFixed(1)} GB` : `${data.memory.usedMb} MB`} / ${data.memory.totalMb >= 1024 ? `${(data.memory.totalMb / 1024).toFixed(1)} GB` : `${data.memory.totalMb} MB`}`}
            pct={data.memory.usedPercent}
            title={`Memory: ${data.memory.usedPercent}% used`}
          />

          {/* Disk */}
          {data.disk !== null && (
            <MetricChip
              label="DISK"
              value={`${data.disk.usedGb} GB / ${data.disk.totalGb} GB`}
              pct={data.disk.usedPercent}
              title={`Root partition: ${data.disk.usedPercent}% used`}
            />
          )}

          {/* Uptime */}
          <span
            title={`System uptime: ${data.uptimeSeconds}s`}
            style={{ color: 'var(--theme-text-muted)' }}
          >
            UP {formatUptime(data.uptimeSeconds)}
          </span>
        </>
      )}
    </div>
  )
}

function MetricChip({
  label,
  value,
  pct,
  title,
}: {
  label: string
  value: string
  pct: number
  title: string
}) {
  return (
    <span
      title={title}
      style={{ display: 'inline-flex', gap: '0.3rem', alignItems: 'center' }}
    >
      <span style={{ color: 'var(--theme-text-muted)' }}>{label}</span>
      <span style={{ color: usageColor(pct), fontWeight: 600 }}>{value}</span>
    </span>
  )
}
