import { useEffect, useRef, useState } from 'react'
import '../styles/explore-veil.css'
import { REDUCED_MOTION, isLowPower, prefersReducedMotion } from './silkVeil/capability'
import { startSilkVeil } from './silkVeil/renderer'

// Decorative veil behind the Explore page: a WebGL silk cloth (src/ui/silkVeil), or a static CSS fabric when WebGL is
// unavailable or lost, motion is reduced, or the device is weak. No text; geometry and the fallback live in explore-veil.css.
export function ExploreVeil() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [lowPower] = useState(() => isLowPower())
  const [reduced, setReduced] = useState(() => prefersReducedMotion())
  const [failed, setFailed] = useState(false)
  const fallback = lowPower || reduced || failed

  useEffect(() => {
    const mq = window.matchMedia?.(REDUCED_MOTION)
    const onChange = () => setReduced(mq.matches)
    mq?.addEventListener?.('change', onChange)
    return () => mq?.removeEventListener?.('change', onChange)
  }, [])

  useEffect(() => {
    if (fallback || !canvas.current) return
    const dispose = startSilkVeil(canvas.current, () => setFailed(true))
    if (!dispose) setFailed(true)
    return dispose ?? undefined
  }, [fallback])

  return (
    <div className="explore-veil" aria-hidden="true">
      {fallback ? <div className="explore-veil-fallback" /> : <canvas ref={canvas} className="explore-veil-canvas" />}
    </div>
  )
}
