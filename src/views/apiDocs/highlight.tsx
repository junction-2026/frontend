import { Fragment, type ReactNode } from 'react'

// string (a key when a colon follows) | true/false/null | number
const TOKEN = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g

// Wraps the tokens of JSON text in classed spans. The text itself stays React-escaped; nothing is parsed as HTML.
export function highlightJson(text: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(TOKEN)) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const cls = m[1] ? (m[2] ? 'j-key' : 'j-str') : m[3] ? 'j-lit' : 'j-num'
    out.push(
      <Fragment key={m.index}>
        <span className={cls}>{m[1] ?? m[0]}</span>
        {m[2]}
      </Fragment>,
    )
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}
