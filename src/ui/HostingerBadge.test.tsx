import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import emblem from '../assets/hostinger-emblem.svg'
import { CATALOGS } from '../i18n/translate'

const css = readFileSync('src/styles/hosting-badge.css', 'utf8')
const rules = (sel: string, src = css) => [...src.matchAll(new RegExp(`(?:^|\\n)\\s*${sel.replace(/[.]/g, '\\.')}\\s*{([^}]*)}`, 'g'))].map((m) => m[1]).join('\n')
const desktop = /@media \(min-width: 961px\)\s*{((?:[^{}]*{[^}]*})+)\s*}/.exec(css)![1]
const outside = css.replace(/@media[^{]*{(?:[^{}]*{[^}]*})+\s*}/g, '')

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers: { 'content-type': 'application/json' } })))
  localStorage.setItem('veil.locale', 'en')
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  localStorage.clear()
  window.history.replaceState(null, '', '/')
})

describe('HostingerBadge', () => {
  it.each(['/', '/explore', '/explore/region', '/history', '/ask', '/states'])('%s: exactly one external link named "Powered by Hostinger", outside the topbar', (path) => {
    window.history.replaceState(null, '', path)
    render(<App />)
    const links = screen.getAllByRole('link', { name: 'Powered by Hostinger' })
    expect(links).toHaveLength(1)
    const a = links[0]
    expect(a.getAttribute('href')).toMatch(/^https:\/\/www\.hostinger\.com\/?$/)
    expect(a).toHaveAttribute('target', '_blank')
    expect(a.getAttribute('rel')).toMatch(/noopener/)
    expect(a.getAttribute('rel')).toMatch(/noreferrer/)
    expect(a.closest('.topbar')).toBeNull()
    expect(a.parentElement).toHaveClass('app-shell')
    expect(a.parentElement!.lastElementChild).toBe(a)
  })

  it('shows a decorative emblem from the bundled asset', () => {
    render(<App />)
    const img = document.querySelector('.hosting-badge img')!
    expect(img).toHaveAttribute('alt', '')
    expect(img).toHaveAttribute('aria-hidden', 'true')
    expect(img.getAttribute('src')).toBe(emblem)
    expect(emblem).not.toMatch(/^https?:/)
    expect(Number(img.getAttribute('width')) / Number(img.getAttribute('height'))).toBe(1) // the SVG is 24x24
  })

  it.each([['de', 'Bereitgestellt von Hostinger'], ['ar', 'مدعوم من Hostinger'], ['fr', 'Propulsé par Hostinger'], ['fi', 'Palvelun tarjoaa Hostinger'], ['ru', 'Работает на Hostinger']])('%s: text %s, brand isolated in <bdi>', (lng, text) => {
    localStorage.setItem('veil.locale', lng)
    render(<App />)
    const a = document.querySelector<HTMLElement>('.hosting-badge')!
    expect(a).toHaveTextContent(text)
    expect(within(a).getByText('Hostinger').tagName).toBe('BDI')
  })

  it('switching the language selector updates the text', () => {
    render(<App />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'de' } })
    expect(screen.getByRole('link', { name: 'Bereitgestellt von Hostinger' })).toBeInTheDocument()
  })

  it('has the credits namespace in every locale, keeping the brand as a placeholder', () => {
    for (const l of ['en', 'fr', 'ar', 'de', 'fi', 'ru']) expect(CATALOGS[l]['credits.powered_by']).toContain('{brand}')
  })
})

describe('hosting-badge.css', () => {
  it('is hidden by default and inline-flex from 961px', () => {
    expect(rules('.hosting-badge', outside)).toContain('display: none')
    expect(rules('.hosting-badge', desktop)).toContain('display: inline-flex')
    expect(css).not.toMatch(/max-width/)
  })

  it('is fixed in the inline-end, block-end corner using logical properties only', () => {
    const r = rules('.hosting-badge', outside)
    for (const d of ['position: fixed', 'inset-block-end: 12px', 'inset-inline-end: 12px', 'z-index: 30']) expect(r).toContain(d)
    expect(css).not.toMatch(/(^|[\s{;])(left|right|top|bottom|margin-left|margin-right|padding-left|padding-right)\s*:/)
  })

  it('has 12px text, a pill with tokens, an unstretched emblem and a focus ring', () => {
    const r = rules('.hosting-badge', outside)
    expect(parseFloat(/font-size: ([\d.]+)rem/.exec(r)![1])).toBeGreaterThanOrEqual(0.75)
    for (const d of ['color: var(--ink-2)', 'background: var(--surface)', 'white-space: nowrap', 'border-radius: var(--radius-pill)']) expect(r).toContain(d)
    const img = rules('.hosting-badge img', outside)
    expect(img).toContain('width: auto')
    expect(img).toContain('object-fit: contain')
    expect(parseInt(/height: (\d+)px/.exec(img)![1])).toBeGreaterThanOrEqual(16)
    expect(parseInt(/height: (\d+)px/.exec(img)![1])).toBeLessThanOrEqual(20)
    expect(rules('.hosting-badge:focus-visible', outside)).toMatch(/outline: 2px solid/)
  })

  it('leaves room at the end of the page and has no animation', () => {
    expect(parseInt(/padding-block-end: (\d+)px/.exec(rules('.app-shell', desktop))![1])).toBeGreaterThanOrEqual(64)
    expect(css).not.toMatch(/animation|@keyframes|transform|pointer-events/)
  })
})
