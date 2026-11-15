import { useCallback, useEffect, useState } from 'react'
import { listJobs } from '../api/client'
import type { ApiError, JobSummary } from '../api/types'

export const PAGE = 20

type State = { status: string | undefined; q: string; language: string | undefined; items: JobSummary[]; next: string | null; loading: boolean; more: boolean; error: ApiError | null }

// Newest-first pages of jobs for one (status, q, language); changing any drops the loaded pages. `q` is already trimmed ('' = no search).
export function useHistory(status: string | undefined, q: string, language: string | undefined) {
  const [state, setState] = useState<State>({ status, q, language, items: [], next: null, loading: true, more: false, error: null })

  useEffect(() => {
    let stale = false // an answer that belongs to a previous (status, q, language) is ignored
    void listJobs({ limit: PAGE, status, q, language }).then((r) => {
      if (stale) return
      setState(r.ok
        ? { status, q, language, items: r.data.items, next: r.data.next_cursor ?? null, loading: false, more: false, error: null }
        : { status, q, language, items: [], next: null, loading: false, more: false, error: r.error })
    })
    return () => { stale = true }
  }, [status, q, language])

  const loadMore = useCallback(() => {
    setState((s) => ({ ...s, more: true, error: null }))
    void listJobs({ limit: PAGE, status, q, language, cursor: state.next ?? undefined }).then((r) => {
      setState((s) => s.status !== status || s.q !== q || s.language !== language ? s : r.ok
        ? { ...s, items: [...s.items, ...r.data.items], next: r.data.next_cursor ?? null, more: false }
        : { ...s, more: false, error: r.error })
    })
  }, [status, q, language, state.next])

  // Until the effect has run for a new (status, q, language) the old pages are shown as loading.
  const stale = state.status !== status || state.q !== q || state.language !== language
  return { ...state, loading: state.loading || stale, items: stale ? [] : state.items, loadMore }
}
