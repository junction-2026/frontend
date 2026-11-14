// Sequential single-hue scale for the global propaganda map; light to dark, so a higher count is never lighter.
// First vs last step and last step vs the map background (#F5F9FE) both exceed 3:1 contrast (asserted in scale.test.ts).
export const STEP_COLORS = ['#B7D3EC', '#86B2DB', '#5690C9', '#2F6BA9', '#154A80']
export const NONE_FILL = '#E9EDF2'
const N = STEP_COLORS.length

export type Range = { step: number; from: number; to: number }
export type Scale = { stepOf: (count: number) => number | null; ranges: Range[] }

// Counts 1..max map to steps 0..N-1: one step per count up to N, log-scaled buckets above.
export function makeScale(max: number): Scale {
  const m = Math.max(1, Math.floor(max))
  const stepOf = (count: number) => {
    if (!(count >= 1)) return null
    const c = Math.min(Math.floor(count), m)
    return m <= N ? c - 1 : Math.min(N - 1, Math.floor((N * Math.log(c)) / Math.log(m)))
  }
  const ranges: Range[] = []
  for (let c = 1; c <= m; c++) {
    const step = stepOf(c)!
    const last = ranges[ranges.length - 1]
    if (last?.step === step) last.to = c
    else ranges.push({ step, from: c, to: c })
  }
  return { stepOf, ranges }
}
