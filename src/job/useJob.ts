import { useEffect, useState } from 'react'
import { fetchJob, isTerminal, POLL_MS, type JobResult } from './api'

// Polls the job every POLL_MS until it is terminal, a request fails, or the component unmounts.
export function useJob(id: string): JobResult | null {
  const [state, setState] = useState<{ id: string; result: JobResult } | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    const load = async () => {
      const result = await fetchJob(id, controller.signal)
      if (controller.signal.aborted) return
      setState({ id, result })
      if (result.ok && !isTerminal(result.job)) timer = setTimeout(() => void load(), POLL_MS)
    }
    void load()
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [id])

  return state?.id === id ? state.result : null
}
