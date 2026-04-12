/**
 * Crew template types — pre-built crew configurations for quick setup.
 */

export type CrewTemplateCategory =
  | 'research'
  | 'engineering'
  | 'creative'
  | 'operations'

export interface CrewTemplateMember {
  /** Lowercase persona name, e.g. 'kai' */
  persona: string
  role: 'coordinator' | 'executor' | 'reviewer' | 'specialist'
}

export interface CrewTemplate {
  id: string
  name: string
  description: string
  /** Single emoji for visual identity */
  icon: string
  category: CrewTemplateCategory
  defaultGoal: string
  defaultMembers: CrewTemplateMember[]
  isBuiltIn: boolean
  tags: string[]
  /** Undefined for built-ins; epoch ms for user templates */
  createdAt?: number
}
