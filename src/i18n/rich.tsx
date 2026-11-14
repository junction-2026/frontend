import { Fragment, type ReactNode } from 'react'

// A translated string whose {name} placeholders are replaced by nodes (typically <bdi>…</bdi>), so source text keeps its own direction.
export function rich(text: string, nodes: Record<string, ReactNode>): ReactNode[] {
  return text.split(/(\{\w+\})/).map((part, i) => {
    const name = /^\{(\w+)\}$/.exec(part)?.[1]
    return name && name in nodes ? <Fragment key={i}>{nodes[name]}</Fragment> : part
  })
}
