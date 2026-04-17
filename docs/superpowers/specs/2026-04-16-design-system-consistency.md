# Design System Consistency — Spec

**Date:** 2026-04-16
**Status:** Implemented (v1.16.0)
**Scope:** Hermes Studio — all screens and future extensions

---

## Problem

Hermes Studio has a well-designed CSS variable theming system (9 complete themes, `--theme-*` tokens) that is systematically ignored by roughly half the screens. Those screens hardcode Tailwind's `primary-*` palette or literal colors (`bg-white`, `text-black`), which breaks dark themes visually and makes the product look like it was built by multiple uncoordinated authors. Information display formats (lists, tables, cards, emoji bullets) also vary arbitrarily across screens.

---

## Goal

Every screen uses:
- The 6 canonical design-system components from `src/components/ds/`
- `var(--theme-*)` CSS variables exclusively for all color values
- Hugeicons for all iconography (no decorative emoji)
- Agent/skill emoji only where it is the actual data value (e.g. `agent.emoji`)

The Dashboard and Agent Library screens are the reference implementations — every other screen must match their visual language.

---

## The Rule (for future development)

> **Never use a Tailwind color class (`primary-*`, `accent-*`, `neutral-*`, `white`, `black`) directly on a screen-level component. Always use a `--theme-*` CSS variable.**
>
> The only permitted exception is inside `src/components/ds/` component internals, where the variable is the definition of that component's appearance.

This rule must be followed for every new screen, component, or feature added to the repo.

---

## Component Set — `src/components/ds/`

All 6 components are exported from `src/components/ds/index.ts` (barrel export).

### 1. `<Card>`

The base surface primitive. Replaces every ad-hoc `bg-[var(--theme-card)] border-[var(--theme-border)]` div.

**Props:**
```ts
variant?: 'default' | 'panel' | 'subtle'  // default: 'default'
header?: ReactNode                          // optional header slot
footer?: ReactNode                          // optional footer slot
className?: string
children: ReactNode
```

**Variants:**
- `default` — `var(--theme-card)` background, `var(--theme-border)` border
- `panel` — `var(--theme-panel)` background, `var(--theme-border)` border
- `subtle` — `var(--theme-accent-subtle)` background, `var(--theme-accent-border)` border

**Usage:** Feature cards, job cards, agent cards, skill cards, settings sections, any bordered container.

---

### 2. `<SettingsRow>`

The canonical settings page building block. Label + description on left, control on right.

**Props:**
```ts
label: string
description?: string
danger?: boolean     // tints left border red using var(--theme-danger)
children: ReactNode  // the control: toggle, select, input, button, etc.
```

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│ Label                          [control slot]        │
│ description (muted, smaller)                         │
└──────────────────────────────────────────────────────┘
```

**Usage:** Every row in Settings, Providers, Permissions, MCP, Integrations screens.

---

### 3. `<SectionHeader>`

Screen and section titles with consistent sizing, weight, and optional action.

**Props:**
```ts
title: string
subtitle?: string
action?: ReactNode   // optional button/link in top-right
divider?: boolean    // renders bottom border — default: true
```

**Layout:**
```
Title text                        [optional action]
──────────────────────────────────────────────────
subtitle text (muted, smaller)
```

**Usage:** Top of every settings section, screen headers, dialog section breaks.

---

### 4. `<StatusBadge>`

Replaces all emoji status indicators. Renders a hugeicon + label in the correct semantic color.

**Props:**
```ts
status: 'running' | 'success' | 'error' | 'warning' | 'idle' | 'pending'
label?: string       // defaults to capitalised status name
size?: 'sm' | 'md'  // default: 'sm'
```

**Color mapping:**
| Status | Token | Icon |
|---|---|---|
| `running` | `--theme-active` | `Loading03Icon` (animated spin) |
| `success` | `--theme-success` | `CheckmarkCircle02Icon` |
| `error` | `--theme-danger` | `CancelCircleIcon` |
| `warning` | `--theme-warning` | `Alert02Icon` |
| `idle` | `--theme-muted` | `MinusSignCircleIcon` |
| `pending` | `--theme-muted` | `Clock01Icon` |

**Usage:** Job history, audit trail, approval items, crew member status, run events. Replaces ✓ ✗ ⚙ 💭 emoji entirely.

---

### 5. `<ListItem>`

The canonical list row. Icon + label + optional meta, with consistent hover state.

**Props:**
```ts
icon?: ReactNode         // hugeicon component
label: string
description?: string     // secondary line, muted
meta?: ReactNode         // right-side content (badge, timestamp, action)
onClick?: () => void     // makes the row interactive
active?: boolean         // highlights with accent-subtle bg
```

**Layout:**
```
[icon]  Primary label                    [meta]
        secondary description (muted)
```

**Usage:** Job history rows, session list rows, audit event rows, approval items, skill list rows, file browser rows. Replaces the mix of `<ul><li>`, emoji-prefixed divs, and table rows used today.

---

### 6. `<EmptyState>`

Consistent zero-data display. Every screen that can be empty uses exactly this.

**Props:**
```ts
icon: ReactNode      // hugeicon component, rendered large
title: string
description?: string
action?: ReactNode   // optional button
```

**Layout:**
```
            [icon — large, muted]
            Title text
            description (muted)
            [action button]
```

**Usage:** All screens — no more ad-hoc "nothing here" divs.

---

## CSS Variable Canonical Mapping

The complete replacement table. No other substitutions are permitted.

| Broken class | Canonical replacement |
|---|---|
| `bg-white` | `bg-[var(--theme-card)]` |
| `bg-primary-50` | `bg-[var(--theme-bg)]` |
| `bg-primary-100` | `bg-[var(--theme-panel)]` |
| `border-primary-200` | `border-[var(--theme-border)]` |
| `border-primary-300` | `border-[var(--theme-border)]` |
| `text-primary-900` | `text-[var(--theme-text)]` |
| `text-black` | `text-[var(--theme-text)]` |
| `text-neutral-400` | `text-[var(--theme-muted)]` |
| `bg-accent-500` | `bg-[var(--theme-accent)]` |
| `hover:bg-primary-100` | `hover:bg-[var(--theme-card2)]` |
| `bg-white/5`, `bg-white/10` | `bg-[var(--theme-accent-subtle)]` |
| `border-neutral-200` | `border-[var(--theme-border)]` |
### New variable to add

Add `--theme-hover` as an alias for `--theme-card2` in all 9 theme blocks in `styles.css`. This token is already referenced in `jobs-screen.tsx` but was never defined, causing a silent no-op hover. Once added, `hover:bg-[var(--theme-hover)]` is the correct and preferred token for row hover states in new code — do not replace existing usages with `--theme-card2`.

### Semantic tokens (use these, don't invent alternatives)

| Token | Use for |
|---|---|
| `--theme-success` | Done / installed / connected |
| `--theme-warning` | Pending / degraded / retrying |
| `--theme-danger` | Failed / error / destructive |
| `--theme-active` | Running / selected / live |
| `--theme-muted` | Secondary text, descriptions, placeholders |
| `--theme-accent` | Primary action color, interactive highlights |
| `--theme-accent-subtle` | Subtle accent backgrounds, hover states on accent items |

---

## What Does Not Change

- `agent.emoji` — agent avatar emoji is data, rendered as-is in agent cards and crew builder
- Skill category emoji icons — category data, not decoration
- Dashboard screen — already correct, spot-check only
- Agent Library screen — already 90% correct, minor fixes only

---

## Migration Plan

### Phase 1 — Foundation

1. Add `--theme-hover` alias to all 9 themes in `styles.css`
2. Build all 6 components in `src/components/ds/`
3. Export from `src/components/ds/index.ts`

No screen files are touched in Phase 1.

### Phase 2 — Critical screens (theme-breaking in dark mode)

| Order | File(s) | Key changes |
|---|---|---|
| 1 | `src/routes/settings/index.tsx` | All `primary-*` → CSS vars; rows → `<SettingsRow>`; headers → `<SectionHeader>`; sections → `<Card>` |
| 2 | `src/screens/settings/providers-screen.tsx`, `components/provider-wizard.tsx` | Same pattern; `bg-white` inputs fixed; `text-black` removed |
| 3 | `src/screens/chat/components/chat-composer.tsx`, `chat-header.tsx` | `bg-white`, `border-neutral-200`, `bg-white/5` → CSS vars |
| 4 | `src/screens/memory/memory-browser-screen.tsx`, `knowledge-browser-screen.tsx` | 55+ replacements; lists → `<ListItem>`; empty states → `<EmptyState>` |

### Phase 3 — Consistency pass

| Order | File(s) | Key changes |
|---|---|---|
| 5 | `src/screens/profiles/profiles-screen.tsx` | `border-white`, `border-primary-*` removed |
| 6 | `src/screens/skills/skills-screen.tsx`, `workspace-skills-screen.tsx` | Remaining palette → CSS vars; cards → `<Card>`; empty states → `<EmptyState>` |
| 7 | `src/screens/jobs/jobs-screen.tsx` | `--theme-hover` fix; emoji → `<StatusBadge>` + `<ListItem>` |
| 8 | Audit, crews, agents, files screens | Grep for `bg-white`, `primary-*`, `text-black`, `border-neutral`; fix any hits; replace any ad-hoc "nothing here" divs with `<EmptyState>` |

---

## Reference Implementations

When in doubt, look at these two screens — they are already correct:

- `src/screens/dashboard/dashboard-screen.tsx` — CSS variables, card patterns, section layout
- `src/screens/agents/agent-library-screen.tsx` — card grid, list patterns, empty states

Any new screen should be able to pass a review by asking: "Does this look like it belongs next to the Dashboard?"

---

## Files Changed Summary

| File | Phase | Type of change |
|---|---|---|
| `src/styles.css` | 1 | Add `--theme-hover` to all 9 themes |
| `src/components/ds/index.ts` | 1 | New barrel export |
| `src/components/ds/card.tsx` | 1 | New component |
| `src/components/ds/settings-row.tsx` | 1 | New component |
| `src/components/ds/section-header.tsx` | 1 | New component |
| `src/components/ds/status-badge.tsx` | 1 | New component |
| `src/components/ds/list-item.tsx` | 1 | New component |
| `src/components/ds/empty-state.tsx` | 1 | New component |
| `src/routes/settings/index.tsx` | 2 | CSS + component migration |
| `src/screens/settings/providers-screen.tsx` | 2 | CSS + component migration |
| `src/screens/settings/components/provider-wizard.tsx` | 2 | CSS fix |
| `src/screens/chat/components/chat-composer.tsx` | 2 | CSS fix |
| `src/screens/chat/components/chat-header.tsx` | 2 | CSS fix |
| `src/screens/memory/memory-browser-screen.tsx` | 2 | CSS + component migration |
| `src/screens/memory/knowledge-browser-screen.tsx` | 2 | CSS + component migration |
| `src/screens/profiles/profiles-screen.tsx` | 3 | CSS fix |
| `src/screens/skills/skills-screen.tsx` | 3 | CSS + component migration |
| `src/screens/skills/workspace-skills-screen.tsx` | 3 | CSS + component migration |
| `src/screens/jobs/jobs-screen.tsx` | 3 | CSS fix + StatusBadge migration |
| `src/screens/audit/audit-trail-screen.tsx` | 3 | Spot-check |
| `src/screens/crews/crews-screen.tsx` | 3 | Spot-check |
| `src/screens/files/files-screen.tsx` | 3 | CSS fix |
