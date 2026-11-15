import ts from 'typescript'
import { describe, expect, it } from 'vitest'

// Views whose static text must come from the catalogs. Result/detail views and src/job belong to the result-localization task.
const files = import.meta.glob(
  [
    '../views/{Home,Explore,Region,History,Ask,States}View.tsx',
    '../explore/*.tsx',
    '../explore/propagandaMap/*.tsx',
    '../history/*.tsx',
    '../ui/*.tsx',
    '../secondary/*.tsx',
    '!../**/*.test.tsx',
  ],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>

const ATTRS = new Set(['placeholder', 'title', 'aria-label', 'aria-description', 'alt', 'label'])
// Brand and the keycap of the search shortcut: not translatable.
const ALLOWED = new Set(['VEIL', '⌘ K'])
const LETTER = /\p{L}/u

export function literals(name: string, source: string): string[] {
  const sf = ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const found: string[] = []
  const add = (node: ts.Node, text: string) => {
    const t = text.replace(/\s+/g, ' ').trim()
    if (LETTER.test(t) && !ALLOWED.has(t)) found.push(`${name}:${sf.getLineAndCharacterOfPosition(node.getStart()).line + 1} "${t}"`)
  }
  const visit = (n: ts.Node) => {
    if (ts.isJsxText(n)) add(n, n.text)
    else if (ts.isJsxAttribute(n) && ATTRS.has(n.name.getText()) && n.initializer) {
      if (ts.isStringLiteral(n.initializer)) add(n, n.initializer.text)
      else if (ts.isJsxExpression(n.initializer) && n.initializer.expression && ts.isStringLiteralLike(n.initializer.expression)) add(n, n.initializer.expression.text)
    } else if (ts.isJsxExpression(n) && n.expression && ts.isStringLiteralLike(n.expression) && !ts.isJsxAttribute(n.parent)) add(n, n.expression.text)
    ts.forEachChild(n, visit)
  }
  visit(sf)
  return found
}

describe('no hardcoded user-visible strings', () => {
  it('scans the owned views', () => expect(Object.keys(files).length).toBeGreaterThan(10))

  it('finds none in the shell, Home, Explore, Region, History, Ask and States', () => {
    expect(Object.entries(files).flatMap(([name, src]) => literals(name, src))).toEqual([])
  })

  describe('the check itself', () => {
    const lit = (jsx: string) => literals('x.tsx', `const A = () => ${jsx}`)
    it('flags JSX text, a literal attribute and a literal expression', () => {
      expect(lit('<h2>Hello</h2>')).toHaveLength(1)
      expect(lit('<input placeholder="Search" aria-label={\'Query\'} />')).toHaveLength(2)
      expect(lit("<p>{'Hi'}</p>")).toHaveLength(1)
    })
    it('accepts catalog calls, glyphs, the brand and symbols', () => {
      expect(lit("<p title={t('a.b')}>VEIL {' · '} ↵ {x} 12</p>")).toEqual([])
    })
  })
})
