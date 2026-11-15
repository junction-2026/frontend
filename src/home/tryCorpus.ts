export type Expectation = 'detected' | 'not_detected' | 'uncertain'
export type TryItem = { statement: string; expectation: Expectation }

export const EXPECTATIONS: readonly Expectation[] = ['detected', 'not_detected', 'uncertain']

// A dynamic import keeps the 300 KB corpus out of the main entry chunk.
export const loadRaw = (): Promise<unknown> => import('../data/try-out-statements.json').then((m) => m.default)

export function validItems(raw: unknown): TryItem[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (x): x is TryItem =>
      !!x && typeof x.statement === 'string' && x.statement.trim() !== '' && EXPECTATIONS.includes(x.expectation),
  )
}

// Partial Fisher-Yates over indices: n items, uniform, no repeats; the input is not mutated.
export function draw<T>(items: readonly T[], n = 5, random: () => number = Math.random): T[] {
  const idx = items.map((_, i) => i)
  const out: T[] = []
  for (let i = 0; i < Math.min(n, idx.length); i++) {
    const j = i + Math.floor(random() * (idx.length - i))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
    out.push(items[idx[i]])
  }
  return out
}

export const truncate = (s: string, max: number) => {
  const cps = [...s]
  return cps.length > max ? cps.slice(0, max).join('') + '…' : s
}
