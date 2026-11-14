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

function lookup(cat: Catalog | undefined, locale: string, key: string, params?: Params): string | undefined {
  if (!cat) return undefined
  if (typeof params?.count === 'number') {
    const form = cat[`${key}_${new Intl.PluralRules(locale).select(params.count)}`] ?? cat[`${key}_other`]
    if (form !== undefined) return form
  }
  return cat[key]
}

// Active locale → en → the key itself. Never throws and never logs.
export function translate(locale: Locale, key: string, params?: Params, catalogs: Record<string, Catalog> = CATALOGS): string {
  const s = lookup(catalogs[locale], locale, key, params) ?? lookup(catalogs[DEFAULT_LOCALE], DEFAULT_LOCALE, key, params) ?? key
  return params ? s.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m)) : s
}

// Locale for code outside React (errorMessage, formatters); the provider keeps it in sync.
let active: Locale = DEFAULT_LOCALE
export const setActiveLocale = (l: Locale) => {
  active = l
}
export const activeLocale = () => active
export const tActive = (key: string, params?: Params) => translate(active, key, params)
