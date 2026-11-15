import { getGl } from './capability'
import { createReveal, type Rng } from './reveal'
import { FRAGMENT, VERTEX } from './shader'

export const MAX_DPR = 1.5
export const RENDER_SCALE = 0.6
const MAX_STEP_S = 0.1 // clamps a long frame so time never jumps

/** Backing-store size for a CSS size: DPR capped, then scaled down; CSS upscales. */
export const backingSize = (cssW: number, cssH: number, dpr: number) => {
  const k = Math.min(dpr || 1, MAX_DPR) * RENDER_SCALE
  return [Math.max(1, Math.round(cssW * k)), Math.max(1, Math.round(cssH * k))] as const
}

/**
 * Starts the silk-veil render loop on `canvas`. Returns a dispose function, or null when WebGL or the shaders are unavailable
 * (nothing is left allocated then). `onLost` runs when the context is lost; the loop has stopped by then.
 */
export function startSilkVeil(canvas: HTMLCanvasElement, onLost: () => void, rng: Rng = Math.random): (() => void) | null {
  const gl = getGl(canvas)
  if (!gl) return null
  const shaders: WebGLShader[] = []
  const program = gl.createProgram()
  const buffer = gl.createBuffer()
  const release = () => {
    shaders.forEach((s) => gl.deleteShader(s))
    gl.deleteProgram(program)
    gl.deleteBuffer(buffer)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!
    shaders.push(s)
    gl.shaderSource(s, src)
    gl.compileShader(s)
    return !!gl.getShaderParameter(s, gl.COMPILE_STATUS)
  }
  if (!compile(gl.VERTEX_SHADER, VERTEX) || !compile(gl.FRAGMENT_SHADER, FRAGMENT)) return release(), null
  shaders.forEach((s) => gl.attachShader(program, s))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return release(), null

  gl.useProgram(program)
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const pos = gl.getAttribLocation(program, 'a_pos')
  gl.enableVertexAttribArray(pos)
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
  gl.clearColor(0, 0, 0, 0)
  const u = Object.fromEntries(['u_res', 'u_time', 'u_reveal', 'u_side'].map((n) => [n, gl.getUniformLocation(program, n)]))

  const reveal = createReveal(rng)
  let t = 0 // elapsed visible seconds; never reset
  let last: number | null = null
  let raf = 0
  let sized = false // false = (re)apply the size on the next frame, at most once per frame

  const frame = (now: number) => {
    const dt = last === null ? 0 : Math.min(Math.max((now - last) / 1000, 0), MAX_STEP_S)
    last = now
    t += dt
    if (!sized) {
      const [w, h] = backingSize(window.innerWidth, window.innerHeight, window.devicePixelRatio)
      canvas.width = w
      canvas.height = h
      gl.viewport(0, 0, w, h)
      gl.uniform2f(u.u_res, w, h)
      sized = true
    }
    const r = reveal.advance(dt)
    gl.uniform1f(u.u_time, t)
    gl.uniform1f(u.u_reveal, r.value)
    gl.uniform1f(u.u_side, r.side)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    raf = requestAnimationFrame(frame)
  }
  const stop = () => {
    cancelAnimationFrame(raf)
    raf = 0
    last = null // paused time is not counted: the next frame starts a fresh delta
  }
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') stop()
    else if (!raf) raf = requestAnimationFrame(frame)
  }
  const onResize = () => (sized = false)
  const onContextLost = (e: Event) => {
    e.preventDefault()
    stop()
    onLost()
  }

  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('resize', onResize)
  canvas.addEventListener('webglcontextlost', onContextLost)
  onVisibility()

  return () => {
    stop()
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('resize', onResize)
    canvas.removeEventListener('webglcontextlost', onContextLost)
    release()
  }
}
