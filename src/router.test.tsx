import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { matchRoute } from './router'

beforeEach(() => vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {}))))
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

describe('routes render their stub view in the shell', () => {
  it.each([
    ['/', 'Home'],
    ['/jobs/j1/live', 'Analyzing'],
    ['/jobs/j1/detail', 'Detail'],
    ['/history', 'History'],
    ['/explore', 'Explore'],
    ['/explore/region', 'Region'],
    ['/ask', 'Ask'],
    ['/settings', 'Settings'],
    ['/states', 'States'],
    ['/unknown', 'Home'],
  ])('%s', (path, heading) => {
    open(path)
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
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
    expect(screen.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument()
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
    expect(screen.getByRole('heading', { level: 1, name: 'History' })).toBeInTheDocument()
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
