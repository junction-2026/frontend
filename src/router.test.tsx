import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { matchRoute } from './router'

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
    ['/jobs/a%20b/detail', { name: 'detail', id: 'a b' }],
    ['/history', { name: 'history' }],
    ['/explore', { name: 'explore' }],
    ['/explore/region', { name: 'region' }],
    ['/ask', { name: 'ask' }],
    ['/settings', { name: 'settings' }],
    ['/states', { name: 'states' }],
    ['/history/', { name: 'history' }],
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
    ['/jobs/j1/detail', 'Detailed analysis'],
    ['/history', 'Analysis History'],
    ['/explore', 'Explore the world.'],
    ['/explore/region', 'Explore the world.'],
    ['/ask', /^Ask VEIL/],
    ['/settings', 'Settings & Methodology'],
    ['/states', 'Edge Cases & System States'],
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

describe('navigation', () => {
  it.each([
    ['/', ['Analyze']],
    ['/jobs/j1', ['Analyze']],
    ['/jobs/j1/live', ['Analyze']],
    ['/ask', ['Analyze']],
    ['/states', ['Analyze']],
    ['/explore', ['Explore']],
    ['/explore/region', ['Explore']],
    ['/history', ['History']],
    ['/settings', []],
  ])('active tab for %s', (path, expected) => {
    open(path)
    expect(activeTabs()).toEqual(expected)
  })

  it('has the History label without a count and the expected targets', () => {
    open('/')
    expect(nav('History')).toHaveAttribute('href', '/history')
    expect(nav('+ New Analysis')).toHaveAttribute('href', '/')
    expect(nav('Account')).toHaveAttribute('href', '/settings')
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
