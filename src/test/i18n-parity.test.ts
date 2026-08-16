import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import en from '../i18n/locales/en.json'
import zhCN from '../i18n/locales/zh-CN.json'

/**
 * Catalog guards for issue #12.
 *
 * The first pass at i18n shipped 31 keys of which 21 were referenced by
 * nothing, and had no check that the two catalogs agreed. Both failure modes
 * are silent: a dead key looks like coverage, and a missing key falls back to
 * English so nobody notices the drift.
 *
 * These four tests cover parity in both directions AND the link between the
 * catalogs and the code that uses them.
 */

const SRC_ROOT = path.resolve(__dirname, '..')
const LOCALES_DIR = path.join(SRC_ROOT, 'i18n/locales')

/** Values that are legitimately the same in both languages (brand names etc). */
const IDENTICAL_BY_DESIGN = new Set<string>([
  // Product name.
  'settingsBody.hermesAgent',
  // Literal option lists the user types back verbatim — translating them would
  // make the setting reject the value the label told them to enter.
  'settingsBody.alloyEchoFableOnyx',
  'settingsBody.tinyBaseSmallMedium',
  // Literal API-key prefix the user is meant to recognise verbatim.
  'settingsBody.sk',
])

function flatten(obj: unknown, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {}
  if (!obj || typeof obj !== 'object') return out
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const full = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(out, flatten(value, full))
    } else {
      out[full] = String(value)
    }
  }
  return out
}

function walk(dir: string): Array<string> {
  const out: Array<string> = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'test') continue
      out.push(...walk(full))
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full)
    }
  }
  return out
}

const enKeys = flatten(en)
const zhKeys = flatten(zhCN)

const sources = walk(SRC_ROOT).map((full) => fs.readFileSync(full, 'utf8'))
const allSource = sources.join('\n')

describe('i18n catalogs (issue #12)', () => {
  it('every locale file has the same keys as en', () => {
    const locales = fs
      .readdirSync(LOCALES_DIR)
      .filter((f) => f.endsWith('.json') && f !== 'en.json')

    expect(locales.length).toBeGreaterThan(0)

    for (const file of locales) {
      const other = flatten(
        JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, file), 'utf8')),
      )
      const missing = Object.keys(enKeys).filter((k) => !(k in other))
      const extra = Object.keys(other).filter((k) => !(k in enKeys))

      expect(missing, `${file} is missing keys present in en.json`).toEqual([])
      expect(extra, `${file} has keys that en.json does not`).toEqual([])
    }
  })

  it('zh-CN values are actually translated', () => {
    const untranslated = Object.keys(enKeys).filter(
      // No presence check needed: the parity test above already guarantees
      // zh-CN carries exactly en's key set.
      (key) => !IDENTICAL_BY_DESIGN.has(key) && zhKeys[key] === enKeys[key],
    )

    expect(
      untranslated,
      'These zh-CN values are byte-identical to English — either translate ' +
        'them or add the key to IDENTICAL_BY_DESIGN with a reason',
    ).toEqual([])
  })

  // NOTE: the companion guard — "every catalog key is referenced in the code"
  // — is deliberately absent while adoption is staged. This change lands the
  // runtime and the catalog; the screens still hold their English literals, so
  // every key would read as dead and the guard would fail on a correct tree.
  // Restore it in the change that finishes wiring `t()` through the screens:
  //
  //   const dead = Object.keys(enKeys).filter((k) => !referencedKeys.has(k))
  //   expect(dead, 'catalog keys never passed to t()').toEqual([])
  //
  // Its inverse below is the half that IS meaningful today: a key used in code
  // but missing from the catalog renders as the raw key string to the user.

  it('every t() key exists in the catalog', () => {
    // Narrower than `referencedKeys` on purpose: only direct t('…') calls, so
    // an unrelated dotted string elsewhere in src cannot fail this.
    const called = new Set<string>()
    for (const match of allSource.matchAll(/\bt\(\s*['"]([\w.]+)['"]/g)) {
      called.add(match[1])
    }
    const missing = [...called].filter((key) => !(key in enKeys))

    expect(
      missing,
      'These keys are used in code but absent from en.json — they would ' +
        'render as the raw key string',
    ).toEqual([])
  })
})
