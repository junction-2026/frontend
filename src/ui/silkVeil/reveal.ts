export const GAP_S = [10, 20] as const
export const DURATION_S = [3, 5] as const

export type Rng = () => number
export interface RevealState {
  /** 0 = cloth covers the view, 1 = fully lifted aside. */
  value: number
  /** -1 left, 1 right; re-chosen for every reveal. */
  side: -1 | 1
}

const smoother = (x: number) => {
  const c = Math.min(1, Math.max(0, x))
  return c * c * c * (c * (c * 6 - 15) + 10) // zero first and second derivative at both ends
}
/** Rise over the first 35% of the reveal, hold, fall over the last 35%: no step anywhere. */
export const envelope = (p: number) => smoother(p / 0.35) * (1 - smoother((p - 0.65) / 0.35))

/**
 * Pure reveal clock. `advance(dt)` moves it forward by dt seconds of *visible* time; the caller does not call it while paused,
 * so hidden time is never counted. The first reveal is a gap after creation, each next gap starts at the end of the previous reveal.
 */
export function createReveal(rng: Rng = Math.random) {
  const between = ([lo, hi]: readonly [number, number]) => lo + rng() * (hi - lo)
  let wait: number = between(GAP_S) // seconds until the next reveal starts
  let dur = 0 // > 0 while a reveal is running
  let el = 0
  let side: -1 | 1 = 1
  return {
    advance(dt: number): RevealState {
      let left = Math.max(0, dt)
      while (left > 0) {
        if (dur > 0) {
          const step = Math.min(left, dur - el)
          el += step
          left -= step
          if (el >= dur) {
            dur = 0
            wait = between(GAP_S)
          }
        } else {
          const step = Math.min(left, wait)
          wait -= step
          left -= step
          if (wait <= 0) {
            dur = between(DURATION_S)
            el = 0
            side = rng() < 0.5 ? -1 : 1
          }
        }
      }
      return { value: dur > 0 ? envelope(el / dur) : 0, side }
    },
  }
}
