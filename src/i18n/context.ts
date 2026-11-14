import { createContext, useContext, useMemo } from 'react'
import { formatDate, formatNumber, formatRelativeTime } from './format'
import { DEFAULT_LOCALE, dirOf, type Locale } from './locales'
import { translate, type Params } from './translate'

export type LocaleState = { locale: Locale; setLocale: (l: Locale) => void; dir: 'ltr' | 'rtl' }

// Without a provider (isolated view tests) the UI is English.
export const I18nContext = createContext<LocaleState>({ locale: DEFAULT_LOCALE, setLocale: () => {}, dir: dirOf(DEFAULT_LOCALE) })

export const useLocale = () => useContext(I18nContext)

export function useT() {
  const { locale } = useLocale()
  return useMemo(() => (key: string, params?: Params) => translate(locale, key, params), [locale])
}

export function useFormat() {
  const { locale } = useLocale()
  return useMemo(
    () => ({
      formatDate: (v: Parameters<typeof formatDate>[0], o?: Intl.DateTimeFormatOptions) => formatDate(v, o, locale),
      formatNumber: (v: number, o?: Intl.NumberFormatOptions) => formatNumber(v, o, locale),
      formatRelativeTime: (iso: Parameters<typeof formatRelativeTime>[0], now?: Parameters<typeof formatRelativeTime>[1]) => formatRelativeTime(iso, now, locale),
    }),
    [locale],
  )
}
