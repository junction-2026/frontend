import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { I18nProvider, useLocale } from '../i18n'
import StatesView from './StatesView'

afterEach(() => {
  localStorage.clear()
  document.documentElement.lang = 'en'
  document.documentElement.dir = 'ltr'
})

const Go = () => {
  const { setLocale } = useLocale()
  return <button onClick={() => setLocale('de')}>switch</button>
}

describe('StatesView', () => {
  it('renders English by default, then German after a switch, with locale-formatted numbers', () => {
    render(<I18nProvider><Go /><StatesView /></I18nProvider>)
    expect(screen.getByRole('heading', { level: 1, name: 'Edge Cases & System States' })).toBeInTheDocument()
    expect(screen.getByText(/Analysis Pipeline Integrity · 75% Available/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'switch' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Sonderfälle & Systemzustände' })).toBeInTheDocument()
    expect(screen.getByText(/Modell-Entropie: 0,88/)).toBeInTheDocument()
    expect(screen.getByText(/Integrität der Analysepipeline · 75\s?% verfügbar/)).toBeInTheDocument()
  })

  it('stays usable in Arabic: dir is rtl and the headings are Arabic', () => {
    localStorage.setItem('veil.locale', 'ar')
    render(<I18nProvider><StatesView /></I18nProvider>)
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    expect(screen.getByRole('heading', { level: 1, name: 'الحالات الحدّية وحالات النظام' })).toBeInTheDocument()
    expect(screen.getAllByRole('link').length).toBeGreaterThan(0)
  })
})
