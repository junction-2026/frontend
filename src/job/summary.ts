const MIN = 20
const MAX = 220
const TERMINATED = /^[\s\S]*?[.!?؟。](?=\s|$)/ // shortcut: no abbreviation handling, used only without Intl.Segmenter

// First sentence of a text, trimmed; the whole trimmed text when it has no terminator.
function firstSentence(text: string, locale: string): string {
  const t = text.trim()
  if (typeof Intl.Segmenter === 'function') {
    try {
      for (const { segment } of new Intl.Segmenter(locale, { granularity: 'sentence' }).segment(t)) if (segment.trim()) return segment.trim()
    } catch {
      /* unknown locale: use the pattern below */
    }
  }
  return TERMINATED.exec(t)?.[0].trim() ?? t
}

// The short summary of the verdict card: the first complete sentence of `userText` when it has 20-220 code points,
// otherwise the fixed `fallback` sentence. A sentence is never cut and no reason is added.
export function summaryOf(userText: string, locale: string, fallback: string): string {
  const s = firstSentence(userText, locale)
  const n = Array.from(s).length
  return n >= MIN && n <= MAX ? s : fallback
}
