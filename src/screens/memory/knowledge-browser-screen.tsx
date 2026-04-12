import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  BrainIcon,
  CodeIcon,
  File01Icon,
  Folder01Icon,
  Link01Icon,
  Message01Icon,
  Search01Icon,
} from '@hugeicons/core-free-icons'
import { useQuery } from '@tanstack/react-query'
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Markdown } from '@/components/prompt-kit/markdown'
import {
  DialogContent,
  DialogDescription,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type WikiPageMeta = {
  path: string
  name: string
  title: string
  type?: string
  domain?: string
  status?: string
  tags: Array<string>
  summary?: string
  created?: string
  updated?: string
  size: number
  modified: string
  wikilinks: Array<string>
}

type KnowledgeListResponse = {
  pages?: Array<WikiPageMeta>
  knowledgeRoot?: string
  exists?: boolean
}

type KnowledgeReadResponse = {
  page?: WikiPageMeta
  content?: string
  backlinks?: Array<string>
}

type KnowledgeSearchResult = {
  path: string
  title: string
  line: number
  text: string
}

type KnowledgeSearchResponse = {
  results?: Array<KnowledgeSearchResult>
}

type KnowledgeGraphNode = {
  id: string
  title: string
  type?: string
  tags?: Array<string>
}

type KnowledgeGraphEdge = {
  source: string
  target: string
}

type KnowledgeGraphResponse = {
  nodes?: Array<KnowledgeGraphNode>
  edges?: Array<KnowledgeGraphEdge>
}

type TreeNode = {
  name: string
  path: string
  folders: Array<TreeNode>
  pages: Array<WikiPageMeta>
}

async function readJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `Request failed (${response.status})`)
  }
  return (await response.json()) as T
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(value?: string): string | null {
  if (!value) return null
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return value
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed)
}

function highlightMatch(
  text: string,
  query: string,
): Array<{ text: string; hit: boolean }> {
  const needle = query.trim()
  if (!needle) return [{ text, hit: false }]
  const lower = text.toLowerCase()
  const matchLower = needle.toLowerCase()
  const parts: Array<{ text: string; hit: boolean }> = []
  let cursor = 0
  while (cursor < text.length) {
    const index = lower.indexOf(matchLower, cursor)
    if (index < 0) {
      parts.push({ text: text.slice(cursor), hit: false })
      break
    }
    if (index > cursor) {
      parts.push({ text: text.slice(cursor, index), hit: false })
    }
    parts.push({ text: text.slice(index, index + needle.length), hit: true })
    cursor = index + needle.length
  }
  return parts.length > 0 ? parts : [{ text, hit: false }]
}

function normalizeWikiToken(value: string): string {
  return value.trim().toLowerCase().replace(/\\/g, '/').replace(/\.md$/i, '')
}

function preprocessWikiMarkdown(content: string): string {
  return content.replace(/\[\[([^\]]+)\]\]/g, (_match, rawLink) => {
    const parts = String(rawLink).split('|')
    const target = parts[0]?.trim() ?? ''
    const label = parts[1]?.trim() || target
    return `[${label}](wiki:${encodeURIComponent(target)})`
  })
}

function buildKnowledgeTree(pages: Array<WikiPageMeta>): TreeNode {
  const root: TreeNode = { name: 'root', path: '', folders: [], pages: [] }

  for (const page of pages) {
    const parts = page.path.split('/').filter(Boolean)
    const folderParts = parts.slice(0, -1)
    let cursor = root

    for (const folder of folderParts) {
      let child = cursor.folders.find((entry) => entry.name === folder)
      if (!child) {
        child = {
          name: folder,
          path: cursor.path ? `${cursor.path}/${folder}` : folder,
          folders: [],
          pages: [],
        }
        cursor.folders.push(child)
      }
      cursor = child
    }

    cursor.pages.push(page)
  }

  function sortNode(node: TreeNode) {
    node.folders.sort((a, b) => a.name.localeCompare(b.name))
    node.pages.sort((a, b) => a.title.localeCompare(b.title))
    node.folders.forEach(sortNode)
  }

  sortNode(root)
  return root
}

// ─── Force-directed graph canvas ──────────────────────────────────────────────

const GW = 900
const GH = 540

type SimNode = KnowledgeGraphNode & { x: number; y: number; vx: number; vy: number }

const NODE_TYPE_PALETTE: Record<string, { fill: string; stroke: string }> = {
  guide:     { fill: 'rgba(99, 102, 241, 0.18)',  stroke: 'rgba(99, 102, 241, 0.75)'  },
  project:   { fill: 'rgba(16, 185, 129, 0.18)',  stroke: 'rgba(16, 185, 129, 0.75)'  },
  reference: { fill: 'rgba(245, 158, 11, 0.18)',  stroke: 'rgba(245, 158, 11, 0.75)'  },
  concept:   { fill: 'rgba(239, 68, 68, 0.18)',   stroke: 'rgba(239, 68, 68, 0.75)'   },
  note:      { fill: 'rgba(168, 85, 247, 0.18)',  stroke: 'rgba(168, 85, 247, 0.75)'  },
  default:   { fill: 'rgba(59, 130, 246, 0.15)',  stroke: 'rgba(59, 130, 246, 0.65)'  },
}

function getNodePalette(type?: string) {
  const key = (type ?? '').toLowerCase()
  return NODE_TYPE_PALETTE[key] ?? NODE_TYPE_PALETTE.default
}

function runForce(sim: SimNode[], edgeList: KnowledgeGraphEdge[], iters = 280) {
  const idx = new Map(sim.map((n, i) => [n.id, i]))
  const REPEL = 5000
  const ATTRACT = 0.045
  const DAMP = 0.72
  const MIN_D = 28

  for (let it = 0; it < iters; it++) {
    // Repulsion between all pairs
    for (let i = 0; i < sim.length; i++) {
      for (let j = i + 1; j < sim.length; j++) {
        const dx = sim[j].x - sim[i].x
        const dy = sim[j].y - sim[i].y
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), MIN_D)
        const f = REPEL / (dist * dist)
        const fx = (dx / dist) * f
        const fy = (dy / dist) * f
        sim[i].vx -= fx; sim[i].vy -= fy
        sim[j].vx += fx; sim[j].vy += fy
      }
    }
    // Edge attraction
    for (const e of edgeList) {
      const si = idx.get(e.source); const ti = idx.get(e.target)
      if (si === undefined || ti === undefined) continue
      const s = sim[si]; const t = sim[ti]
      const dx = t.x - s.x; const dy = t.y - s.y
      s.vx += dx * ATTRACT; s.vy += dy * ATTRACT
      t.vx -= dx * ATTRACT; t.vy -= dy * ATTRACT
    }
    // Weak center gravity
    let cx = 0; let cy = 0
    for (const n of sim) { cx += n.x; cy += n.y }
    cx /= sim.length; cy /= sim.length
    for (const n of sim) {
      n.vx += (GW / 2 - cx) * 0.01
      n.vy += (GH / 2 - cy) * 0.01
    }
    // Integrate
    for (const n of sim) {
      n.x = Math.max(36, Math.min(GW - 36, n.x + n.vx))
      n.y = Math.max(36, Math.min(GH - 36, n.y + n.vy))
      n.vx *= DAMP; n.vy *= DAMP
    }
  }
}

function GraphCanvas({
  nodes,
  edges,
  onSelect,
}: {
  nodes: Array<KnowledgeGraphNode>
  edges: Array<KnowledgeGraphEdge>
  onSelect: (path: string) => void
}) {
  // Compute stable force-directed positions once per nodes/edges change
  const simNodes = useMemo<SimNode[]>(() => {
    if (nodes.length === 0) return []
    const result: SimNode[] = nodes.map((n, i) => {
      const angle = (Math.PI * 2 * i) / nodes.length
      const r = Math.min(GW, GH) * 0.32
      return {
        ...n,
        x: GW / 2 + Math.cos(angle) * r + (i % 3) * 5,
        y: GH / 2 + Math.sin(angle) * r + (i % 2) * 5,
        vx: 0, vy: 0,
      }
    })
    runForce(result, edges)
    return result
  }, [nodes, edges])

  // Per-node overrides from drag
  const [dragPos, setDragPos] = useState<Map<string, { x: number; y: number }>>(() => new Map())
  useEffect(() => { setDragPos(new Map()) }, [simNodes])

  const getPos = (n: SimNode) => dragPos.get(n.id) ?? { x: n.x, y: n.y }

  // Zoom / pan transform (in SVG units)
  const [tf, setTf] = useState({ tx: 0, ty: 0, k: 1 })

  // Pointer drag state
  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<{
    kind: 'node' | 'pan' | null
    nodeId: string | null
    startCx: number; startCy: number
    origX: number; origY: number
  }>({ kind: null, nodeId: null, startCx: 0, startCy: 0, origX: 0, origY: 0 })

  // Hover state
  const [hovered, setHovered] = useState<string | null>(null)

  // Adjacency lookup for highlight
  const adj = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const e of edges) {
      if (!map.has(e.source)) map.set(e.source, new Set())
      if (!map.has(e.target)) map.set(e.target, new Set())
      map.get(e.source)!.add(e.target)
      map.get(e.target)!.add(e.source)
    }
    return map
  }, [edges])

  const hovNeighbors = hovered ? (adj.get(hovered) ?? new Set<string>()) : null

  // Degree → node radius
  const degree = useMemo(() => {
    const d = new Map<string, number>()
    for (const e of edges) {
      d.set(e.source, (d.get(e.source) ?? 0) + 1)
      d.set(e.target, (d.get(e.target) ?? 0) + 1)
    }
    return d
  }, [edges])

  const nodeR = (id: string) => Math.min(22, 11 + (degree.get(id) ?? 0) * 1.8)

  // Helper: screen → SVG-unit delta
  function screenDelta(dcx: number, dcy: number) {
    const svg = svgRef.current
    if (!svg) return { dx: 0, dy: 0 }
    const rect = svg.getBoundingClientRect()
    return {
      dx: (dcx / rect.width) * GW,
      dy: (dcy / rect.height) * GH,
    }
  }

  // Non-passive wheel listener so preventDefault() actually blocks page scroll
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.12 : 0.89
      setTf((p) => ({ ...p, k: Math.max(0.25, Math.min(4, p.k * factor)) }))
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [])

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    const target = e.target as Element
    const nodeEl = target.closest('[data-nid]')
    const nodeId = nodeEl?.getAttribute('data-nid') ?? null
    if (nodeId) {
      const node = simNodes.find((n) => n.id === nodeId)!
      const pos = getPos(node)
      drag.current = { kind: 'node', nodeId, startCx: e.clientX, startCy: e.clientY, origX: pos.x, origY: pos.y }
    } else {
      drag.current = { kind: 'pan', nodeId: null, startCx: e.clientX, startCy: e.clientY, origX: tf.tx, origY: tf.ty }
    }
    ;(e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const d = drag.current
    if (!d.kind) return
    const { dx, dy } = screenDelta(e.clientX - d.startCx, e.clientY - d.startCy)
    if (d.kind === 'node' && d.nodeId) {
      setDragPos((prev) => new Map(prev).set(d.nodeId!, {
        x: Math.max(16, Math.min(GW - 16, d.origX + dx / tf.k)),
        y: Math.max(16, Math.min(GH - 16, d.origY + dy / tf.k)),
      }))
    } else if (d.kind === 'pan') {
      setTf((p) => ({ ...p, tx: d.origX + dx, ty: d.origY + dy }))
    }
  }

  function handlePointerUp(e: React.PointerEvent<SVGSVGElement>) {
    drag.current.kind = null
    ;(e.currentTarget as SVGSVGElement).releasePointerCapture(e.pointerId)
  }

  const zoomBy = (f: number) => setTf((p) => ({ ...p, k: Math.max(0.25, Math.min(4, p.k * f)) }))
  const resetView = () => setTf({ tx: 0, ty: 0, k: 1 })

  // Only show legend for types actually present
  const presentTypes = useMemo(() => {
    const seen = new Set<string>()
    for (const n of nodes) if (n.type) seen.add(n.type.toLowerCase())
    return Array.from(seen).filter((t) => t in NODE_TYPE_PALETTE)
  }, [nodes])

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ border: '1px solid var(--theme-border)', background: 'var(--theme-card)' }}
    >
      {/* Zoom controls */}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1">
        {[
          { label: '+', action: () => zoomBy(1.25) },
          { label: '−', action: () => zoomBy(0.8) },
          { label: '⊙', action: resetView },
        ].map(({ label, action }) => (
          <button
            key={label}
            onClick={action}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors"
            style={{
              border: '1px solid var(--theme-border)',
              background: 'var(--theme-card2, var(--theme-card))',
              color: 'var(--theme-text)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Legend */}
      {presentTypes.length > 0 && (
        <div className="absolute bottom-8 left-3 z-10 flex flex-col gap-1 rounded-lg px-2 py-1.5"
          style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}>
          {presentTypes.map((type) => {
            const c = NODE_TYPE_PALETTE[type]
            return (
              <div key={type} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: c.stroke }}
                />
                <span className="text-[10px] capitalize" style={{ color: 'var(--theme-muted)' }}>
                  {type}
                </span>
              </div>
            )
          })}
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: NODE_TYPE_PALETTE.default.stroke }} />
            <span className="text-[10px]" style={{ color: 'var(--theme-muted)' }}>other</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div
        className="absolute bottom-2 right-3 z-10 text-[10px]"
        style={{ color: 'var(--theme-muted)' }}
      >
        {simNodes.length} nodes · {edges.length} edges
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${GW} ${GH}`}
        className="h-[540px] w-full select-none"
        style={{ cursor: 'grab' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <g transform={`translate(${tf.tx} ${tf.ty}) scale(${tf.k})`}>
          {/* Edges */}
          {edges.map((edge, i) => {
            const sn = simNodes.find((n) => n.id === edge.source)
            const tn = simNodes.find((n) => n.id === edge.target)
            if (!sn || !tn) return null
            const sp = getPos(sn); const tp = getPos(tn)
            const lit = !hovered || edge.source === hovered || edge.target === hovered
            return (
              <line
                key={`e-${i}`}
                x1={sp.x} y1={sp.y} x2={tp.x} y2={tp.y}
                stroke={lit ? 'rgba(99, 102, 241, 0.55)' : 'rgba(148, 163, 184, 0.12)'}
                strokeWidth={lit ? 1.5 : 0.8}
              />
            )
          })}

          {/* Nodes */}
          {simNodes.map((node) => {
            const pos = getPos(node)
            const pal = getNodePalette(node.type)
            const r = nodeR(node.id)
            const isHov = node.id === hovered
            const dimmed = hovered !== null && node.id !== hovered && !hovNeighbors?.has(node.id)
            const label = node.title.length > 20 ? node.title.slice(0, 18) + '…' : node.title
            return (
              <g
                key={node.id}
                data-nid={node.id}
                style={{ cursor: 'pointer', opacity: dimmed ? 0.22 : 1, transition: 'opacity 0.15s' }}
                onClick={() => onSelect(node.id)}
                onPointerEnter={() => setHovered(node.id)}
                onPointerLeave={() => setHovered(null)}
              >
                {/* Glow on hover */}
                {isHov && (
                  <circle cx={pos.x} cy={pos.y} r={r + 6} fill={pal.stroke} opacity={0.18} />
                )}
                <circle
                  cx={pos.x} cy={pos.y} r={r}
                  fill={pal.fill}
                  stroke={isHov ? pal.stroke : pal.stroke}
                  strokeWidth={isHov ? 2 : 1.4}
                />
                <text
                  x={pos.x} y={pos.y + r + 13}
                  textAnchor="middle"
                  fontSize={10}
                  fill="currentColor"
                  style={{ pointerEvents: 'none', fontFamily: 'inherit' }}
                >
                  {label}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}

export function KnowledgeBrowserScreen() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [focusLine, setFocusLine] = useState<number | null>(null)
  const [focusedResult, setFocusedResult] =
    useState<KnowledgeSearchResult | null>(null)
  const [mobileTreeOpen, setMobileTreeOpen] = useState(true)
  const [graphOpen, setGraphOpen] = useState(false)
  const deferredSearch = useDeferredValue(searchInput)
  const searchTerm = deferredSearch.trim()

  const listQuery = useQuery({
    queryKey: ['knowledge', 'list'],
    queryFn: () => readJson<KnowledgeListResponse>('/api/knowledge/list'),
  })

  const pages = listQuery.data?.pages ?? []
  const knowledgeRoot = listQuery.data?.knowledgeRoot ?? '~/.hermes/knowledge/'
  const knowledgeExists = listQuery.data?.exists ?? false

  const pageLookup = useMemo(() => {
    const map = new Map<string, string>()
    for (const page of pages) {
      map.set(normalizeWikiToken(page.path), page.path)
      map.set(normalizeWikiToken(page.name), page.path)
      map.set(normalizeWikiToken(page.title), page.path)
      map.set(normalizeWikiToken(page.name.replace(/\.md$/i, '')), page.path)
      const basename = page.path.split('/').pop() || page.name
      map.set(normalizeWikiToken(basename), page.path)
      map.set(normalizeWikiToken(basename.replace(/\.md$/i, '')), page.path)
    }
    return map
  }, [pages])

  const filteredPages = useMemo(() => {
    if (!selectedTag) return pages
    return pages.filter((page) => page.tags.includes(selectedTag))
  }, [pages, selectedTag])

  const tree = useMemo(() => buildKnowledgeTree(filteredPages), [filteredPages])
  const popularTags = useMemo(() => {
    const counts = new Map<string, number>()
    for (const page of pages) {
      for (const tag of page.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1)
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 16)
  }, [pages])

  useEffect(() => {
    if (!pages.length) return
    if (selectedPath && pages.some((page) => page.path === selectedPath)) return
    setSelectedPath(pages[0]?.path ?? null)
  }, [pages, selectedPath])

  const readQuery = useQuery({
    queryKey: ['knowledge', 'read', selectedPath],
    queryFn: () =>
      readJson<KnowledgeReadResponse>(
        `/api/knowledge/read?path=${encodeURIComponent(selectedPath || '')}`,
      ),
    enabled: Boolean(selectedPath),
  })

  const searchQuery = useQuery({
    queryKey: ['knowledge', 'search', searchTerm],
    queryFn: () =>
      readJson<KnowledgeSearchResponse>(
        `/api/knowledge/search?q=${encodeURIComponent(searchTerm)}`,
      ),
    enabled: searchTerm.length > 0,
  })

  const graphQuery = useQuery({
    queryKey: ['knowledge', 'graph'],
    queryFn: () => readJson<KnowledgeGraphResponse>('/api/knowledge/graph'),
    enabled: graphOpen,
  })

  const page = readQuery.data?.page ?? null
  const content = readQuery.data?.content ?? ''
  const backlinks = readQuery.data?.backlinks ?? []
  const processedContent = useMemo(
    () => preprocessWikiMarkdown(content),
    [content],
  )
  const askUrl = `/chat?message=${encodeURIComponent(
    `Tell me about: ${page?.title || selectedPath || 'this page'}\n\nContext:\n${content.slice(0, 500)}`,
  )}`
  const searchResults = searchQuery.data?.results ?? []

  function resolveWikiPath(rawValue: string): string | null {
    const decoded = decodeURIComponent(rawValue)
    return pageLookup.get(normalizeWikiToken(decoded)) ?? null
  }

  function handleSelectPath(
    pathValue: string,
    nextLine?: number,
    result?: KnowledgeSearchResult,
  ) {
    setSelectedPath(pathValue)
    setFocusLine(nextLine ?? null)
    setFocusedResult(result ?? null)
    setMobileTreeOpen(false)
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}
    >
      <div
        className="px-3 py-3 md:px-4"
        style={{
          borderBottom: '1px solid var(--theme-border)',
          backgroundColor: 'var(--theme-bg)',
        }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className="inline-flex size-9 items-center justify-center rounded-xl"
              style={{
                border: '1px solid var(--theme-border)',
                backgroundColor: 'var(--theme-card)',
                color: 'var(--theme-text)',
              }}
            >
              <HugeiconsIcon icon={BrainIcon} size={18} strokeWidth={1.6} />
            </div>
            <div className="relative min-w-0 flex-1">
              <HugeiconsIcon
                icon={Search01Icon}
                size={16}
                strokeWidth={1.7}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--theme-muted)' }}
              />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search knowledge"
                className="w-full rounded-xl py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-accent-500"
                style={{
                  border: '1px solid var(--theme-border)',
                  backgroundColor: 'var(--theme-card)',
                  color: 'var(--theme-text)',
                }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setGraphOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-primary-100 dark:hover:bg-neutral-900"
            style={{
              border: '1px solid var(--theme-border)',
              backgroundColor: 'var(--theme-card)',
              color: 'var(--theme-text)',
            }}
          >
            <HugeiconsIcon icon={Link01Icon} size={16} strokeWidth={1.7} />
            Graph view
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 md:grid-cols-[320px_minmax(0,1fr)] md:p-4">
        <aside className="flex min-h-0 flex-col rounded-2xl border border-primary-200 bg-primary-50 dark:border-neutral-800 dark:bg-neutral-950">
          <button
            type="button"
            className="flex items-center justify-between px-3 py-2 text-left md:cursor-default"
            onClick={() => setMobileTreeOpen((value) => !value)}
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-primary-500 dark:text-neutral-400">
              Knowledge Pages ({filteredPages.length})
            </span>
            <span className="text-primary-500 dark:text-neutral-400 md:hidden">
              <HugeiconsIcon
                icon={mobileTreeOpen ? ArrowUp01Icon : ArrowDown01Icon}
                size={16}
                strokeWidth={1.7}
              />
            </span>
          </button>

          {!knowledgeExists && !listQuery.isLoading ? (
            <div className="px-3 pb-3">
              <EmptyKnowledgeState knowledgeRoot={knowledgeRoot} />
            </div>
          ) : searchTerm ? (
            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
              <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-primary-400 dark:text-neutral-500">
                Search Results
              </div>
              <div className="space-y-1">
                {searchQuery.isLoading ? (
                  <StateBox label="Searching knowledge..." />
                ) : searchResults.length === 0 ? (
                  <StateBox label="No matches found" />
                ) : (
                  searchResults.map((result, index) => (
                    <button
                      key={`${result.path}:${result.line}:${index}`}
                      type="button"
                      onClick={() =>
                        handleSelectPath(result.path, result.line, result)
                      }
                      className="w-full rounded-lg border border-primary-200 bg-primary-50/80 px-2.5 py-2 text-left hover:border-primary-300 hover:bg-primary-100 dark:border-neutral-800 dark:bg-neutral-900/60 dark:hover:border-neutral-700 dark:hover:bg-neutral-900"
                    >
                      <div className="truncate text-[11px] text-primary-500 dark:text-neutral-400">
                        {result.title || result.path}:{result.line}
                      </div>
                      <div className="mt-0.5 line-clamp-3 text-xs text-primary-700 dark:text-neutral-200">
                        {highlightMatch(result.text, searchTerm).map(
                          (part, partIndex) => (
                            <span
                              key={partIndex}
                              className={
                                part.hit
                                  ? 'rounded bg-yellow-300/30 px-0.5 text-yellow-200'
                                  : undefined
                              }
                            >
                              {part.text || ' '}
                            </span>
                          ),
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div
              className={cn(
                'min-h-0 flex-1 px-2 pb-2',
                !mobileTreeOpen && 'hidden md:block',
              )}
            >
              <div className="space-y-3 overflow-y-auto pr-1 md:h-full">
                <section className="rounded-xl border border-primary-200 bg-primary-50/80 p-2 dark:border-neutral-800 dark:bg-neutral-900/60">
                  <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-primary-400 dark:text-neutral-500">
                    Tags
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <TagPill
                      label="All"
                      count={pages.length}
                      active={selectedTag == null}
                      onClick={() => setSelectedTag(null)}
                    />
                    {popularTags.map(([tag, count]) => (
                      <TagPill
                        key={tag}
                        label={tag}
                        count={count}
                        active={selectedTag === tag}
                        onClick={() => setSelectedTag(tag)}
                      />
                    ))}
                  </div>
                </section>

                <section className="rounded-xl border border-primary-200 bg-primary-50/80 p-1 dark:border-neutral-800 dark:bg-neutral-900/60">
                  {listQuery.isLoading ? (
                    <StateBox label="Loading knowledge pages..." />
                  ) : listQuery.error instanceof Error ? (
                    <StateBox label={listQuery.error.message} error />
                  ) : filteredPages.length === 0 ? (
                    <StateBox
                      label={
                        selectedTag
                          ? 'No pages match this tag'
                          : 'No markdown pages found'
                      }
                    />
                  ) : (
                    <TreeSection
                      node={tree}
                      selectedPath={selectedPath}
                      onSelectPath={(pathValue) => handleSelectPath(pathValue)}
                    />
                  )}
                </section>
              </div>
            </div>
          )}
        </aside>

        <section className="min-h-0 rounded-2xl border border-primary-200 bg-primary-50 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center justify-between border-b border-primary-200 px-3 py-2 dark:border-neutral-800">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-primary-900 dark:text-neutral-100">
                {page?.title || selectedPath || 'Select a page'}
              </div>
              {page ? (
                <div className="text-xs text-primary-400 dark:text-neutral-500">
                  {page.path} · {formatBytes(page.size)} ·{' '}
                  {formatDate(page.updated || page.modified)}
                </div>
              ) : null}
            </div>
            {page ? (
              <a
                href={askUrl}
                className="inline-flex items-center gap-1.5 rounded-md border border-primary-200 px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary-300 hover:bg-primary-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
              >
                <HugeiconsIcon
                  icon={Message01Icon}
                  size={14}
                  strokeWidth={1.7}
                />
                Ask agent about this
              </a>
            ) : null}
          </div>

          <div className="h-full overflow-auto p-2 md:p-3">
            {listQuery.isLoading ? (
              <StateBox label="Loading knowledge base..." />
            ) : listQuery.error instanceof Error ? (
              <StateBox label={listQuery.error.message} error />
            ) : !knowledgeExists ? (
              <EmptyKnowledgeState knowledgeRoot={knowledgeRoot} />
            ) : !selectedPath ? (
              <StateBox label="Select a page to start browsing" />
            ) : readQuery.isLoading ? (
              <StateBox label="Loading page..." />
            ) : readQuery.error instanceof Error ? (
              <StateBox label={readQuery.error.message} error />
            ) : !page ? (
              <StateBox label="Page not found" error />
            ) : (
              <div
                className="rounded-xl"
                style={{
                  border: '1px solid var(--theme-border)',
                  backgroundColor: 'var(--theme-card)',
                }}
              >
                <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_260px]">
                  <div className="min-w-0 space-y-4">
                    {focusedResult && focusedResult.path === page.path ? (
                      <div className="rounded-xl border border-yellow-300/40 bg-yellow-300/10 px-3 py-2 text-sm text-primary-900 dark:text-yellow-50">
                        <div className="font-medium">
                          Search hit at line {focusLine}
                        </div>
                        <div className="mt-1 text-xs opacity-80">
                          {focusedResult.text}
                        </div>
                      </div>
                    ) : null}

                    {page.summary ? (
                      <div className="rounded-xl border border-primary-200 bg-primary-50/70 px-3 py-2 text-sm text-primary-700 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300">
                        {page.summary}
                      </div>
                    ) : null}

                    <Markdown
                      className="gap-3"
                      components={{
                        a: function KnowledgeLink({ children, href }) {
                          if (href?.startsWith('wiki:')) {
                            const resolvedPath = resolveWikiPath(
                              href.slice('wiki:'.length),
                            )
                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  if (resolvedPath)
                                    handleSelectPath(resolvedPath)
                                }}
                                className="inline-flex items-center gap-1 text-primary-950 underline decoration-primary-300 underline-offset-4 transition-colors hover:text-primary-950 hover:decoration-primary-500 dark:text-neutral-100"
                              >
                                <HugeiconsIcon
                                  icon={Link01Icon}
                                  size={14}
                                  strokeWidth={1.7}
                                />
                                <span>{children}</span>
                              </button>
                            )
                          }

                          return (
                            <a
                              href={href}
                              className="text-primary-950 underline decoration-primary-300 underline-offset-4 transition-colors hover:text-primary-950 hover:decoration-primary-500"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {children}
                            </a>
                          )
                        },
                      }}
                    >
                      {processedContent}
                    </Markdown>

                    <section className="rounded-xl border border-primary-200 bg-primary-50/70 p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
                      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary-900 dark:text-neutral-100">
                        <HugeiconsIcon
                          icon={Link01Icon}
                          size={16}
                          strokeWidth={1.7}
                        />
                        Backlinks
                      </div>
                      {backlinks.length === 0 ? (
                        <div className="text-sm text-primary-500 dark:text-neutral-400">
                          No pages link here yet.
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {backlinks.map((backlink) => {
                            const backlinkPath =
                              resolveWikiPath(backlink) || backlink
                            return (
                              <button
                                key={backlink}
                                type="button"
                                onClick={() => handleSelectPath(backlinkPath)}
                                className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 transition-colors hover:border-primary-300 hover:bg-primary-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:border-neutral-600 dark:hover:bg-neutral-900"
                              >
                                {backlink}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </section>
                  </div>

                  <aside className="space-y-3">
                    <MetadataCard label="Type" value={page.type} />
                    <MetadataCard label="Domain" value={page.domain} />
                    <MetadataCard label="Status" value={page.status} />
                    <MetadataCard
                      label="Created"
                      value={formatDate(page.created)}
                    />
                    <MetadataCard
                      label="Updated"
                      value={formatDate(page.updated || page.modified)}
                    />
                    <MetadataCard label="Size" value={formatBytes(page.size)} />
                    <div className="rounded-xl border border-primary-200 bg-primary-50/70 p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
                      <div className="text-xs font-semibold uppercase tracking-wide text-primary-500 dark:text-neutral-400">
                        Tags
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {page.tags.length === 0 ? (
                          <span className="text-sm text-primary-500 dark:text-neutral-400">
                            No tags
                          </span>
                        ) : (
                          page.tags.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => setSelectedTag(tag)}
                              className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 transition-colors hover:border-primary-300 hover:bg-primary-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:border-neutral-600 dark:hover:bg-neutral-900"
                            >
                              #{tag}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="rounded-xl border border-primary-200 bg-primary-50/70 p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-500 dark:text-neutral-400">
                        <HugeiconsIcon
                          icon={CodeIcon}
                          size={14}
                          strokeWidth={1.7}
                        />
                        Wikilinks
                      </div>
                      {page.wikilinks.length === 0 ? (
                        <div className="text-sm text-primary-500 dark:text-neutral-400">
                          No outbound links
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {page.wikilinks.map((link) => {
                            const linkPath = resolveWikiPath(link) || link
                            return (
                              <button
                                key={link}
                                type="button"
                                onClick={() => handleSelectPath(linkPath)}
                                className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 transition-colors hover:border-primary-300 hover:bg-primary-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:border-neutral-600 dark:hover:bg-neutral-900"
                              >
                                {link}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </aside>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <DialogRoot open={graphOpen} onOpenChange={setGraphOpen}>
        <DialogContent className="w-[min(980px,94vw)] max-w-none p-0">
          <div className="border-b border-primary-200 px-5 py-4 dark:border-neutral-800">
            <DialogTitle>Knowledge graph</DialogTitle>
            <DialogDescription>
              Page relationships from wiki links. Click any node to open that
              page.
            </DialogDescription>
          </div>
          <div className="p-5">
            {graphQuery.isLoading ? (
              <StateBox label="Loading graph..." />
            ) : graphQuery.error instanceof Error ? (
              <StateBox label={graphQuery.error.message} error />
            ) : (graphQuery.data?.nodes?.length ?? 0) === 0 ? (
              <StateBox label="No graph data yet" />
            ) : (
              <GraphCanvas
                nodes={graphQuery.data?.nodes ?? []}
                edges={graphQuery.data?.edges ?? []}
                onSelect={(pathValue) => {
                  setGraphOpen(false)
                  handleSelectPath(pathValue)
                }}
              />
            )}
          </div>
        </DialogContent>
      </DialogRoot>
    </div>
  )
}

function TreeSection({
  node,
  selectedPath,
  onSelectPath,
  depth = 0,
}: {
  node: TreeNode
  selectedPath: string | null
  onSelectPath: (path: string) => void
  depth?: number
}) {
  return (
    <div className={cn('space-y-1', depth > 0 && 'mt-1')}>
      {node.path ? (
        <div
          className="flex items-center gap-2 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-primary-500 dark:text-neutral-400"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <HugeiconsIcon icon={Folder01Icon} size={14} strokeWidth={1.7} />
          <span className="truncate">{node.name}</span>
        </div>
      ) : null}

      {node.pages.map((page) => (
        <button
          key={page.path}
          type="button"
          onClick={() => onSelectPath(page.path)}
          className={cn(
            'block w-full rounded-lg border px-2.5 py-2 text-left transition-colors',
            selectedPath === page.path
              ? 'border-accent-500/70 bg-accent-500/10'
              : 'border-primary-200 bg-primary-50/80 hover:border-primary-300 hover:bg-primary-100 dark:border-neutral-800 dark:bg-neutral-900/60 dark:hover:border-neutral-700 dark:hover:bg-neutral-900',
          )}
          style={{ marginLeft: depth > 0 ? depth * 12 : 0 }}
        >
          <div className="flex items-start gap-2">
            <HugeiconsIcon
              icon={File01Icon}
              size={16}
              strokeWidth={1.7}
              className="mt-0.5 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-primary-900 dark:text-neutral-100">
                {page.title}
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {page.type ? <InlineBadge label={page.type} /> : null}
                {page.status ? <InlineBadge label={page.status} /> : null}
              </div>
            </div>
          </div>
        </button>
      ))}

      {node.folders.map((child) => (
        <TreeSection
          key={child.path}
          node={child}
          selectedPath={selectedPath}
          onSelectPath={onSelectPath}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}

function InlineBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-primary-200 bg-primary-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
      {label}
    </span>
  )
}

function TagPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
        active
          ? 'border-accent-500/70 bg-accent-500/10 text-primary-900 dark:text-neutral-100'
          : 'border-primary-200 bg-primary-50 text-primary-600 hover:border-primary-300 hover:bg-primary-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:bg-neutral-900',
      )}
    >
      {label} <span className="opacity-70">{count}</span>
    </button>
  )
}

function MetadataCard({
  label,
  value,
}: {
  label: string
  value?: string | null
}) {
  if (!value) return null
  return (
    <div className="rounded-xl border border-primary-200 bg-primary-50/70 p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
      <div className="text-xs font-semibold uppercase tracking-wide text-primary-500 dark:text-neutral-400">
        {label}
      </div>
      <div className="mt-1 text-sm text-primary-900 dark:text-neutral-100">
        {value}
      </div>
    </div>
  )
}

function EmptyKnowledgeState({ knowledgeRoot }: { knowledgeRoot: string }) {
  return (
    <div className="flex min-h-32 flex-col justify-center rounded-xl border border-primary-200 bg-primary-50 px-4 py-5 text-sm text-primary-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
      <div className="text-base font-semibold text-primary-900 dark:text-neutral-100">
        No knowledge base found
      </div>
      <p className="mt-2 text-pretty">
        Create markdown files in <code>{knowledgeRoot}</code> to get started.
      </p>
      <a
        href="https://karpathy.ai/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary-900 underline decoration-primary-300 underline-offset-4 hover:decoration-primary-500 dark:text-neutral-100"
      >
        <HugeiconsIcon icon={Link01Icon} size={14} strokeWidth={1.7} />
        See the Karpathy LLM wiki pattern
      </a>
    </div>
  )
}

function StateBox({ label, error }: { label: string; error?: boolean }) {
  return (
    <div
      className={cn(
        'flex min-h-32 items-center justify-center rounded-xl border px-4 text-sm',
        error
          ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300'
          : 'border-primary-200 bg-primary-50 text-primary-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400',
      )}
    >
      {label}
    </div>
  )
}
