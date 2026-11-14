import { useEffect, useRef, useState } from 'react'
import { getJob } from '../api/client'
import type { JobSummary } from '../api/types'
import { excerpt } from './format'

export const MAX_IN_FLIGHT = 4

// id -> excerpt text, or null when it could not be fetched. JobSummary has no input, so each loaded item is
// fetched once with getJob, at most MAX_IN_FLIGHT at a time.
export function useExcerpts(items: JobSummary[]): Record<string, string | null> {
  const [texts, setTexts] = useState<Record<string, string | null>>({})
  const queued = useRef(new Set<string>())
  const waiting = useRef<string[]>([])
  const active = useRef(0)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      waiting.current = [] // nobody will see these excerpts
    }
  }, [])

  useEffect(() => {
    const pump = () => {
      while (alive.current && active.current < MAX_IN_FLIGHT && waiting.current.length > 0) {
        const id = waiting.current.shift() as string
        active.current++
        void getJob(id).then((r) => {
          active.current--
          if (alive.current) {
            const src = r.ok ? (typeof r.data.input?.content === 'string' && r.data.input.content !== '' ? r.data.input.content : r.data.scrape?.url) : undefined
            setTexts((t) => ({ ...t, [id]: typeof src === 'string' && src !== '' ? excerpt(src) : null }))
          }
          pump()
        })
      }
    }
    // Ids of a previous filter or page set are dropped (and may be queued again later) so the visible items go first.
    const current = new Set(items.map((i) => i.id))
    for (const id of waiting.current) if (!current.has(id)) queued.current.delete(id)
    waiting.current = waiting.current.filter((id) => current.has(id))
    for (const { id } of items) if (!queued.current.has(id)) { queued.current.add(id); waiting.current.push(id) }
    pump()
  }, [items])

  return texts
}
