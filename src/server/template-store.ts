/**
 * Template store — file-backed persistence for user-created crew templates.
 *
 * Built-in templates are hardcoded and never written to disk.
 * User templates are stored in .runtime/templates.json.
 * Follows the same pattern as crew-store.ts and workflow-store.ts.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { CrewTemplate, CrewTemplateCategory } from '../types/template'

const DATA_DIR = join(process.cwd(), '.runtime')
const TEMPLATES_FILE = join(DATA_DIR, 'templates.json')

// ─── Built-in templates (hardcoded, never persisted) ─────────────────────────

const BUILT_IN_TEMPLATES: CrewTemplate[] = [
  {
    id: 'builtin-research-team',
    name: 'Research Team',
    description:
      'Analyze topics in depth, synthesize findings, and produce structured reports.',
    icon: '🔬',
    category: 'research',
    defaultGoal: 'Research the topic thoroughly and produce a structured report with key findings and recommendations.',
    defaultMembers: [
      { persona: 'luna', role: 'executor' },
      { persona: 'ada', role: 'reviewer' },
      { persona: 'kai', role: 'coordinator' },
    ],
    isBuiltIn: true,
    tags: ['research', 'analysis', 'reporting'],
  },
  {
    id: 'builtin-deep-dive',
    name: 'Deep Dive',
    description:
      'Two analysts plus a coordinator for exhaustive investigation of a complex subject.',
    icon: '🧐',
    category: 'research',
    defaultGoal: 'Conduct a comprehensive deep-dive investigation and deliver a detailed analysis document.',
    defaultMembers: [
      { persona: 'luna', role: 'executor' },
      { persona: 'roger', role: 'executor' },
      { persona: 'kai', role: 'coordinator' },
    ],
    isBuiltIn: true,
    tags: ['research', 'investigation', 'analysis'],
  },
  {
    id: 'builtin-fullstack-squad',
    name: 'Full-Stack Squad',
    description:
      'End-to-end feature delivery with frontend, backend, DevOps, and QA coverage.',
    icon: '🏗️',
    category: 'engineering',
    defaultGoal: 'Design, build, test, and deploy the feature end-to-end across the full stack.',
    defaultMembers: [
      { persona: 'kai', role: 'coordinator' },
      { persona: 'roger', role: 'executor' },
      { persona: 'sally', role: 'executor' },
      { persona: 'max', role: 'specialist' },
      { persona: 'ada', role: 'reviewer' },
    ],
    isBuiltIn: true,
    tags: ['engineering', 'fullstack', 'feature'],
  },
  {
    id: 'builtin-code-review',
    name: 'Code Review Crew',
    description:
      'Thorough code review covering correctness, security, and maintainability.',
    icon: '🔍',
    category: 'engineering',
    defaultGoal: 'Review the codebase for quality, security vulnerabilities, and best-practice adherence.',
    defaultMembers: [
      { persona: 'ada', role: 'executor' },
      { persona: 'luna', role: 'reviewer' },
      { persona: 'nova', role: 'specialist' },
    ],
    isBuiltIn: true,
    tags: ['engineering', 'review', 'quality'],
  },
  {
    id: 'builtin-content-studio',
    name: 'Content Studio',
    description:
      'Create compelling content: research, write, and polish for any channel.',
    icon: '✍️',
    category: 'creative',
    defaultGoal: 'Research the subject, draft engaging content, and refine it for the target audience.',
    defaultMembers: [
      { persona: 'bill', role: 'coordinator' },
      { persona: 'luna', role: 'executor' },
      { persona: 'roger', role: 'reviewer' },
    ],
    isBuiltIn: true,
    tags: ['creative', 'content', 'writing', 'marketing'],
  },
  {
    id: 'builtin-ops-team',
    name: 'Ops Team',
    description:
      'Infrastructure, deployment, and backend reliability across a system.',
    icon: '⚙️',
    category: 'operations',
    defaultGoal: 'Audit, optimize, and stabilize the infrastructure and deployment pipeline.',
    defaultMembers: [
      { persona: 'max', role: 'coordinator' },
      { persona: 'sally', role: 'executor' },
      { persona: 'kai', role: 'executor' },
    ],
    isBuiltIn: true,
    tags: ['operations', 'devops', 'infrastructure'],
  },
  {
    id: 'builtin-sprint-team',
    name: 'Sprint Team',
    description:
      'Balanced cross-functional crew for delivering a focused sprint of work.',
    icon: '⚡',
    category: 'operations',
    defaultGoal: 'Plan, execute, and review a focused sprint to deliver the defined scope on time.',
    defaultMembers: [
      { persona: 'kai', role: 'coordinator' },
      { persona: 'roger', role: 'executor' },
      { persona: 'sally', role: 'executor' },
      { persona: 'ada', role: 'reviewer' },
    ],
    isBuiltIn: true,
    tags: ['operations', 'sprint', 'delivery'],
  },
]

// ─── User template store (file-backed) ───────────────────────────────────────

type StoreData = { templates: Record<string, CrewTemplate> }

let store: StoreData = { templates: {} }

function loadFromDisk(): void {
  try {
    if (existsSync(TEMPLATES_FILE)) {
      const raw = readFileSync(TEMPLATES_FILE, 'utf-8')
      const parsed = JSON.parse(raw) as StoreData
      if (parsed?.templates && typeof parsed.templates === 'object') {
        store = parsed
      }
    }
  } catch {
    // corrupt file — start fresh
  }
}

function saveToDisk(): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
    writeFileSync(TEMPLATES_FILE, JSON.stringify(store, null, 2))
  } catch {
    // ignore write failure — in-memory is still consistent
  }
}

// Bootstrap on module load
loadFromDisk()

// ─── Public API ──────────────────────────────────────────────────────────────

/** Returns all templates: built-ins first (declaration order), then user templates newest-first. */
export function listTemplates(): CrewTemplate[] {
  const userTemplates = Object.values(store.templates).sort(
    (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0),
  )
  return [...BUILT_IN_TEMPLATES, ...userTemplates]
}

export function getTemplate(id: string): CrewTemplate | null {
  const builtin = BUILT_IN_TEMPLATES.find((t) => t.id === id)
  if (builtin) return builtin
  return store.templates[id] ?? null
}

export function createUserTemplate(input: {
  name: string
  description: string
  icon: string
  category: CrewTemplateCategory
  defaultGoal: string
  defaultMembers: Array<{ persona: string; role: CrewTemplate['defaultMembers'][number]['role'] }>
  tags: string[]
}): CrewTemplate {
  const template: CrewTemplate = {
    id: `user-${randomUUID()}`,
    ...input,
    isBuiltIn: false,
    createdAt: Date.now(),
  }
  store.templates[template.id] = template
  saveToDisk()
  return template
}

/** Returns false if id not found or if template is built-in. */
export function deleteUserTemplate(id: string): boolean {
  const template = getTemplate(id)
  if (!template) return false
  if (template.isBuiltIn) return false
  delete store.templates[id]
  saveToDisk()
  return true
}
