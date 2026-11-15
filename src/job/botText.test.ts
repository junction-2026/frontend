import { describe, expect, it } from 'vitest'
import type { Job } from '../api/types'
import { botTextOf } from './botText'
import { job, run } from './fixtures'

const of = (status: string, result: unknown) => botTextOf(job({ analyzers: [run('bot_detection', status, { result })] }) as unknown as Job)
const ok = { label: 'bot_or_generated', score: 0.87, scope: 'text' }

describe('botTextOf', () => {
  it('reads a valid text result and ignores unknown members', () => {
    expect(of('succeeded', { ...ok, extra: 1 })).toEqual({ label: 'bot_or_generated', score: 0.87 })
    expect(of('succeeded', { label: 'human', score: 0, scope: 'text' })).toEqual({ label: 'human', score: 0 })
    expect(of('succeeded', { label: 'human', score: 1, scope: 'text' })).toEqual({ label: 'human', score: 1 })
  })
  it('is null without a succeeded run', () => {
    expect(botTextOf(job() as unknown as Job)).toBeNull()
    for (const s of ['skipped', 'failed', 'pending', 'running']) expect(of(s, ok)).toBeNull()
  })
  it.each([
    ['null result', null],
    ['no scope', { label: 'human', score: 0.1 }],
    ['other scope', { ...ok, scope: 'account' }],
    ['unknown label', { ...ok, label: 'mixed' }],
    ['missing label', { score: 0.5, scope: 'text' }],
    ['score above 1', { ...ok, score: 1.2 }],
    ['negative score', { ...ok, score: -0.1 }],
    ['string score', { ...ok, score: '0.5' }],
    ['NaN score', { ...ok, score: NaN }],
    ['missing score', { label: 'human', scope: 'text' }],
    ['account object', { author: { score: 0.9 } }],
    ['string result', 'x'],
  ])('is null for %s', (_n, result) => expect(of('succeeded', result)).toBeNull())
})
