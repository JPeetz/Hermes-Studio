/**
 * GET /api/system-health
 *
 * Returns lightweight system metrics: CPU load average, memory usage,
 * and (on Linux) root-partition disk usage. All reads are synchronous
 * OS-level calls — no external deps, negligible overhead.
 */
import os from 'node:os'
import fs from 'node:fs'
import { createFileRoute } from '@tanstack/react-router'
import { isAuthenticated } from '../../server/auth-middleware'

export type SystemHealthResponse = {
  ok: boolean
  cpu: {
    /** 1-minute load average as a percentage of logical CPUs (0–100) */
    loadPercent: number
    cores: number
  }
  memory: {
    totalMb: number
    usedMb: number
    usedPercent: number
  }
  disk: {
    totalGb: number
    usedGb: number
    usedPercent: number
  } | null
  uptimeSeconds: number
}

/** Read root-partition disk stats from /proc/mounts + statvfs equivalent.
 *  Falls back to null on non-Linux or permission error. */
function getDiskStats(): SystemHealthResponse['disk'] {
  try {
    // Node has no built-in statvfs — use df output via /proc/mounts is complex.
    // Instead read from /sys/fs (Linux only) or parse `df` is too heavy.
    // Use the statfs-like approach via the fs.statfsSync API added in Node 19.
    // For compatibility with Node 22+ we use fs.statfsSync.
    const stat = fs.statfsSync('/')
    const blockSize = stat.bsize
    const totalGb = (stat.blocks * blockSize) / 1e9
    const freeGb = (stat.bfree * blockSize) / 1e9
    const usedGb = totalGb - freeGb
    return {
      totalGb: Math.round(totalGb * 10) / 10,
      usedGb: Math.round(usedGb * 10) / 10,
      usedPercent: Math.round((usedGb / totalGb) * 100),
    }
  } catch {
    return null
  }
}

export const Route = createFileRoute('/api/system-health')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return Response.json({ ok: false }, { status: 401 })
        }

        const cpus = os.cpus()
        const cores = cpus.length
        const [load1] = os.loadavg()
        const loadPercent = Math.min(100, Math.round((load1 / cores) * 100))

        const totalMem = os.totalmem()
        const freeMem = os.freemem()
        const usedMem = totalMem - freeMem

        const body: SystemHealthResponse = {
          ok: true,
          cpu: {
            loadPercent,
            cores,
          },
          memory: {
            totalMb: Math.round(totalMem / 1024 / 1024),
            usedMb: Math.round(usedMem / 1024 / 1024),
            usedPercent: Math.round((usedMem / totalMem) * 100),
          },
          disk: getDiskStats(),
          uptimeSeconds: Math.round(os.uptime()),
        }

        return Response.json(body)
      },
    },
  },
})
