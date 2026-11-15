import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { matchRoute, navFor, navigate } from './router'

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
  vi.stubGlobal('WebSocket', class { close() {} }) // the live view opens an event stream
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  window.history.replaceState(null, '', '/')
})

const open = (url: string) => {
  window.history.replaceState(null, '', url)
  return render(<App />)
}
const nav = (name: string) => screen.getByRole('link', { name })
const activeTabs = () =>
  screen.getAllByRole('link').filter((a) => a.closest('nav') && a.classList.contains('active')).map((a) => a.textContent)

describe('matchRoute', () => {
  it.each([
    ['/', { name: 'home' }],
    ['/jobs/abc/live', { name: 'analyzing', id: 'abc' }],
    ['/jobs/abc', { name: 'results', id: 'abc' }],
    ['/jobs/x/detail', { name: 'home' }], // redirected before the route is read; no detail route
    ['/history', { name: 'history' }],
    ['/explore', { name: 'explore' }],
    ['/explore/region', { name: 'region' }],
    ['/ask', { name: 'ask' }],
    ['/jobs/abc/ask', { name: 'ask', id: 'abc' }],
    ['/jobs/a%20b/ask', { name: 'ask', id: 'a b' }],
    ['/settings', { name: 'home' }],
    ['/settings/x', { name: 'home' }],
    ['/states', { name: 'states' }],
    ['/history/', { name: 'history' }],
    ['/docs/api', { name: 'api-docs' }],
    ['/docs/api/', { name: 'api-docs' }],
    ['/docs', { name: 'home' }],
    ['/nope', { name: 'home' }],
    ['/jobs/abc/extra', { name: 'home' }],
    ['/jobs/%E0%A4%A', { name: 'home' }],
  ])('%s', (path, route) => expect(matchRoute(path)).toEqual(route))
})

describe('matchRoute /explore job parameter', () => {
  it.each([
    ['?job=abc', 'abc'],
    ['?x=1&job=a%20b', 'a b'],
    ['?job=%E0%A4%A', undefined], // malformed escape counts as absent
    ['?job=', undefined],
    ['', undefined],
  ])('%s', (search, id) => expect(matchRoute('/explore', search)).toEqual({ name: 'explore', id }))
  it('ignores job on other routes', () => expect(matchRoute('/history', '?job=abc')).toEqual({ name: 'history' }))
})

describe('routes render their stub view in the shell', () => {
  it.each<[string, string | RegExp, number?]>([
    ['/', 'See beyond the narrative.'],
    ['/jobs/j1/live', 'Analyzing your content...', 2],
    ['/history', 'Analysis History'],
    ['/explore', 'Explore the world.'],
    ['/explore/region', 'Explore the world.'],
    ['/ask', /^Ask VEIL/],
    ['/jobs/j1/ask', /^Ask VEIL/],
    ['/settings', 'See beyond the narrative.'],
    ['/states', 'Edge Cases & System States'],
    ['/docs/api', 'Public API'],
    ['/docs/api/', 'Public API'],
    ['/unknown', 'See beyond the narrative.'],
  ])('%s', (path, heading, level = 1) => {
    open(path)
    expect(screen.getByRole('heading', { level, name: heading })).toBeInTheDocument()
    expect(screen.getByRole('banner')).toHaveTextContent('VEIL / Intelligence')
  })

  it('/jobs/:id shows the job result view for that id', () => {
    open('/jobs/j%201')
    expect(vi.mocked(fetch).mock.calls.map((c) => c[0])).toContain('/api/v1/jobs/j%201')
  })
})

describe('legacy ?job link', () => {
  it('replaces the URL with /jobs/<id> (encoded) without a reload', () => {
    open('/?job=a%20b')
    expect(window.location.pathname + window.location.search).toBe('/jobs/a%20b')
    expect(vi.mocked(fetch).mock.calls.map((c) => c[0])).toContain('/api/v1/jobs/a%20b')
  })

  it('keeps Home for an empty id', () => {
    open('/?job=')
    expect(window.location.search).toBe('?job=')
    expect(screen.getByRole('heading', { level: 1, name: 'See beyond the narrative.' })).toBeInTheDocument()
  })
})

describe('legacy /jobs/:id/detail link', () => {
  it.each(['/jobs/a%20b/detail', '/jobs/a%20b/detail/'])('replaces %s with /jobs/a%%20b on init and renders Results', (url) => {
    open(`${url}?x=1`)
    expect(window.location.pathname + window.location.search).toBe('/jobs/a%20b?x=1')
    expect(vi.mocked(fetch).mock.calls.map((c) => c[0])).toContain('/api/v1/jobs/a%20b')
    expect(screen.queryByRole('heading', { name: 'Detailed analysis' })).toBeNull()
  })

  it('is replaced after navigate() and on popstate', () => {
    open('/')
    act(() => navigate('/jobs/a%20b/detail/'))
    expect(window.location.pathname).toBe('/jobs/a%20b')
    window.history.pushState(null, '', '/jobs/a%20b/detail') // a stale entry reached via Back/Forward
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(window.location.pathname).toBe('/jobs/a%20b')
  })
})

describe('navigation', () => {
  it.each([
    ['/', ['Analyze']],
    ['/jobs/j1', ['Analyze']],
    ['/jobs/j1/live', ['Analyze']],
    ['/ask', ['Analyze']],
    ['/jobs/j1/ask', ['Analyze']],
    ['/states', ['Analyze']],
    ['/explore', ['Explore']],
    ['/explore/region', ['Explore']],
    ['/history', ['History']],
    ['/settings', ['Analyze']],
  ])('active tab for %s', (path, expected) => {
    open(path)
    expect(activeTabs()).toEqual(expected)
  })

  it('has the History label without a count and the expected targets', () => {
    open('/')
    expect(nav('History')).toHaveAttribute('href', '/history')
    expect(screen.queryByRole('link', { name: /New Analysis/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /New Analysis/ })).toBeNull()
    expect(nav('Analyze')).toHaveAttribute('href', '/')
    expect(screen.queryByRole('link', { name: 'Account' })).toBeNull()
    expect(document.querySelector('a[href="/settings"], .avatar')).toBeNull()
    expect(screen.getByRole('link', { name: /VEIL/ })).toHaveAttribute('href', '/')
  })

  it('client-navigates on click, scrolls to the top and follows back/forward', () => {
    open('/')
    fireEvent.click(nav('History'))
    expect(window.location.pathname).toBe('/history')
    expect(screen.getByRole('heading', { level: 1, name: 'Analysis History' })).toBeInTheDocument()
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
    act(() => {
      window.history.back()
    })
  })

  it('leaves modified clicks to the browser', () => {
    open('/')
    document.addEventListener('click', (e) => e.preventDefault(), { once: true }) // jsdom cannot navigate
    fireEvent.click(nav('History'), { ctrlKey: true })
    expect(window.location.pathname).toBe('/')
  })
})

describe('Integrate API button', () => {
  it('follows the History link and links to /docs/api', () => {
    open('/')
    const links = screen.getAllByRole('link')
    const button = nav('Integrate API')
    expect(links[links.indexOf(nav('History')) + 1]).toBe(button)
    expect(button).toHaveAttribute('href', '/docs/api')
    expect(button).not.toHaveAttribute('aria-current')
    expect(button).not.toHaveClass('active')
  })

  it('opens the docs client-side with no tab active and aria-current on the button', () => {
    open('/')
    fireEvent.click(nav('Integrate API'))
    expect(window.location.pathname).toBe('/docs/api')
    expect(screen.getByRole('heading', { level: 1, name: 'Public API' })).toBeInTheDocument()
    expect(activeTabs()).toEqual([])
    expect(nav('Integrate API')).toHaveAttribute('aria-current', 'page')
  })

  it('has no active tab on /docs/api/ and navFor is null', () => {
    open('/docs/api/')
    expect(activeTabs()).toEqual([])
    expect(navFor('api-docs')).toBeNull()
  })

  it('leaves the other routes alone', () => {
    open('/history')
    expect(activeTabs()).toEqual(['History'])
    expect(nav('Integrate API')).not.toHaveAttribute('aria-current')
  })
})
