import { useEffect, useReducer, useState } from 'react'
import { getJob } from '../api/client'
import { subscribeJobEvents } from '../api/events'
import type { Job, JobEvent } from '../api/types'
import { applyEvent, applyJob, initialState, type State } from './state'

export const POLL_MS = 2000

type Action = { event: JobEvent } | { job: Job }
const reduce = (s: State, a: Action) => ('event' in a ? applyEvent(s, a.event) : applyJob(s, a.job))

// Follows a job: events first; after the event client gives up, GET /jobs/{id} every POLL_MS until done.
export function useJobStream(id: string) {
  const [state, dispatch] = useReducer(reduce, initialState)
  const [missing, setMissing] = useState(false)
  useEffect(() => {
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const poll = async () => {
      const r = await getJob(id)
      if (stopped) return
      if (r.ok) {
        dispatch({ job: r.data })
        if (r.data.done) return
      } else if (r.error.status === 404) {
        setMissing(true)
        return
      }
      timer = setTimeout(poll, POLL_MS)
    }
    const stop = subscribeJobEvents(id, { onEvent: (event) => dispatch({ event }), onGiveUp: poll })
    // A WebSocket handshake that fails with 404 looks like any other close, so ask REST once.
    getJob(id).then((r) => {
      if (stopped || r.ok || r.error.status !== 404) return
      setMissing(true)
      stop()
    })
    return () => {
      stopped = true
      clearTimeout(timer)
      stop()
    }
  }, [id])
  return { state, missing }
}
