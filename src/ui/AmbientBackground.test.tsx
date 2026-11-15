import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider, LOCALES, translate } from '../i18n'
import HistoryView from '../views/HistoryView'
import AnalyzingView from '../views/AnalyzingView'
import HomeView from '../views/HomeView'
import { AmbientBackground } from './AmbientBackground'

describe('AmbientBackground', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })))
    window.history.replaceState(null, '', '/')
    localStorage.clear()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('is one hidden container of glows, cards and a veil, in that order', () => {
    const { container } = render(<AmbientBackground />)
    const layers = container.querySelectorAll('.ambient-bg')
    expect(layers).toHaveLength(1)
    expect(layers[0]).toHaveAttribute('aria-hidden', 'true')
    expect([...layers[0].children].map((c) => c.className)).toEqual(['ambient-glows', 'ambient-cards', 'ambient-veil'])
    expect(layers[0].querySelectorAll('.ambient-glows > .ambient-glow')).toHaveLength(4)
    const cards = layers[0].querySelectorAll('.ambient-cards > .ambient-card')
    expect(cards.length).toBeGreaterThanOrEqual(4)
    expect(cards.length).toBeLessThanOrEqual(6)
    expect(layers[0].querySelector('.ambient-glows')!.children).toHaveLength(4)
    expect(layers[0].querySelector('.ambient-cards')!.children).toHaveLength(cards.length)
  })

  it('has demo cards with a highlight and technique badge, and a neutral card', () => {
    const { container } = render(<AmbientBackground />)
    const demo = [...container.querySelectorAll('.ambient-card')].filter((c) => c.querySelector('.ambient-hl') && c.querySelector('.ambient-badge'))
    expect(demo.length).toBeGreaterThanOrEqual(2)
    const names = ['Appeal_to_fear-prejudice', 'Loaded_Language', 'Exaggeration,Minimisation'].map((id) => translate('en', `techniques.${id}.name`))
    for (const c of demo) expect(names).toContain(c.querySelector('.ambient-badge')!.textContent)
    const neutral = [...container.querySelectorAll('.ambient-card')].filter((c) => !c.querySelector('.ambient-hl') && c.querySelector('.ambient-badge')?.textContent === 'No strong signals')
    expect(neutral.length).toBeGreaterThanOrEqual(1)
  })

  it('has no focusable or tabindex descendants and each card text uses dir=auto', () => {
    const { container } = render(<AmbientBackground />)
    expect(container.querySelector('a, button, input, textarea, select, [tabindex], [contenteditable]')).toBeNull()
    for (const p of container.querySelectorAll('.ambient-text')) expect(p).toHaveAttribute('dir', 'auto')
  })

  it('shows no digits as scores or confidence', () => {
    const { container } = render(<AmbientBackground />)
    expect(container.textContent).not.toMatch(/\d|%/)
  })

  it('takes every card text from the ambient catalog in en and de', () => {
    for (const lng of ['en', 'de'] as const) {
      localStorage.setItem('veil.locale', lng)
      const { container, unmount } = render(<I18nProvider><AmbientBackground /></I18nProvider>)
      const text = container.textContent!
      for (const n of [1, 2, 3, 4, 5, 6]) {
        expect(text).toContain(translate(lng, `ambient.card.${n}.source`))
        expect(text).toContain(translate(lng, `ambient.card.${n}.meta`))
        expect(container.querySelectorAll('.ambient-text')[n - 1].textContent).toBe(translate(lng, `ambient.card.${n}.text`))
      }
      expect(container.querySelector('.ambient-hl')!.textContent).toBe(translate(lng, 'ambient.card.1.phrase'))
      expect(container.querySelector('.ambient-badge-neutral')!.textContent).toBe(translate(lng, 'ambient.no_signals'))
      expect(container.querySelector('.ambient-badge')!.textContent).toBe(translate(lng, 'techniques.Appeal_to_fear-prejudice.name'))
      unmount()
    }
    expect(translate('en', 'ambient.no_signals')).toBe('No strong signals')
    expect(translate('de', 'ambient.no_signals')).not.toBe('No strong signals')
  })

  it('keeps each highlighted phrase a substring of its card text in every locale', () => {
    for (const { code } of LOCALES)
      for (const n of [1, 2, 5]) expect(translate(code, `ambient.card.${n}.text`), `${code} card ${n}`).toContain(translate(code, `ambient.card.${n}.phrase`))
  })

  it('is mounted by HomeView as a sibling directly before section.view', () => {
    const { container } = render(<HomeView />)
    expect(container.querySelectorAll('.ambient-bg')).toHaveLength(1)
    expect(container.querySelector('.ambient-bg')!.nextElementSibling).toBe(container.querySelector('section.view'))
    expect(container.querySelector('.view .ambient-bg')).toBeNull()
  })

  it('leaves no other decorative layer behind HomeView: no .noise-headline anywhere', () => {
    const { container } = render(<HomeView />)
    expect(container.querySelector('.noise-headline, [class*="noise-"]')).toBeNull()
    expect(container.querySelector('.ambient-bg')!.previousElementSibling).toBeNull()
  })

  it.each([
    ['HistoryView', <HistoryView />],
    ['AnalyzingView', <AnalyzingView id="j1" />],
  ])('is not rendered by %s', (_name, view) => {
    const { container } = render(view)
    expect(container.querySelector('.ambient-bg')).toBeNull()
  })
})
