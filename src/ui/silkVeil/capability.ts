type Nav = { hardwareConcurrency?: number; deviceMemory?: number; connection?: { saveData?: boolean } }

export const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

export const prefersReducedMotion = (win: Pick<Window, 'matchMedia'> = window) => !!win.matchMedia?.(REDUCED_MOTION).matches

/** Weak or data-saving device: skip WebGL and show the static fabric. */
export function isLowPower(nav: Nav = navigator as Nav) {
  return (
    (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 2) ||
    (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) ||
    nav.connection?.saveData === true
  )
}

export const GL_ATTRIBUTES: WebGLContextAttributes = { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' }

/** A WebGL1 context, or null when creation fails or throws. */
export function getGl(canvas: HTMLCanvasElement): WebGLRenderingContext | null {
  try {
    return canvas.getContext('webgl', GL_ATTRIBUTES)
  } catch {
    return null
  }
}
