import { useCallback, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { I18nContext } from './context'
import { detectLocale, dirOf, isLocale, STORAGE_KEY, type Locale } from './locales'
import { setActiveLocale } from './translate'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, set] = useState<Locale>(() => {
    const l = detectLocale()
    setActiveLocale(l)
    return l
  })

  const setLocale = useCallback((l: Locale) => {
    if (!isLocale(l)) return
    setActiveLocale(l) // before the re-render, so errorMessage in render already uses it
    set(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      /* storage unavailable: the choice lives in memory */
    }
  }, [])

  const dir = dirOf(locale)
  useLayoutEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = dir
  }, [locale, dir])
  useEffect(() => () => setActiveLocale('en'), [])

  const value = useMemo(() => ({ locale, setLocale, dir }), [locale, setLocale, dir])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
