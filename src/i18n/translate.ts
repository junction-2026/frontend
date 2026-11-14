import { DEFAULT_LOCALE, type Locale } from './locales'

export type Catalog = Record<string, string>
export type Params = Record<string, string | number>

// Discovered by file name: locales/<lng>/<ns>.ts is addressed as "<ns>.<key>", so a new namespace needs no registry edit.
function load(): Record<string, Catalog> {
  const out: Record<string, Catalog> = {}
  const mods = import.meta.glob<{ default: Catalog }>('./locales/*/*.ts', { eager: true })
  for (const [path, mod] of Object.entries(mods)) {
    const [, lng, ns] = /\.\/locales\/([^/]+)\/([^/]+)\.ts$/.exec(path)!
    const cat = (out[lng] ??= {})
    for (const [k, v] of Object.entries(mod.default)) cat[`${ns}.${k}`] = v
  }
  return out
}
export const CATALOGS = load()

// zero | one | two | few | many | other for the locale (Arabic has all six).
export const pluralCategory = (count: number, locale: string = activeLocale()) => new Intl.PluralRules(locale).select(count)

// An empty value counts as missing, so a blank catalog entry never renders as nothing.
function lookup(cat: Catalog | undefined, locale: string, key: string, params?: Params): string | undefined {
  if (!cat) return undefined
  if (typeof params?.count === 'number') {
    const form = cat[`${key}_${pluralCategory(params.count, locale)}`] || cat[`${key}_other`]
    if (form) return form
  }
  return cat[key] || undefined
}

const warned = new Set<string>()
function warnMissing(locale: string, key: string) {
  const id = `${locale}:${key}`
  if (!import.meta.env.DEV || warned.has(id)) return
  warned.add(id)
  console.warn(`[i18n] missing translation "${key}" for locale "${locale}"`)
}

export const MISSING = '…' // a key no catalog defines: never the raw key

// Active locale → en → "…". Never throws; a fallback is warned about once per key in development.
export function translate(locale: Locale, key: string, params?: Params, catalogs: Record<string, Catalog> = CATALOGS): string {
  let s = lookup(catalogs[locale], locale, key, params)
  if (s === undefined) {
    warnMissing(locale, key)
    s = lookup(catalogs[DEFAULT_LOCALE], DEFAULT_LOCALE, key, params) ?? MISSING
  }
  return params ? s.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m)) : s
}

// Locale for code outside React (errorMessage, formatters); the provider keeps it in sync.
let active: Locale = DEFAULT_LOCALE
export const setActiveLocale = (l: Locale) => {
  active = l
}
export const activeLocale = () => active
export const tActive = (key: string, params?: Params) => translate(active, key, params)
