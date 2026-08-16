/**
 * i18n foundation (Issue #12).
 *
 * i18next initializes synchronously with bundled JSON catalogs — no async
 * backend, no Vite plugin, no SSR coupling. The server always renders the
 * default locale; the inline locale script in __root.tsx sets <html lang>
 * before paint, and <LocaleSync> (mounted in the workspace shell) applies the
 * resolved locale after hydration, so there is never a server/client hydration
 * mismatch.
 *
 * Locale preference lives in the Zustand settings store (localStorage,
 * 'hermes-settings') and is mirrored to the `hermes-locale` cookie, which the
 * inline script reads on the next load.
 *
 * Adding a language: create src/i18n/locales/<tag>.json, register it in
 * `resources` and `SUPPORTED_LOCALES` below. The catalog-parity test
 * (src/test/i18n-parity.test.ts) will then require it to be complete.
 */
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import zhCN from './locales/zh-CN.json'

export const SUPPORTED_LOCALES = [
  { value: 'en', label: 'English' },
  { value: 'zh-CN', label: '简体中文' },
] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]['value']

/**
 * What the user picked. 'auto' follows the browser — it is the default so a
 * zh-CN browser gets Chinese on first load without hunting through Settings,
 * which was the whole point of issue #12. An explicit 'en' is a real choice
 * and is honoured even on a non-English browser.
 */
export type LocalePreference = SupportedLocale | 'auto'

export const DEFAULT_LOCALE: SupportedLocale = 'en'
export const DEFAULT_LOCALE_PREFERENCE: LocalePreference = 'auto'

export const LOCALE_COOKIE = 'hermes-locale'

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return SUPPORTED_LOCALES.some((locale) => locale.value === value)
}

export function isLocalePreference(value: unknown): value is LocalePreference {
  return value === 'auto' || isSupportedLocale(value)
}

/**
 * Best supported locale for the browser's language list. Tries exact tags
 * first ('zh-CN'), then base languages ('zh' → the first supported zh-*), so
 * a browser set to 'zh', 'zh-Hans' or 'zh-SG' still lands on Simplified
 * Chinese rather than silently falling back to English.
 */
export function detectBrowserLocale(
  languages?: ReadonlyArray<string>,
): SupportedLocale {
  const candidates =
    languages ??
    (typeof navigator === 'undefined'
      ? []
      : navigator.languages.length
        ? navigator.languages
        : [navigator.language])

  for (const raw of candidates) {
    const tag = (raw || '').trim()
    if (!tag) continue
    if (isSupportedLocale(tag)) return tag

    const base = tag.split('-')[0].toLowerCase()
    const match = SUPPORTED_LOCALES.find(
      (locale) => locale.value.split('-')[0].toLowerCase() === base,
    )
    if (match) return match.value
  }

  return DEFAULT_LOCALE
}

/** Collapse a preference to the locale that should actually render. */
export function resolveLocale(preference: LocalePreference): SupportedLocale {
  return preference === 'auto' ? detectBrowserLocale() : preference
}

void i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    'zh-CN': { translation: zhCN },
  },
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  interpolation: {
    // React already escapes rendered strings.
    escapeValue: false,
  },
})

/** Switch the active locale and persist it for the next load's inline script. */
export function applyLocale(preference: LocalePreference): void {
  const locale = resolveLocale(preference)

  if (i18next.language !== locale) {
    void i18next.changeLanguage(locale)
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
    // Store the PREFERENCE, not the resolved locale: 'auto' must keep
    // following the browser if the user later changes their system language.
    document.cookie = `${LOCALE_COOKIE}=${preference}; Path=/; Max-Age=${365 * 24 * 60 * 60}; SameSite=Lax`
  }
}

export default i18next
