import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../App'
import { job, json } from '../../job/fixtures'
import ExploreView from '../../views/ExploreView'
import { STEP_COLORS } from './scale'

const tech = (name: string, analyses: number) => ({ name, display: name.replace('_', ' '), analyses, extra: 1 })
const COUNTRIES = {
  analyses: 13,
  items: [
    { country_code: 'DE', country: 'Germany', analyses: 1, techniques: [tech('Doubt', 1)], extra: true },
    { country_code: 'RU', country: 'Russia', analyses: 12, techniques: [tech('Loaded_Language', 12), tech('Doubt', 5), tech('Repetition', 3), tech('Flag-Waving', 1)] },
  ],
}
const item = (n: number, extra: Record<string, unknown> = {}) => ({
  job_id: `job-${n}`, created_at: '2026-11-10T10:00:00Z', finished_at: '2026-11-10T10:00:03Z', status: 'completed', country_code: 'RU', country: 'Russia', countries: [{ country_code: 'RU', country: 'Russia', basis: ['outlet'] }],
  outlet: { name: `Outlet ${n}`, domain: 'o.ru', country_code: 'RU', country: 'Russia' }, source: { url: 'https://o.ru/a', title: `Title ${n}` },
  snippet: `Snippet ${n}`, techniques: [{ name: 'Doubt', display: 'Doubt', strength: 'weak' }, { name: 'Repetition', display: 'Repetition' }], verdict: 'detected', ...extra,
})

const fetchMock = vi.fn()
let countries: () => Promise<Response>
let analyses: (url: string) => Promise<Response>
beforeEach(() => {
  countries = () => Promise.resolve(json(COUNTRIES))
  analyses = () => Promise.resolve(json({ items: [item(1), item(2, { source: { url: 'u', title: null }, verdict: null, snippet: '<b>raw</b> snippet' })], next_cursor: null }))
  fetchMock.mockImplementation((url: string) => {
    const u = String(url)
    if (u === '/api/v1/map/countries') return countries()
    if (u.startsWith('/api/v1/map/countries/')) return analyses(u)
    if (u.startsWith('/api/v1/jobs/')) return Promise.resolve(json(job({ id: 'j1' })))
    return new Promise(() => {})
  })
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  cleanup()
  fetchMock.mockReset()
  vi.unstubAllGlobals()
  window.history.replaceState(null, '', '/')
})

const path = (code: string) => document.querySelector<SVGPathElement>(`path[data-code="${code}"]`)!
const urls = () => fetchMock.mock.calls.map((c) => String(c[0])).filter((u) => u.startsWith('/api/v1/map') || u.startsWith('/api/v1/jobs'))
const show = async () => {
  render(<ExploreView />)
  await waitFor(() => expect(path('RU')).toHaveAttribute('fill', STEP_COLORS[4]))
}
const openRu = async () => {
  await show()
  fireEvent.click(path('RU'))
  return screen.findByRole('region', { name: 'Russia' })
}

describe('global propaganda map', () => {
  it('requests only the countries endpoint without a job and shades monotonically with a legend', async () => {
    window.history.replaceState(null, '', '/explore')
    render(<App />)
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
    await waitFor(() => expect(path('RU')).toHaveAttribute('fill', STEP_COLORS[4]))
    expect(urls()).toEqual(['/api/v1/map/countries'])
    expect(path('DE')).toHaveAttribute('fill', STEP_COLORS[0])
    expect(path('FR')).toHaveAttribute('fill', '#E9EDF2') // absent: unshaded
    const legend = screen.getByRole('group', { name: 'Analyses per country:' })
    expect(legend).toHaveTextContent('1')
    expect(legend).toHaveTextContent('12')
    expect(legend).toHaveTextContent('None')
  })

  it('keeps /explore?job=<id> on the job view and never requests the map', async () => {
    window.history.replaceState(null, '', '/explore?job=j1')
    render(<App />)
    await screen.findByRole('img', { name: 'World coverage map' })
    expect(urls().every((u) => u.startsWith('/api/v1/jobs/'))).toBe(true)
    expect(screen.queryByRole('group', { name: 'Analyses per country:' })).toBeNull()
  })

  it('shows a tooltip on hover with the localized name, count wording and the top 3 techniques', async () => {
    await show()
    fireEvent.pointerEnter(path('RU'), { clientX: 10, clientY: 10 })
    const tip = screen.getByRole('tooltip')
    expect(tip).toHaveTextContent('Russia')
    expect(tip).toHaveTextContent('12 analyses associated with Russia')
    expect(tip).toHaveTextContent('Top techniques: Loaded Language (12), Doubt (5), Repetition (3)')
    expect(tip).not.toHaveTextContent('Flag-Waving')
    expect(tip).not.toHaveTextContent(/propaganda by/i)
    fireEvent.pointerLeave(path('RU'))
    fireEvent.pointerEnter(path('DE'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('1 analysis associated with Germany')
    fireEvent.pointerEnter(path('FR'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('No analyses with detected techniques')
  })

  it('shows the tooltip on keyboard focus, described by aria-describedby, and opens the panel with Enter and Space', async () => {
    await show()
    expect(path('RU')).toHaveAttribute('tabindex', '0')
    expect(path('RU')).toHaveAttribute('aria-label', 'Russia')
    act(() => path('RU').focus())
    const tip = screen.getByRole('tooltip')
    expect(path('RU')).toHaveAttribute('aria-describedby', tip.id)
    expect(tip).toHaveTextContent('12 analyses')
    fireEvent.keyDown(path('RU'), { key: 'Enter' })
    expect(await screen.findByRole('region', { name: 'Russia' })).toBeInTheDocument()
    fireEvent.keyDown(path('DE'), { key: ' ' })
    expect(await screen.findByRole('region', { name: 'Germany' })).toBeInTheDocument()
    expect(urls()).toContain('/api/v1/map/countries/DE/analyses?limit=20')
  })

  it('lists analyses with title or snippet, outlet, date, chips, strength only when present, verdict, linking by job_id', async () => {
    const panel = await openRu()
    expect(urls()).toContain('/api/v1/map/countries/RU/analyses?limit=20')
    const first = await within(panel).findByRole('link', { name: 'Title 1' })
    expect(first).toHaveAttribute('href', '/jobs/job-1')
    const [li1, li2] = within(panel).getAllByRole('listitem').filter((li) => li.classList.contains('related-card'))
    expect(li1).toHaveTextContent('Outlet 1')
    expect(li1).toHaveTextContent('Nov 10, 2026')
    expect(li1).toHaveTextContent('Manipulation detected')
    expect(within(li1).getByText('Doubt').closest('li')).toHaveTextContent('Doubt · weak')
    expect(within(li1).getByText('Repetition').closest('li')).toHaveTextContent(/^Repetition$/) // no strength: no indicator
    expect(within(li2).getByRole('link', { name: '<b>raw</b> snippet' })).toHaveAttribute('href', '/jobs/job-2') // snippet when title null, as text
    expect(li2.querySelector('b')).toBeNull()
    expect(li2).not.toHaveTextContent('Manipulation')
  })

  it('shows the other associated countries of a multi-country item as plain text, never the panel country', async () => {
    analyses = () => Promise.resolve(json({ items: [item(1, { countries: [
      { country_code: 'RU', country: 'Russia', basis: ['outlet', 'content'] },
      { country_code: 'UA', country: 'Ukraine', basis: ['content', 'future'] },
      { country_code: 'QQ', country: '<b>Zedland</b>', basis: [] },
      { country_code: 'QR', country: '', basis: ['content'] },
      { country_code: '', country: 'Nowhere', basis: ['content'] },
    ] })], next_cursor: null }))
    const panel = await openRu()
    const li = (await within(panel).findByRole('link', { name: 'Title 1' })).closest('li')!
    expect(li).toHaveTextContent('Also associated with: Ukraine, <b>Zedland</b>, QR')
    expect(li.querySelector('b')).toBeNull()
    expect(li.textContent).not.toMatch(/Also associated with:.*Russia/)
  })

  it('shows no other-countries line for a single-country item', async () => {
    const panel = await openRu()
    await within(panel).findByRole('link', { name: 'Title 1' })
    expect(within(panel).queryByText(/Also associated with/)).toBeNull()
  })

  it('shows a pasted-text item (outlet null, url "") without outlet or URL text, linked by job_id, title falling back to the snippet', async () => {
    analyses = () => Promise.resolve(json({ items: [item(7, { outlet: null, source: { url: '', title: null }, snippet: 'Pasted words', countries: [{ country_code: 'RU', country: 'Russia', basis: ['content'] }] })], next_cursor: null }))
    const panel = await openRu()
    const link = await within(panel).findByRole('link', { name: 'Pasted words' })
    expect(link).toHaveAttribute('href', '/jobs/job-7')
    expect(within(panel).getAllByRole('link')).toHaveLength(1)
    const li = link.closest('li')!
    expect(li).toHaveTextContent(/^Pasted words/)
    expect(li.querySelector('.related-meta span')).toHaveTextContent('Nov 10, 2026') // the first meta entry is the date, no outlet before it
  })

  it('states the subtitle from the distinct top-level count, never the sum of items', async () => {
    countries = () => Promise.resolve(json({ analyses: 1, items: [{ country_code: 'RU', country: 'Russia', analyses: 1, techniques: [] }, { country_code: 'UA', country: 'Ukraine', analyses: 1, techniques: [] }] }))
    render(<ExploreView />)
    await waitFor(() => expect(path('RU')).toHaveAttribute('fill', STEP_COLORS[0]))
    expect(screen.getByText('1 analysis · 2 countries')).toBeInTheDocument()
  })

  it('words the lede, map title and note as associated countries, not outlet-only', async () => {
    await show()
    const head = document.querySelector('.view')!.textContent!
    expect(head).toContain('associated')
    expect(head).not.toMatch(/outlet country|by outlet|from their outlets|is placed in the country/i)
    expect(screen.getByText(/Notice: A country is one an analysis is associated with/)).toHaveTextContent('not a rating of the country')
  })

  it('pages with Load more following next_cursor', async () => {
    analyses = (u) => Promise.resolve(json(u.includes('cursor=c2') ? { items: [item(3)], next_cursor: null } : { items: [item(1), item(2)], next_cursor: 'c2' }))
    const panel = await openRu()
    fireEvent.click(await within(panel).findByRole('button', { name: 'Load more' }))
    await within(panel).findByRole('link', { name: 'Title 3' })
    expect(urls()).toContain('/api/v1/map/countries/RU/analyses?limit=20&cursor=c2')
    expect(within(panel).getAllByRole('link')).toHaveLength(3)
    expect(within(panel).queryByRole('button', { name: 'Load more' })).toBeNull()
  })

  it('closes with Escape or the close button and returns focus to the country', async () => {
    await openRu()
    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Russia' })).toBeNull())
    await waitFor(() => expect(document.activeElement).toBe(path('RU')))
    fireEvent.click(path('RU'))
    const panel = await screen.findByRole('region', { name: 'Russia' })
    act(() => (document.activeElement as HTMLElement).blur())
    fireEvent.click(within(panel).getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Russia' })).toBeNull())
    await waitFor(() => expect(document.activeElement).toBe(path('RU')))
  })

  it('shows an empty panel for a country without analyses', async () => {
    analyses = () => Promise.resolve(json({ items: [], next_cursor: null }))
    await show()
    fireEvent.click(path('FR'))
    const panel = await screen.findByRole('region', { name: 'France' })
    expect(await within(panel).findByText('No analyses with detected techniques for France.')).toBeInTheDocument()
  })

  it('shows an error with Retry for the countries request', async () => {
    countries = () => Promise.resolve(json({ error: { code: 'internal_error', message: 'boom' } }, 500))
    render(<ExploreView />)
    await screen.findByRole('alert')
    countries = () => Promise.resolve(json(COUNTRIES))
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(path('RU')).toHaveAttribute('fill', STEP_COLORS[4]))
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows an error with Retry for the analyses request, and for a failed Load more keeps the list', async () => {
    analyses = () => Promise.resolve(json({ error: { code: 'internal_error', message: 'boom' } }, 500))
    const panel = await openRu()
    await within(panel).findByRole('alert')
    analyses = () => Promise.resolve(json({ items: [item(1)], next_cursor: 'c2' }))
    fireEvent.click(within(panel).getByRole('button', { name: 'Retry' }))
    await within(panel).findByRole('link', { name: 'Title 1' })
    analyses = () => Promise.resolve(json({ error: { code: 'internal_error', message: 'boom' } }, 500))
    fireEvent.click(within(panel).getByRole('button', { name: 'Load more' }))
    expect(await within(panel).findByText('Could not load more analyses.')).toBeInTheDocument()
    expect(within(panel).getByRole('link', { name: 'Title 1' })).toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: 'Load more' })).toBeEnabled()
  })

  it('renders in Arabic with rtl and the Arabic plural forms', async () => {
    localStorage.setItem('veil.locale', 'ar')
    window.history.replaceState(null, '', '/explore')
    render(<App />)
    await waitFor(() => expect(path('RU')).toHaveAttribute('fill', STEP_COLORS[4]))
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    fireEvent.pointerEnter(path('DE'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('1 تحليل مرتبط بـ')
    fireEvent.pointerLeave(path('DE'))
    fireEvent.pointerEnter(path('RU'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('12 تحليلًا مرتبطًا بـ')
    localStorage.clear()
    document.documentElement.dir = 'ltr'
    document.documentElement.lang = 'en'
  })

  it('explains the empty map when there are no analyses', async () => {
    countries = () => Promise.resolve(json({ items: [], analyses: 0 }))
    render(<ExploreView />)
    expect(await screen.findByRole('status', { name: '' })).toHaveTextContent('Only analyses with detected techniques that could be associated with a country appear on this map.')
    expect(path('RU')).toHaveAttribute('fill', '#E9EDF2')
  })
})
