import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? files(p) : [p]
  })

describe('fonts', () => {
  it('index.html and src contain no Google Fonts URL', () => {
    const offenders = ['index.html', ...files('src')].filter((f) =>
      /fonts\.(googleapis|gstatic)\.com/.test(readFileSync(f, 'utf8')),
    )
    expect(offenders).toEqual([])
  })

  it('self-hosts only Inter from @fontsource-variable/inter', () => {
    const css = readFileSync('src/styles/fonts.css', 'utf8')
    expect(css).toContain('@fontsource-variable/inter/wght.css')
    expect(css).toContain('@fontsource-variable/inter/wght-italic.css')
    expect([...css.matchAll(/@import '(@fontsource[^']*)'/g)].every((m) => m[1].startsWith('@fontsource-variable/inter/'))).toBe(true)
  })

  const css = files('src').filter((f) => f.endsWith('.css'))

  it('no stylesheet uses a weight above 600 or bold', () => {
    const bad = css.flatMap((f) =>
      [...readFileSync(f, 'utf8').matchAll(/font-weight:\s*([^;]+);/g)]
        .filter((m) => /^bold(er)?$/.test(m[1].trim()) || Number(m[1]) > 600)
        .map((m) => `${f}: ${m[0]}`),
    )
    expect(bad).toEqual([])
  })

  it('every font-family is var(--font) except monospace', () => {
    const bad = css.flatMap((f) =>
      [...readFileSync(f, 'utf8').matchAll(/font-family:\s*([^;}]+)/g)]
        .filter((m) => !/^var\(--font\)$/.test(m[1].trim()) && !/monospace/.test(m[1]))
        .map((m) => `${f}: ${m[0]}`),
    )
    expect(bad).toEqual([])
  })

  it('body background is solid, without a gradient', () => {
    const body = /(?:^|\n)body\s*{[^}]*}/.exec(readFileSync('src/styles/base.css', 'utf8'))![0]
    expect(body).toMatch(/background:\s*var\(--bg\);/)
    expect(body).not.toContain('gradient')
  })

  it('--muted has at least 4.5:1 contrast on --bg', () => {
    const tokens = readFileSync('src/styles/tokens.css', 'utf8')
    const hex = (n: string) => /#[0-9a-f]{6}/i.exec(new RegExp(`--${n}:\\s*([^;]+);`).exec(tokens)![1])![0]
    const lum = (h: string) => {
      const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
    }
    const [a, b] = [lum(hex('muted')), lum(hex('bg'))].sort((x, y) => y - x)
    expect((a + 0.05) / (b + 0.05)).toBeGreaterThanOrEqual(4.5)
  })
})
