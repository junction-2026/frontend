import { useCallback, useEffect, useState } from 'react'
import { getMapCountries, listCountryAnalyses } from '../../api/client'
import type { ApiError } from '../../api/types'
import type { CountriesResponse, MapAnalysis } from '../../api/mapTypes'

export const PAGE_SIZE = 20

export type Remote<T> = { status: 'loading' } | { status: 'error'; error: ApiError } | { status: 'ready'; data: T }

// Countries request; `retry` sends it again.
export function useCountries() {
  const [state, setState] = useState<Remote<CountriesResponse>>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let live = true
    void getMapCountries().then((r) => live && setState(r.ok ? { status: 'ready', data: r.data } : { status: 'error', error: r.error }))
    return () => {
      live = false
    }
  }, [attempt])
  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((a) => a + 1)
  }, [])
  return { state, retry }
}

type Pages = { items: MapAnalysis[]; next: string | null; more: 'idle' | 'loading' | 'error' }

// First page of one country's analyses, then `loadMore` follows next_cursor. The caller keys the panel by code, so a new code starts over.
export function useCountryAnalyses(code: string) {
  const [state, setState] = useState<Remote<Pages>>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let live = true
    void listCountryAnalyses(code, { limit: PAGE_SIZE }).then((r) => {
      if (live) setState(r.ok ? { status: 'ready', data: { items: r.data.items, next: r.data.next_cursor, more: 'idle' } } : { status: 'error', error: r.error })
    })
    return () => {
      live = false
    }
  }, [code, attempt])

  const loadMore = () => {
    if (state.status !== 'ready' || !state.data.next || state.data.more === 'loading') return
    const { next } = state.data
    setState({ status: 'ready', data: { ...state.data, more: 'loading' } })
    void listCountryAnalyses(code, { limit: PAGE_SIZE, cursor: next }).then((r) =>
      setState((s) => {
        if (s.status !== 'ready' || s.data.next !== next) return s // another country or retry took over
        return { status: 'ready', data: r.ok ? { items: [...s.data.items, ...r.data.items], next: r.data.next_cursor, more: 'idle' } : { ...s.data, more: 'error' } }
      }),
    )
  }
  const retry = () => {
    setState({ status: 'loading' })
    setAttempt((a) => a + 1)
  }
  return { state, retry, loadMore }
}
