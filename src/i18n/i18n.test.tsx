import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Shell } from '../ui/Shell'
import HomeView from '../views/HomeView'
import { errorMessage } from '../api/errors'
import { I18nProvider, formatCountryName, formatNumber, formatPercent, formatRelativeTime, rich, useFormat, useLocale, useT } from '.'
import { CATALOGS, MISSING, pluralCategory, translate } from './translate'

const setLanguages = (langs: string[]) => vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue(langs)

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', '/')
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"status":"ok"}')))
  setLanguages(['en-US'])
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.documentElement.lang = 'en'
  document.documentElement.dir = 'ltr'
})

const app = () => (
  <I18nProvider>
    <Shell>
      <HomeView />
    </Shell>
  </I18nProvider>
)
const select = () => screen.getByRole('combobox')
const pick = (code: string) => fireEvent.change(select(), { target: { value: code } })

describe('language selector', () => {
  it('lists the native labels, is not mock, and is focusable', async () => {
    render(app())
    expect([...select().querySelectorAll('option')].map((o) => o.textContent)).toEqual(['English', 'Français', 'العربية', 'Deutsch', 'Suomi'])
    expect(select().closest('[data-mock]')).toBeNull()
    expect(select().querySelector('option[value=ar]')).toHaveAttribute('lang', 'ar')
    expect(screen.getByRole('combobox', { name: 'Language' })).toBe(select())
    select().focus()
    expect(select()).toHaveFocus()
    await screen.findByText('Backend online')
  })

  it('re-renders nav and Home in German without reload and persists the choice', async () => {
    const { unmount } = render(app())
    pick('de')
    expect(screen.getByRole('link', { name: 'Analysieren' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Verlauf' })).toBeInTheDocument()
    expect(screen.getByText('Sehen Sie hinter das Narrativ.')).toBeInTheDocument()
    expect(screen.getByText('0 Zeichen')).toBeInTheDocument()
    expect(localStorage.getItem('veil.locale')).toBe('de')
    unmount()
    render(app()) // reload
    expect(select()).toHaveValue('de')
    expect(screen.getByRole('link', { name: 'Entdecken' })).toBeInTheDocument()
    await screen.findByText('Backend online')
  })

  it('does not render the Auto-detect chip', () => {
    render(app())
    expect(screen.queryByText(/Auto-detect/)).toBeNull()
  })

  it('sets html lang and dir, rtl only for Arabic', () => {
    render(app())
    expect(document.documentElement).toHaveAttribute('dir', 'ltr')
    pick('ar')
    expect(document.documentElement).toHaveAttribute('lang', 'ar')
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    pick('fr')
    expect(document.documentElement).toHaveAttribute('lang', 'fr')
    expect(document.documentElement).toHaveAttribute('dir', 'ltr')
  })
})

describe('Home errors follow the language', () => {
  it('re-translates the invalid-link error after a language switch', () => {
    render(app())
    fireEvent.click(screen.getByRole('tab', { name: 'Social Link' }))
    fireEvent.change(screen.getByLabelText('Content to analyze'), { target: { value: 'not a url' } })
    fireEvent.click(screen.getByRole('button', { name: /^Analyze/ }))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a full link starting with http:// or https://.')
    pick('de')
    expect(screen.getByRole('alert')).toHaveTextContent('Geben Sie einen vollständigen Link ein')
  })

  it('marks the submit glyph aria-hidden and mirrorable', () => {
    render(app())
    expect(screen.getByRole('button', { name: 'Analyze' }).querySelector('.mirror-rtl')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('initial locale', () => {
  const current = () => {
    const Probe = () => <span data-testid="l">{useLocale().locale}</span>
    render(<I18nProvider><Probe /></I18nProvider>)
    return screen.getByTestId('l').textContent
  }
  it('uses the first supported navigator language by primary subtag', () => {
    setLanguages(['ja', 'fi-FI', 'de'])
    expect(current()).toBe('fi')
  })
  it('falls back to en for unsupported languages', () => {
    setLanguages(['ja'])
    expect(current()).toBe('en')
  })
  it('prefers a valid stored value and ignores an invalid one', () => {
    setLanguages(['fi-FI'])
    localStorage.setItem('veil.locale', 'xx')
    expect(current()).toBe('fi')
  })
  it('adopts a valid legacy stiriri.locale and migrates it', () => {
    localStorage.setItem('stiriri.locale', 'de')
    expect(current()).toBe('de')
    expect(localStorage.getItem('veil.locale')).toBe('de')
    expect(localStorage.getItem('stiriri.locale')).toBeNull()
  })
  it('prefers veil.locale over the legacy key', () => {
    localStorage.setItem('stiriri.locale', 'de')
    localStorage.setItem('veil.locale', 'fi')
    expect(current()).toBe('fi')
  })
  it('ignores an invalid legacy value', () => {
    setLanguages(['fi-FI'])
    localStorage.setItem('stiriri.locale', 'xx')
    expect(current()).toBe('fi')
  })
  it('names the product VEIL in the catalogs, inflected where needed', () => {
    expect(CATALOGS.de['results.ask']).toBe('VEIL fragen')
    expect(CATALOGS.fi['results.ask']).toBe('Kysy VEILiltä')
    expect(CATALOGS.fr['results.ask']).toBe('Demander à VEIL')
    expect(CATALOGS.ar['results.ask']).toBe('اسأل VEIL')
  })
  it('keeps working when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied') })
    const Probe = () => {
      const { locale, setLocale } = useLocale()
      return <button onClick={() => setLocale('de')}>{locale}</button>
    }
    render(<I18nProvider><Probe /></I18nProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'en' }))
    expect(screen.getByRole('button', { name: 'de' })).toBeInTheDocument()
  })
})

describe('translate', () => {
  it('interpolates and picks plural forms', () => {
    expect(translate('en', 'home.chars', { count: 1 })).toBe('1 char')
    expect(translate('en', 'home.chars', { count: 3 })).toBe('3 chars')
    expect(translate('ar', 'home.chars', { count: 2 })).toBe('2 حرفان')
    expect(translate('ar', 'home.chars', { count: 5 })).toBe('5 أحرف')
    expect(translate('en', 'common.errors.unknown_analyzer', { ids: 'a, b' })).toBe('Unknown analyzer: a, b.')
  })
  describe('missing keys', () => {
    const cats = { en: { 'x.a': 'A', 'x.b': 'B', 'x.c': 'C' }, de: { 'x.a': 'Ä', 'x.c': '' } }
    it('fall back to en, treat an empty value as missing, and never return the key', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      expect(translate('de', 'x.a', undefined, cats)).toBe('Ä')
      expect(translate('de', 'x.b', undefined, cats)).toBe('B')
      expect(translate('de', 'x.c', undefined, cats)).toBe('C')
      for (const out of [translate('de', 'x.zzz', undefined, cats), translate('xx' as never, 'x.zzz', undefined, cats)]) {
        expect(out).toBe(MISSING)
        expect(out).not.toBe('x.zzz')
      }
    })
    it('warn once per locale and key in development, naming both', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      translate('de', 'w.once', undefined, cats)
      translate('de', 'w.once', undefined, cats)
      translate('fi', 'w.once', undefined, cats)
      expect(warn).toHaveBeenCalledTimes(2)
      expect(warn.mock.calls[0][0]).toContain('"w.once"')
      expect(warn.mock.calls[0][0]).toContain('"de"')
    })
    it('never render a raw key, undefined or null in the UI', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      const Probe = () => <p>{useT()('nope.missing')}</p>
      const { container } = render(<I18nProvider><Probe /></I18nProvider>)
      expect(container).toHaveTextContent('…')
      expect(container.textContent).not.toMatch(/nope|undefined|null/)
    })
  })
  it('useT re-renders when the locale changes', () => {
    const Probe = () => {
      const t = useT()
      const { setLocale } = useLocale()
      return <button onClick={() => setLocale('fi')}>{t('shell.account')}</button>
    }
    render(<I18nProvider><Probe /></I18nProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'Account' }))
    expect(screen.getByRole('button', { name: 'Tili' })).toBeInTheDocument()
  })
})

describe('errorMessage', () => {
  it('is translated for known codes and unchanged for unknown ones', () => {
    const Probe = () => {
      const { setLocale } = useLocale()
      return <button onClick={() => setLocale('de')}>go</button>
    }
    render(<I18nProvider><Probe /></I18nProvider>)
    fireEvent.click(screen.getByRole('button'))
    expect(errorMessage({ code: 'not_found', message: 'x', status: 404 })).toBe('Nicht gefunden. Die Analyse wurde möglicherweise entfernt.')
    expect(errorMessage({ code: 'scrape_unavailable', message: 'server says', status: 502 })).toBe('server says')
  })
})

describe('formatters', () => {
  it('format with the given locale', () => {
    expect(formatNumber(1234.5, undefined, 'de')).toBe('1.234,5')
    const now = Date.parse('2026-01-02T00:00:00Z')
    expect(formatRelativeTime('2026-01-01T21:00:00Z', now, 'en')).toBe('3 hours ago')
    expect(formatRelativeTime('2026-01-01T00:00:00Z', now, 'en')).toBe('yesterday')
  })
})

describe('useFormat', () => {
  it('binds the formatters to the active locale', () => {
    const Probe = () => {
      const f = useFormat()
      const { setLocale } = useLocale()
      return (
        <>
          <button onClick={() => setLocale('de')}>de</button>
          <output>{[f.formatNumber(1234.5), f.formatDate('2026-03-05T12:00:00Z', { dateStyle: 'long', timeZone: 'UTC' }), f.formatRelativeTime('2026-01-01T21:00:00Z', '2026-01-02T00:00:00Z')].join('|')}</output>
        </>
      )
    }
    render(<I18nProvider><Probe /></I18nProvider>)
    expect(screen.getByRole('status')).toHaveTextContent('1,234.5|March 5, 2026|3 hours ago')
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('status')).toHaveTextContent('1.234,5|5. März 2026|vor 3 Stunden')
  })

  it('defaults the standalone formatters to the active locale', () => {
    const Probe = () => {
      const { setLocale } = useLocale()
      return <button onClick={() => setLocale('fr')}>x</button>
    }
    render(<I18nProvider><Probe /></I18nProvider>)
    fireEvent.click(screen.getByRole('button'))
    expect(formatNumber(1234.5)).toBe(formatNumber(1234.5, undefined, 'fr'))
    expect(formatRelativeTime('2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z')).toBe('hier')
  })
})

describe('Intl helpers', () => {
  it('formats percentages per locale', () => {
    expect(formatPercent(0.86, undefined, 'en')).toBe('86%')
    expect(formatPercent(0.86, undefined, 'fr')).toMatch(/^86\s%$/)
    expect(formatPercent(0.86, undefined, 'ar')).not.toMatch(/[A-Za-z]/)
  })
  it('selects every Arabic plural category', () => {
    expect([0, 1, 2, 3, 11, 100].map((n) => pluralCategory(n, 'ar'))).toEqual(['zero', 'one', 'two', 'few', 'many', 'other'])
  })
  it('names countries in the locale and falls back to the given name', () => {
    expect(formatCountryName('FI', 'Finland', 'fr')).toBe('Finlande')
    expect(formatCountryName('FI', 'Finland', 'ar')).toBe('فنلندا')
    expect(formatCountryName('ZZZZ', 'Nowhere', 'fr')).toBe('Nowhere')
    vi.spyOn(Intl, 'DisplayNames').mockImplementation(() => { throw new Error('no ICU') })
    expect(formatCountryName('FI', 'Finland', 'sw')).toBe('Finland')
  })
  it('rich puts nodes in the placeholders and keeps the rest of the sentence', () => {
    render(<p>{rich('Claim: {claim}.', { claim: <bdi>x</bdi> })}</p>)
    expect(screen.getByText('x').tagName).toBe('BDI')
    expect(screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === 'Claim: x.')).toBeInTheDocument()
  })
})
