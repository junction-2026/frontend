import { useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WorldMap } from './WorldMap'
import { EXPLORE_MOCK_COVERAGE } from './exploreMockCoverage'
import { ALPHA2_BY_NUMERIC } from './countryCodes'
import { COUNTRIES, SELECTABLE } from './worldMapData'

// Map with the mock coverage and local selection state (Explore itself is tested in src/explore).
const ExploreView = ({ coverage = EXPLORE_MOCK_COVERAGE }: { coverage?: typeof EXPLORE_MOCK_COVERAGE }) => {
  const [sel, setSel] = useState<string | null>(null)
  return <WorldMap coverage={coverage} selected={sel} onSelect={setSel} />
}
const paths = () => [...document.querySelectorAll<SVGPathElement>('path.country')]
const finland = () => document.querySelector<SVGPathElement>('path[data-code="FI"]')!
const view = () => document.querySelector<SVGGElement>('.map-view')!
const scale = () => Number(view().getAttribute('data-scale'))

beforeEach(() => vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {}))))
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('world data', () => {
  it('maps every feature id to an alpha-2 code and leaves id-less features inert', () => {
    expect(COUNTRIES.length).toBeGreaterThan(150)
    expect(COUNTRIES.filter((c) => !c.code).map((c) => c.name).sort()).toEqual(['Kosovo', 'N. Cyprus', 'Somaliland'])
    expect(new Set(Object.values(ALPHA2_BY_NUMERIC)).size).toBe(Object.keys(ALPHA2_BY_NUMERIC).length)
    expect(SELECTABLE.map((c) => c.name)).toEqual([...SELECTABLE.map((c) => c.name)].sort((a, b) => a.localeCompare(b)))
  })
})

describe('World map', () => {
  it('renders country paths and a tooltip on hover without any propaganda statistic', () => {
    render(<ExploreView />)
    expect(paths().length).toBeGreaterThan(150)
    expect(finland()).toBeInTheDocument()
    expect(finland()).toHaveAttribute('fill', '#9FC4ED')
    fireEvent.pointerEnter(finland(), { clientX: 100, clientY: 100 })
    const tip = screen.getByRole('tooltip')
    expect(tip).toHaveTextContent('Finland')
    expect(tip).toHaveTextContent('12 articles · 4 publishers')
    expect(document.body).not.toHaveTextContent(/propaganda/i)
    expect(finland()).toHaveAttribute('fill', '#A7C9F0')
    fireEvent.pointerLeave(finland())
    expect(screen.queryByRole('tooltip')).toBeNull()
    expect(finland()).toHaveAttribute('fill', '#9FC4ED')
    const noData = document.querySelector('path[data-code="AQ"]')!
    fireEvent.pointerEnter(noData)
    expect(screen.getByRole('tooltip')).toHaveTextContent('No verified publisher data')
  })

  it('selects on click, keeps the selected colour while hovered, and clears on a second click or Escape', () => {
    render(<ExploreView />)
    fireEvent.click(finland())
    expect(finland()).toHaveAttribute('data-selected', 'true')
    expect(finland()).toHaveAttribute('fill', '#7FADE5')
    fireEvent.pointerEnter(finland())
    expect(finland()).toHaveAttribute('fill', '#7FADE5') // stays selected while hovered
    fireEvent.click(finland()) // clicking the selection again clears it
    expect(finland()).not.toHaveAttribute('data-selected')
    fireEvent.click(finland())
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(finland()).not.toHaveAttribute('data-selected')
  })

  it('does not select id-less features', () => {
    render(<ExploreView />)
    const kosovo = paths().find((p) => !p.hasAttribute('data-code'))!
    fireEvent.click(kosovo)
    fireEvent.pointerEnter(kosovo)
    expect(screen.queryByRole('tooltip')).toBeNull()
    expect(document.querySelector('[data-selected]')).toBeNull()
  })

  it('zooms within 1..8, disables at the limits and resets', () => {
    render(<ExploreView />)
    const [zin, zout, reset] = ['Zoom in', 'Zoom out', 'Reset'].map((n) => screen.getByRole('button', { name: n }))
    expect(zout).toBeDisabled()
    fireEvent.click(zin)
    expect(scale()).toBe(1.5)
    expect(view().style.transform).toContain('scale(1.5)')
    expect(zout).toBeEnabled()
    for (let i = 0; i < 10; i++) fireEvent.click(zin)
    expect(scale()).toBe(8)
    expect(zin).toBeDisabled()
    fireEvent.click(zout)
    expect(scale()).toBeCloseTo(8 / 1.5)
    fireEvent.click(reset)
    expect(scale()).toBe(1)
    expect(view().style.transform).toMatch(/^translate\(0px.*scale\(1\)$/)
    expect(zout).toBeDisabled()
  })

  it('zooms on wheel with preventDefault and pans on drag within bounds', () => {
    render(<ExploreView />)
    const stage = document.querySelector('.map-stage')!
    expect(fireEvent.wheel(stage, { deltaY: -100 })).toBe(false) // default prevented
    expect(scale()).toBeGreaterThan(1)
    const svg = screen.getByRole('img', { name: 'World coverage map' })
    Object.assign(svg, { getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 500, right: 960, bottom: 500, x: 0, y: 0, toJSON() {} }) })
    fireEvent.pointerDown(svg, { pointerId: 1, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(svg, { pointerId: 1, clientX: 5000, clientY: 5000 })
    fireEvent.pointerUp(svg, { pointerId: 1 })
    expect(view().style.transform).toMatch(/^translate\(0px/) // clamped: cannot leave the viewport
    fireEvent.pointerDown(svg, { pointerId: 1, clientX: 500, clientY: 100 })
    fireEvent.pointerMove(svg, { pointerId: 1, clientX: 400, clientY: 100 })
    fireEvent.pointerUp(svg, { pointerId: 1 })
    expect(view().style.transform).toMatch(/^translate\(-\d+/)
    fireEvent.click(finland()) // a drag must not select
    expect(finland()).not.toHaveAttribute('data-selected')
  })

  it('pinch zooms without selecting', () => {
    render(<ExploreView />)
    const svg = screen.getByRole('img', { name: 'World coverage map' })
    Object.assign(svg, { getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 500, right: 960, bottom: 500, x: 0, y: 0, toJSON() {} }) })
    fireEvent.pointerDown(svg, { pointerId: 1, clientX: 400, clientY: 200 })
    fireEvent.pointerDown(svg, { pointerId: 2, clientX: 500, clientY: 200 })
    fireEvent.pointerMove(svg, { pointerId: 2, clientX: 700, clientY: 200 })
    expect(scale()).toBeGreaterThan(1)
    fireEvent.pointerUp(svg, { pointerId: 2 })
    fireEvent.pointerUp(svg, { pointerId: 1 })
    fireEvent.click(finland())
    expect(finland()).not.toHaveAttribute('data-selected')
  })

  it('renders with an empty dataset', () => {
    render(<ExploreView coverage={{}} />)
    expect(finland()).toHaveAttribute('fill', '#E9EDF2')
    fireEvent.pointerEnter(finland())
    expect(screen.getByRole('tooltip')).toHaveTextContent('No verified publisher data')
  })
})

describe('WorldMap static', () => {
  it('is not interactive and has no zoom controls', () => {
    const onSelect = vi.fn()
    render(<WorldMap coverage={EXPLORE_MOCK_COVERAGE} selected="FI" interactive={false} onSelect={onSelect} />)
    expect(finland()).toHaveAttribute('data-selected', 'true')
    fireEvent.click(finland())
    fireEvent.pointerEnter(finland())
    expect(onSelect).not.toHaveBeenCalled()
    expect(screen.queryByRole('tooltip')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
  })
})
