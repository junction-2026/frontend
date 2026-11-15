import type { Job, TextBotDetection } from '../api/types'
import { run } from './read'

// The text-origin signal of a job (shared bot-detection-result), or null when it is absent, not succeeded or not a valid text-level result.
export function botTextOf(job: Job): Pick<TextBotDetection, 'label' | 'score'> | null {
  const r = run(job, 'bot_detection')
  const res = r?.result as { label?: unknown; score?: unknown; scope?: unknown } | null | undefined
  if (r?.status !== 'succeeded' || typeof res !== 'object' || res === null || res.scope !== 'text') return null
  if (res.label !== 'human' && res.label !== 'bot_or_generated') return null
  if (typeof res.score !== 'number' || !Number.isFinite(res.score) || res.score < 0 || res.score > 1) return null
  return { label: res.label, score: res.score }
}
