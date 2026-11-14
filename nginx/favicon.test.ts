import { existsSync, readFileSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// @ts-expect-error plain ES module for njs, no type declarations
import og from './og.js'

const index = readFileSync('index.html', 'utf8')
const pub = (href: string) => `public${href}`
const links = [...index.matchAll(/<link\s+([^>]*?)\/?>/g)].map((m) => Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map((a) => [a[1], a[2]])))
const iconLinks = links.filter((l) => ['icon', 'apple-touch-icon', 'manifest'].includes(l.rel))
const png = (href: string) => {
  const b = readFileSync(pub(href))
  expect(b.subarray(1, 4).toString()).toBe('PNG')
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), colorType: b[25], size: b.length }
}

describe('favicon links', () => {
  it('index.html has the four links, root-relative, and each target exists', () => {
    expect(iconLinks.map((l) => `${l.rel} ${l.href}`).sort()).toEqual(
      ['apple-touch-icon /apple-touch-icon.png', 'icon /favicon.ico', 'icon /favicon.svg', 'manifest /site.webmanifest'])
    expect(iconLinks.find((l) => l.href === '/favicon.svg')?.type).toBe('image/svg+xml')
    expect(iconLinks.find((l) => l.href === '/favicon.ico')?.sizes).toBe('any')
    for (const l of iconLinks) expect(existsSync(pub(l.href)), l.href).toBe(true)
  })
  it('sit outside the og block and survive head injection', () => {
    const block = index.slice(index.indexOf('<!-- og:start -->'), index.indexOf('<!-- og:end -->'))
    expect(block).not.toMatch(/rel="(icon|apple-touch-icon|manifest)"/)
    const out: string = og.injectHead(index, og.renderHead(og.genericCard('https://veil.example')))
    for (const l of iconLinks) expect(out).toContain(`href="${l.href}"`)
    expect(out.match(/<link rel="(icon|apple-touch-icon|manifest)"/g)).toHaveLength(4)
  })
})

describe('favicon files', () => {
  it('favicon.svg is a small self-contained vector', () => {
    const svg = readFileSync('public/favicon.svg', 'utf8')
    expect(svg).toMatch(/viewBox="/)
    expect(svg).not.toMatch(/<script|href=|url\(|<image/i)
    expect(statSync('public/favicon.svg').size).toBeLessThanOrEqual(4096)
  })
  it.each([['/apple-touch-icon.png', 180], ['/icon-192.png', 192], ['/icon-512.png', 512]])('%s is %i px, opaque, <= 100 KB', (href, n) => {
    const p = png(href)
    expect([p.w, p.h]).toEqual([n, n])
    expect([0, 2]).toContain(p.colorType) // grayscale / RGB: no alpha channel
    expect(p.size).toBeLessThanOrEqual(100 * 1024)
  })
  it('favicon.ico holds 16, 32 and 48 px images', () => {
    const b = readFileSync('public/favicon.ico')
    expect([b.readUInt16LE(0), b.readUInt16LE(2)]).toEqual([0, 1])
    const n = b.readUInt16LE(4)
    const sizes = Array.from({ length: n }, (_, i) => b[6 + 16 * i] || 256)
    expect(sizes.sort((a, c) => a - c)).toEqual([16, 32, 48])
  })
  it('site.webmanifest is valid and its icons exist with matching sizes', () => {
    const m = JSON.parse(readFileSync('public/site.webmanifest', 'utf8'))
    expect(m).toMatchObject({ name: 'VEIL / Intelligence', short_name: 'VEIL', theme_color: '#111111', background_color: '#fafaf9', display: 'browser' })
    expect(m.icons.map((i: { src: string }) => i.src)).toEqual(['/icon-192.png', '/icon-512.png'])
    for (const i of m.icons) {
      expect(i.type).toBe('image/png')
      const p = png(i.src)
      expect(`${p.w}x${p.h}`).toBe(i.sizes)
    }
  })
})
