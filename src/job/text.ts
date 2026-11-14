import { CATALOGS, type Params } from '../i18n/translate'

type T = (key: string, params?: Params) => string
type Fmt = (v: number, o?: Intl.NumberFormatOptions) => string

// Enum value → catalog text; a value the catalog does not know (a newer API) is shown as the raw value.
export const enumLabel = (t: T, prefix: string, value: unknown): string =>
  typeof value === 'string' && CATALOGS.en[`${prefix}.${value}`] !== undefined ? t(`${prefix}.${value}`) : String(value ?? '')

// A 0..1 ratio as a whole percent in the active locale (fr: "86 %" with a non-breaking space).
export const percent = (fmt: Fmt, ratio: number) => fmt(Math.round(ratio * 100) / 100, { style: 'percent' })

// One decimal, with the unit text from the catalog ("1.2s" / "3.2 s").
export const seconds = (t: T, fmt: Fmt, key: string, s: number, o?: Intl.NumberFormatOptions) =>
  t(key, { v: fmt(s, { minimumFractionDigits: 1, maximumFractionDigits: 1, ...o }) })
