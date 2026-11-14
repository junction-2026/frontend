import { describe, expect, it } from 'vitest'
import type { JobEvent } from '../api/types'
import { applyEvent, applyJob, initialState, ledgerRows, previewSummary } from './state'

const ev = (type: string, seq: number, data: Record<string, unknown> = {}): JobEvent => ({ type, job_id: 'j', seq, emitted_at: 't', data })
const job = { id: 'j', status: 'running', done: false, created_at: 't', analyzers: [], finalization: { status: 'pending' }, input: { content: 'x' }, scrape: null } as never

describe('applyEvent', () => {
  it('ignores events that are not newer, but a snapshot always resets', () => {
    let s = applyEvent(initialState, ev('job.snapshot', 5, { job, plan: null, progress: { done: 1, running: [], total: 2 } }))
    s = applyEvent(s, ev('analyzer.started', 5, { progress: { done: 2, running: [], total: 2 } }))
    expect(s.progress?.done).toBe(1)
    s = applyEvent(s, ev('job.snapshot', 3, { job, plan: null, progress: { done: 0, running: [], total: 2 } }))
    expect(s.progress?.done).toBe(0)
    expect(s.seq).toBe(3)
  })

  it('ignores unknown event types without changing state members', () => {
    const s = applyEvent(applyEvent(initialState, ev('job.snapshot', 1, { job })), ev('mystery', 2))
    expect(s.job).toBe(job)
  })

  it('applyJob builds a plan from the job when none was seen and keeps a known one', () => {
    const j = { ...(job as object), analyzers: [{ id: 'a', name: 'A', status: 'succeeded', depends_on: [] }, { id: 'b', name: 'B', status: 'skipped', reason: 'not_selected', depends_on: [] }] } as never
    const s = applyJob(initialState, j)
    expect(s.plan?.map((p) => p.id)).toEqual(['a'])
    expect(s.progress).toEqual({ done: 1, running: [], total: 1 })
    expect(applyJob({ ...s, plan: [] }, j).plan).toEqual([])
  })

  it('recomputes progress from the polled job when a plan from events is kept', () => {
    const plan = ['a', 'b', 'c', 'fin'].map((id) => ({ id, name: id, activity_key: id === 'fin' ? 'finalizer' : id, depends_on: [], phase: 1 }))
    const snap = applyEvent(initialState, ev('job.snapshot', 4, { job, plan: { analyzers: plan }, progress: { done: 1, running: ['b'], total: 4 } }))
    expect(snap.progress?.done).toBe(1)
    const run = (id: string, status: string) => ({ id, name: id, status, depends_on: [] })
    const polled = { ...(job as object), analyzers: [run('a', 'succeeded'), run('b', 'failed'), run('c', 'skipped')], finalization: { status: 'running' } } as never
    expect(applyJob(snap, polled).progress).toEqual({ done: 3, running: ['fin'], total: 4 })
  })
})

describe('ledgerRows', () => {
  it('lists plan entries in plan order and uses the name before start', () => {
    const s = applyEvent(initialState, ev('job.snapshot', 1, { job, plan: { analyzers: [{ id: 'b', name: 'B', activity_key: 'b' }, { id: 'a', name: 'A', activity_key: 'a' }] } }))
    expect(ledgerRows(s).map((r) => [r.title, r.label, r.tone])).toEqual([['B', 'Pending', 'gray'], ['A', 'Pending', 'gray']])
  })
})

describe('previewSummary', () => {
  it.each([
    ['topic_extraction', { claims_total: 1, topics_total: 2 }, '1 claim · 2 topics'],
    ['news_search', { articles: 12 }, '12 articles'],
    ['fact_check', { fact_checks: 0 }, '0 fact checks'],
    ['techniques', { detected_total: 3 }, '3 techniques detected'],
    ['translation', { translated: false }, 'not translated'],
    ['source_info', { summary: {} }, null],
  ])('%s', (key, preview, expected) => expect(previewSummary(key, preview)).toBe(expected))
})
