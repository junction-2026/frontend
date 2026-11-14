import type { JobEvent } from './types'

export const RECONNECT_DELAYS_MS = [1000, 2000, 4000]

const TERMINAL = ['job.completed', 'job.cancelled', 'job.failed']
const KNOWN = [
  'job.snapshot', 'job.started', 'analysis.planned', 'analysis.ready_for_finalization', 'analysis.finalizing',
  'analysis.finalized', 'analysis.finalization_failed', ...TERMINAL,
]
const isKnown = (type: string) => KNOWN.includes(type) || type.startsWith('analyzer.') || type.startsWith('scrape.')

export type EventHandlers = {
  onEvent: (event: JobEvent) => void
  // Called when the connection is lost for good (no terminal event, reconnects used up).
  onGiveUp?: () => void
}

// Subscribes to a job's event stream; returns an unsubscribe function.
// A reconnect gets a fresh job.snapshot, which resynchronises state, so it is always delivered.
export function subscribeJobEvents(jobId: string, { onEvent, onGiveUp }: EventHandlers): () => void {
  const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const url = `${scheme}://${window.location.host}/api/v1/jobs/${encodeURIComponent(jobId)}/events`
  let lastSeq = 0
  let attempt = 0
  let stopped = false
  let finished = false
  let socket: WebSocket | undefined
  let timer: ReturnType<typeof setTimeout> | undefined

  const connect = () => {
    const ws = new WebSocket(url)
    socket = ws
    ws.onmessage = (m) => {
      let event: unknown
      try {
        event = JSON.parse(String(m.data))
      } catch {
        return
      }
      const e = event as JobEvent
      if (typeof e !== 'object' || e === null || typeof e.type !== 'string' || typeof e.seq !== 'number' || !isKnown(e.type)) return
      if (e.type !== 'job.snapshot' && e.seq <= lastSeq) return
      lastSeq = e.seq
      attempt = 0 // the backoff budget is for consecutive failed connections
      // A snapshot of a done job is followed by a normal close, with no terminal event.
      if (TERMINAL.includes(e.type) || (e.type === 'job.snapshot' && (e.data?.job as { done?: unknown } | undefined)?.done === true)) finished = true
      onEvent(e)
    }
    ws.onclose = () => {
      if (stopped || finished) return
      if (attempt >= RECONNECT_DELAYS_MS.length) {
        onGiveUp?.()
        return
      }
      timer = setTimeout(connect, RECONNECT_DELAYS_MS[attempt++])
    }
  }
  connect()

  return () => {
    stopped = true
    clearTimeout(timer)
    socket?.close()
  }
}
