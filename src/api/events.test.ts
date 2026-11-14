import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { subscribeJobEvents } from './events'
import type { JobEvent } from './types'

class FakeWebSocket {
  static instances: FakeWebSocket[] = []
  onmessage: ((m: { data: string }) => void) | null = null
  onclose: (() => void) | null = null
  closed = false
  constructor(public url: string) {
    FakeWebSocket.instances.push(this)
  }
  close() {
    this.closed = true
    this.onclose?.()
  }
  emit(type: string, seq: number, data: object = {}) {
    this.onmessage?.({ data: JSON.stringify({ type, job_id: 'j', seq, emitted_at: 't', data }) })
  }
  drop() {
    this.onclose?.()
  }
}

const sockets = () => FakeWebSocket.instances
beforeEach(() => {
  FakeWebSocket.instances = []
  vi.useFakeTimers()
  vi.stubGlobal('WebSocket', FakeWebSocket)
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const setup = () => {
  const seen: JobEvent[] = []
  const onGiveUp = vi.fn()
  const stop = subscribeJobEvents('a b', { onEvent: (e) => seen.push(e), onGiveUp })
  return { seen, onGiveUp, stop, types: () => seen.map((e) => `${e.type}#${e.seq}`) }
}

describe('subscribeJobEvents', () => {
  it('opens ws://<host>/api/v1/jobs/<id>/events with the id encoded', () => {
    setup()
    expect(sockets()[0].url).toBe(`ws://${window.location.host}/api/v1/jobs/a%20b/events`)
  })

  it('passes known events and ignores unknown types and malformed frames', () => {
    const { types } = setup()
    const ws = sockets()[0]
    ws.emit('job.snapshot', 3, { job: { done: false } })
    ws.emit('analyzer.progress.v2', 4)
    ws.emit('analyzer.succeeded', 5)
    ws.emit('mystery.event', 6)
    ws.emit('scrape.started', 7)
    ws.emit('analysis.planned', 8)
    ws.emit('analysis.finalizing', 9)
    ws.emit('analysis.finalized', 10)
    ws.onmessage?.({ data: 'not json' })
    expect(types()).toEqual([
      'job.snapshot#3', 'analyzer.progress.v2#4', 'analyzer.succeeded#5', 'scrape.started#7', 'analysis.planned#8',
      'analysis.finalizing#9', 'analysis.finalized#10',
    ])
  })

  it('drops events whose seq is not greater than the last seen', () => {
    const { types } = setup()
    const ws = sockets()[0]
    ws.emit('analyzer.started', 2)
    ws.emit('analyzer.started', 2)
    ws.emit('analyzer.succeeded', 1)
    ws.emit('analyzer.succeeded', 3)
    expect(types()).toEqual(['analyzer.started#2', 'analyzer.succeeded#3'])
  })

  it('reconnects with 1 s / 2 s / 4 s backoff, at most 3 times, then gives up', () => {
    const { onGiveUp } = setup()
    sockets()[0].drop()
    vi.advanceTimersByTime(999)
    expect(sockets()).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(sockets()).toHaveLength(2)
    sockets()[1].drop()
    vi.advanceTimersByTime(2000)
    expect(sockets()).toHaveLength(3)
    sockets()[2].drop()
    vi.advanceTimersByTime(4000)
    expect(sockets()).toHaveLength(4)
    sockets()[3].drop()
    vi.advanceTimersByTime(60000)
    expect(sockets()).toHaveLength(4)
    expect(onGiveUp).toHaveBeenCalledTimes(1)
  })

  it('applies the snapshot after a reconnect even when its seq equals the last seen', () => {
    const { types } = setup()
    sockets()[0].emit('analyzer.started', 5)
    sockets()[0].drop()
    vi.advanceTimersByTime(1000)
    sockets()[1].emit('job.snapshot', 5, { job: { done: false } })
    sockets()[1].emit('analyzer.succeeded', 5)
    sockets()[1].emit('analyzer.succeeded', 6)
    expect(types()).toEqual(['analyzer.started#5', 'job.snapshot#5', 'analyzer.succeeded#6'])
  })

  it.each(['job.completed', 'job.cancelled', 'job.failed'])('does not reconnect after %s', (type) => {
    const { onGiveUp } = setup()
    sockets()[0].emit(type, 1)
    sockets()[0].drop()
    vi.advanceTimersByTime(10000)
    expect(sockets()).toHaveLength(1)
    expect(onGiveUp).not.toHaveBeenCalled()
  })

  it('does not reconnect after the snapshot of a finished job', () => {
    setup()
    sockets()[0].emit('job.snapshot', 4, { job: { done: true } })
    sockets()[0].drop()
    vi.advanceTimersByTime(10000)
    expect(sockets()).toHaveLength(1)
  })

  it('unsubscribe closes the socket and cancels a pending reconnect', () => {
    const { stop } = setup()
    sockets()[0].drop()
    stop()
    vi.advanceTimersByTime(10000)
    expect(sockets()).toHaveLength(1)
    const second = setup()
    second.stop()
    expect(sockets()[1].closed).toBe(true)
  })
})
