import { describe, expect, it } from 'vitest'
import { CATALOGS, type Catalog } from './translate'

const PLURAL = /_(zero|one|two|few|many|other)$/
const base = (key: string) => key.replace(PLURAL, '')
const ns = (key: string) => key.slice(0, key.indexOf('.'))
const ph = (s: string) => [...new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort().join(',')
const LOCALES = ['fr', 'ar', 'de', 'fi']

// Everything that makes a locale catalog incomplete against en: missing/extra keys, empty values, other placeholders, plural groups without `_other`.
// Namespaces come from the keys themselves, so one added by another task is checked without editing this test.
export function problems(en: Catalog, loc: Catalog, lng: string): string[] {
  const out: string[] = []
  const enBases = new Set(Object.keys(en).map(base))
  const locBases = new Set(Object.keys(loc).map(base))
  for (const b of enBases) if (!locBases.has(b)) out.push(`${lng}: ${ns(b)} is missing "${b}"`)
  for (const b of locBases) if (!enBases.has(b)) out.push(`${lng}: ${ns(b)} has "${b}" which en does not`)
  for (const [key, value] of Object.entries(loc)) {
    if (!value.trim()) out.push(`${lng}: ${ns(key)} "${key}" is empty`)
    const ref = en[key] ?? en[`${base(key)}_other`]
    if (ref !== undefined && ph(value) !== ph(ref)) out.push(`${lng}: ${ns(key)} "${key}" placeholders {${ph(value)}} differ from en {${ph(ref)}}`)
    if (PLURAL.test(key) && !(`${base(key)}_other` in loc)) out.push(`${lng}: "${base(key)}" has plural forms but no _other`)
  }
  return out
}

const files = Object.keys(import.meta.glob('./locales/*/*.ts')).map((p) => /locales\/([^/]+)\/([^/]+)\.ts$/.exec(p)!.slice(1))
const namespaces = (lng: string) => files.filter(([l]) => l === lng).map(([, n]) => n).sort()

describe('catalog completeness', () => {
  it('has en, fr, ar, de and fi', () => expect(Object.keys(CATALOGS).sort()).toEqual(['ar', 'de', 'en', 'fi', 'fr']))

  it('has no empty en value', () => {
    expect(Object.entries(CATALOGS.en).filter(([, v]) => !v.trim()).map(([k]) => k)).toEqual([])
  })

  it.each(LOCALES)('%s has every namespace of en', (lng) => expect(namespaces(lng)).toEqual(namespaces('en')))

  it.each(LOCALES)('%s has the same keys, non-empty values and placeholders as en in every namespace', (lng) => {
    const spaces = [...new Set(Object.keys(CATALOGS.en).map(ns))]
    expect(spaces.length).toBeGreaterThan(5)
    for (const n of spaces) {
      const pick = (c: Catalog) => Object.fromEntries(Object.entries(c).filter(([k]) => ns(k) === n))
      expect(problems(pick(CATALOGS.en), pick(CATALOGS[lng]), lng), `namespace ${n}`).toEqual([])
    }
  })

  describe('the check itself', () => {
    const en = { 'a.x': 'X {n}', 'a.c_one': '{count} item', 'a.c_other': '{count} items' }
    const ok = { 'a.x': 'Y {n}', 'a.c_one': '{count} a', 'a.c_two': '{count} b', 'a.c_other': '{count} c' }
    it('accepts extra plural forms of a language', () => expect(problems(en, ok, 'ar')).toEqual([]))
    it('fails on a missing key', () => expect(problems(en, { 'a.c_other': '{count}', 'a.c_one': '{count}' }, 'de')[0]).toMatch(/de: a is missing "a.x"/))
    it('fails on an empty value', () => expect(problems(en, { ...ok, 'a.x': ' ' }, 'fi')[0]).toMatch(/"a.x" is empty/))
    it('fails when placeholders differ', () => expect(problems(en, { ...ok, 'a.x': 'Y' }, 'fr')[0]).toMatch(/placeholders/))
    it('fails on a plural group without _other', () => expect(problems({ 'a.c_other': '{count}' }, { 'a.c_one': '{count}' }, 'de').join()).toMatch(/no _other/))
  })
})
