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

  it('self-hosts both families from @fontsource packages', () => {
    const css = readFileSync('src/styles/fonts.css', 'utf8')
    expect(css).toContain('@fontsource-variable/newsreader')
    expect(css).toContain('@fontsource/plus-jakarta-sans')
  })
})
