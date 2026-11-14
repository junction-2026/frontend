import { useCallback, useEffect, useState } from 'react'
import { listJobs } from '../api/client'
import type { ApiError, JobSummary } from '../api/types'

export const PAGE = 20

type State = { status: string | undefined; items: JobSummary[]; next: string | null; loading: boolean; more: boolean; error: ApiError | null }

// Newest-first pages of jobs for one status filter; changing the filter drops the loaded pages.
export function useHistory(status: string | undefined) {
  const [state, setState] = useState<State>({ status, items: [], next: null, loading: true, more: false, error: null })

  useEffect(() => {
    let stale = false // an answer that belongs to a previous filter is ignored
    void listJobs({ limit: PAGE, status }).then((r) => {
      if (stale) return
      setState(r.ok
        ? { status, items: r.data.items, next: r.data.next_cursor ?? null, loading: false, more: false, error: null }
        : { status, items: [], next: null, loading: false, more: false, error: r.error })
    })
    return () => { stale = true }
  }, [status])

  const loadMore = useCallback(() => {
    setState((s) => ({ ...s, more: true, error: null }))
    void listJobs({ limit: PAGE, status, cursor: state.next ?? undefined }).then((r) => {
      setState((s) => s.status !== status ? s : r.ok
        ? { ...s, items: [...s.items, ...r.data.items], next: r.data.next_cursor ?? null, more: false }
        : { ...s, more: false, error: r.error })
    })
  }, [status, state.next])

  // Until the effect has run for a new filter the old pages are shown as loading.
  const stale = state.status !== status
  return { ...state, loading: state.loading || stale, items: stale ? [] : state.items, loadMore }
}
