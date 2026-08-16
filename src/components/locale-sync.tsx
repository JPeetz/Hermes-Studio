import { useEffect } from 'react'
import { useSettingsStore } from '@/hooks/use-settings'
import { applyLocale, isLocalePreference } from '@/i18n'

/**
 * Applies the persisted UI locale after hydration (Issue #12).
 *
 * The settings store uses skipHydration, so SSR and the first client render
 * agree on the default locale and there is no hydration mismatch; this
 * component then rehydrates the store and switches i18next to the resolved
 * locale, re-rendering translated components.
 *
 * The inline script in __root.tsx has already set <html lang> from the cookie
 * before paint, so this only has to catch up i18next itself.
 */
export function LocaleSync() {
  const locale = useSettingsStore((state) => state.settings.locale)

  useEffect(() => {
    void useSettingsStore.persist.rehydrate()
  }, [])

  useEffect(() => {
    if (isLocalePreference(locale)) applyLocale(locale)
  }, [locale])

  return null
}
