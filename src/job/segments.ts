export type Span = { technique: string; text: string; start: number; end: number }
export type Segment = { text: string; techniques: string[] }

// Keeps only spans whose offsets are valid UTF-16 indices into content and whose slice equals text.
export function validSpans(content: string, spans: unknown): Span[] {
  if (!Array.isArray(spans)) return []
  return spans.filter((s): s is Span => {
    if (typeof s !== 'object' || s === null) return false
    const { technique, text, start, end } = s as Record<string, unknown>
    return (
      typeof technique === 'string' &&
      typeof text === 'string' &&
      Number.isInteger(start) &&
      Number.isInteger(end) &&
      (start as number) >= 0 &&
      (start as number) < (end as number) &&
      (end as number) <= content.length &&
      content.slice(start as number, end as number) === text
    )
  })
}

// Splits content at every span boundary; segment texts concatenate to content exactly.
export function segment(content: string, spans: Span[]): Segment[] {
  const cuts = [...new Set([0, content.length, ...spans.flatMap((s) => [s.start, s.end])])].sort((a, b) => a - b)
  const out: Segment[] = []
  for (let i = 0; i + 1 < cuts.length; i++) {
    const [a, b] = [cuts[i], cuts[i + 1]]
    const techniques = [...new Set(spans.filter((s) => s.start <= a && b <= s.end).map((s) => s.technique))]
    out.push({ text: content.slice(a, b), techniques })
  }
  return out
}
