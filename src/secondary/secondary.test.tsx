import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './../App'

const open = (url: string) => {
  window.history.replaceState(null, '', url)
  return render(<App />)
}
const mocked = (el: HTMLElement) => el.closest('[data-mock="true"]')
beforeEach(() => vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {}))))
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  window.history.replaceState(null, '', '/')
  localStorage.clear()
  document.documentElement.lang = 'en'
  document.documentElement.dir = 'ltr'
})

describe('Explore and Region', () => {
  it('keeps Explore unmarked and Region marked as mock, and Clear selection leads back to Explore', () => {
    open('/explore')
    expect(screen.getByRole('heading', { level: 1, name: 'Explore the world.' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'World coverage map' }).closest('.view')!.querySelector('[data-mock]')).toBeNull()
    cleanup()
    open('/explore/region')
    expect(mocked(screen.getByText('99.1%'))).not.toBeNull()
    expect(mocked(screen.getByText('Helsingin Sanomat'))).not.toBeNull()
    expect(mocked(screen.getByText(/Finland Selected/))).not.toBeNull()
    expect(document.querySelector('path[data-code="FI"]')).toHaveAttribute('data-selected', 'true')
    expect(screen.queryByRole('button', { name: 'Zoom in' })).toBeNull()
    fireEvent.click(screen.getByRole('link', { name: 'Clear selection ×' }))
    expect(window.location.pathname).toBe('/explore')
  })
})

describe('States', () => {
  it('is marked "Example states", links to /, /history and /ask and disables Retry', () => {
    open('/states')
    expect(screen.getByRole('heading', { level: 1, name: 'Edge Cases & System States' })).toBeInTheDocument()
    expect(mocked(screen.getByText('Unable to retrieve social post'))).toHaveAttribute('title', expect.stringContaining('Example states'))
    const retry = screen.getByRole('button', { name: /Retry Wire Retrieval/ })
    expect(retry).toBeDisabled()
    expect(retry.closest('[data-mock="true"]')).toHaveAttribute('title', expect.stringContaining('Retry'))
    const main = screen.getByRole('heading', { level: 1 }).closest('section')!
    const hrefs = new Set(within(main).getAllByRole('link').map((a) => a.getAttribute('href')))
    expect(hrefs).toEqual(new Set(['/', '/history', '/ask']))
  })
})

describe('Localized screens', () => {
  it('translates Region, with the country name from Intl.DisplayNames', () => {
    localStorage.setItem('veil.locale', 'de')
    open('/explore/region')
    expect(screen.getByRole('heading', { level: 1, name: 'Entdecken Sie die Welt.' })).toBeInTheDocument()
    expect(screen.getByText(/Finnland ausgewählt/)).toBeInTheDocument()
    expect(screen.getByText('99,1 %')).toBeInTheDocument()
    expect(mocked(screen.getByText('Regionalindex'))).toBeNull() // the breadcrumb is not a mock part
    expect(screen.getByRole('link', { name: 'Auswahl aufheben ×' })).toBeInTheDocument()
  })

  it('translates Explore and the map labels in Finnish', () => {
    localStorage.setItem('veil.locale', 'fi')
    open('/explore')
    expect(screen.getByRole('heading', { level: 1, name: 'Tutki maailmaa.' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Maailmankartta kattavuudesta' })).toBeInTheDocument()
    expect(screen.getAllByText('Analyysejä maata kohti:').length).toBeGreaterThan(0)
  })

  it('translates Explore in Russian', () => {
    localStorage.setItem('veil.locale', 'ru')
    open('/explore')
    expect(screen.getByRole('heading', { level: 1, name: 'Исследуйте мир.' })).toBeInTheDocument()
    expect(screen.getAllByText('Анализов на страну:').length).toBeGreaterThan(0)
    expect(document.documentElement).toHaveAttribute('lang', 'ru')
  })
})
