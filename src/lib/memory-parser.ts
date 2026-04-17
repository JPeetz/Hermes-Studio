/**
 * memory-parser.ts
 *
 * Pure functions for parsing and serialising Hermes MEMORY.md files.
 * MEMORY.md uses § as an entry delimiter. Each entry is a free-form text
 * block; entries prefixed with "CORRECTION:" (case-insensitive) are agent
 * self-corrections rather than observed user patterns.
 */

const CORRECTION_PREFIX = 'CORRECTION:'

export type MemoryEntry = {
  /** Zero-based index within the file after parsing */
  index: number
  /** Raw text of the entry (as stored in the file, before trimming) */
  raw: string
  /** True if this entry starts with CORRECTION: */
  isCorrection: boolean
  /** Body text with the CORRECTION: prefix stripped if present */
  body: string
}

/**
 * Parse a raw MEMORY.md string into individual entries.
 * Empty chunks (whitespace only) are discarded.
 */
export function parseEntries(raw: string): MemoryEntry[] {
  return raw
    .split('§')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk, i) => {
      const isCorrection = chunk
        .trimStart()
        .toUpperCase()
        .startsWith(CORRECTION_PREFIX)
      const body = isCorrection
        ? chunk
            .slice(chunk.toUpperCase().indexOf(CORRECTION_PREFIX) + CORRECTION_PREFIX.length)
            .trim()
        : chunk
      return { index: i, raw: chunk, isCorrection, body }
    })
}

/**
 * Serialise an array of entries back to MEMORY.md format.
 */
export function buildMemoryContent(entries: MemoryEntry[]): string {
  return entries.map((e) => e.raw).join('\n§\n')
}

/**
 * Append a new correction entry to a raw MEMORY.md string.
 */
export function appendCorrection(raw: string, text: string): string {
  const entry = `CORRECTION: ${text.trim()}`
  const trimmed = raw.trim()
  return trimmed ? `${trimmed}\n§\n${entry}` : entry
}

/**
 * Remove an entry by index and return the updated file content.
 */
export function removeEntry(raw: string, index: number): string {
  const entries = parseEntries(raw).filter((e) => e.index !== index)
  return buildMemoryContent(entries)
}
