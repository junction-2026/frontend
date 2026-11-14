// The only place that declares supported locales.
export const LOCALES = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'fr', label: 'Français', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'de', label: 'Deutsch', dir: 'ltr' },
  { code: 'fi', label: 'Suomi', dir: 'ltr' },
] as const

export type Locale = (typeof LOCALES)[number]['code']
export const DEFAULT_LOCALE: Locale = 'en'
export const STORAGE_KEY = 'veil.locale'

export const isLocale = (v: unknown): v is Locale => LOCALES.some((l) => l.code === v)
export const dirOf = (locale: Locale) => LOCALES.find((l) => l.code === locale)!.dir

// Stored value, else the first navigator language whose primary subtag is supported, else en.
export function detectLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isLocale(stored)) return stored
  } catch {
    /* storage unavailable (private mode) */
  }
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const l of langs) {
    const primary = l?.toLowerCase().split('-')[0]
    if (isLocale(primary)) return primary
  }
  return DEFAULT_LOCALE
}
