/**
 * Client-side API helpers for crew templates.
 */
import type { CrewTemplate, CrewTemplateCategory } from '@/types/template'
export type { CrewTemplate, CrewTemplateCategory }

export async function fetchTemplates(): Promise<CrewTemplate[]> {
  const res = await fetch('/api/crews/templates')
  const data = (await res.json()) as { ok: boolean; templates?: CrewTemplate[]; error?: string }
  if (!data.ok) throw new Error(data.error ?? 'Failed to fetch templates')
  return data.templates ?? []
}

export async function createUserTemplate(input: {
  name: string
  description: string
  icon: string
  category: CrewTemplateCategory
  defaultGoal: string
  defaultMembers: Array<{ persona: string; role: string }>
  tags: string[]
}): Promise<CrewTemplate> {
  const res = await fetch('/api/crews/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = (await res.json()) as { ok: boolean; template?: CrewTemplate; error?: string }
  if (!data.ok) throw new Error(data.error ?? 'Failed to create template')
  return data.template!
}

export async function deleteUserTemplate(id: string): Promise<void> {
  const res = await fetch(`/api/crews/templates/${id}`, { method: 'DELETE' })
  const data = (await res.json()) as { ok: boolean; error?: string }
  if (!data.ok) throw new Error(data.error ?? 'Failed to delete template')
}
