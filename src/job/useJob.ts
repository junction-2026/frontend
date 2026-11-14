import { useEffect, useState } from 'react'
import { getJob } from '../api/client'
import type { ApiResult, Job } from '../api/types'

export const POLL_MS = 2000

const TERMINAL = ['completed', 'failed', 'cancelled']
// An unknown status is judged by `done`; a known terminal status also ends polling.
export const isTerminal = (job: Pick<Job, 'status' | 'done'>) => job.done === true || TERMINAL.includes(job.status)

// Polls the job every POLL_MS until it is terminal, a request fails, or the component unmounts.
export function useJob(id: string): ApiResult<Job> | null {
  const [state, setState] = useState<{ id: string; result: ApiResult<Job> } | null>(null)

  useEffect(() => {
    let stale = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const load = async () => {
      const result = await getJob(id)
      if (stale) return
      setState({ id, result })
      if (result.ok && !isTerminal(result.data)) timer = setTimeout(() => void load(), POLL_MS)
    }
    void load()
    return () => {
      stale = true
      clearTimeout(timer)
    }
  }, [id])

  return state?.id === id ? state.result : null
}
