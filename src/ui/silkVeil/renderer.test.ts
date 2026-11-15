import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_DPR, RENDER_SCALE, backingSize, startSilkVeil } from './renderer'

function mockGl() {
  const loseContext = vi.fn()
  const gl = {
    VERTEX_SHADER: 1, FRAGMENT_SHADER: 2, COMPILE_STATUS: 3, LINK_STATUS: 4, ARRAY_BUFFER: 5, STATIC_DRAW: 6, FLOAT: 7, TRIANGLE_STRIP: 8, COLOR_BUFFER_BIT: 9,
    createProgram: vi.fn(() => ({})), createBuffer: vi.fn(() => ({})), createShader: vi.fn(() => ({})),
    shaderSource: vi.fn(), compileShader: vi.fn(), getShaderParameter: vi.fn(() => true), attachShader: vi.fn(), linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true), useProgram: vi.fn(), bindBuffer: vi.fn(), bufferData: vi.fn(), getAttribLocation: vi.fn(() => 0),
    enableVertexAttribArray: vi.fn(), vertexAttribPointer: vi.fn(), clearColor: vi.fn(), getUniformLocation: vi.fn((_p: unknown, n: string) => n),
    viewport: vi.fn(), uniform1f: vi.fn(), uniform2f: vi.fn(), clear: vi.fn(), drawArrays: vi.fn(),
    deleteShader: vi.fn(), deleteProgram: vi.fn(), deleteBuffer: vi.fn(),
    getExtension: vi.fn((n: string) => (n === 'WEBGL_lose_context' ? { loseContext } : null)),
  }
  return { gl, loseContext }
}

let frames: Map<number, FrameRequestCallback>
let nextId: number
let disposers: (() => void)[] = []
const run = (now: number) => {
  const [id, cb] = [...frames][0]
  frames.delete(id)
  cb(now)
}
const setVisibility = (v: 'hidden' | 'visible') => {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(v)
  document.dispatchEvent(new Event('visibilitychange'))
}
const timeUniforms = (gl: ReturnType<typeof mockGl>['gl']) => gl.uniform1f.mock.calls.filter((c) => c[0] === 'u_time').map((c) => c[1] as number)

beforeEach(() => {
  frames = new Map()
  nextId = 0
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => (frames.set(++nextId, cb), nextId))
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
})
afterEach(() => {
  disposers.forEach((d) => d())
  disposers = []
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function start(onLost = vi.fn()) {
  const m = mockGl()
  const canvas = document.createElement('canvas')
  const getContext = vi.spyOn(canvas, 'getContext').mockReturnValue(m.gl as unknown as WebGLRenderingContext)
  const dispose = startSilkVeil(canvas, onLost, () => 0.5)
  if (dispose) disposers.push(dispose)
  return { ...m, canvas, getContext, dispose, onLost }
}

describe('backingSize', () => {
  it('caps the DPR at 1.5 and scales by the render scale', () => {
    expect(RENDER_SCALE >= 0.5 && RENDER_SCALE <= 0.75).toBe(true)
    expect(backingSize(1000, 600, 3)).toEqual([Math.round(1000 * MAX_DPR * RENDER_SCALE), Math.round(600 * MAX_DPR * RENDER_SCALE)])
    expect(backingSize(1000, 600, 1)).toEqual([Math.round(1000 * RENDER_SCALE), Math.round(600 * RENDER_SCALE)])
    expect(backingSize(0, 0, 1)).toEqual([1, 1])
  })
})

describe('startSilkVeil', () => {
  it('returns null and releases what it made when the context or a shader is unavailable', () => {
    const canvas = document.createElement('canvas')
    vi.spyOn(canvas, 'getContext').mockReturnValue(null)
    expect(startSilkVeil(canvas, vi.fn())).toBeNull()
    const m = mockGl()
    m.gl.getShaderParameter.mockReturnValue(false)
    vi.spyOn(canvas, 'getContext').mockReturnValue(m.gl as unknown as WebGLRenderingContext)
    expect(startSilkVeil(canvas, vi.fn())).toBeNull()
    expect(m.gl.deleteShader).toHaveBeenCalled()
    expect(m.loseContext).toHaveBeenCalled()
  })

  it('requests the webgl context and draws one quad per frame via rAF only', () => {
    const { gl, getContext } = start()
    expect(getContext).toHaveBeenCalledWith('webgl', expect.objectContaining({ alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' }))
    expect(frames.size).toBe(1)
    run(0)
    run(16)
    expect(gl.drawArrays).toHaveBeenCalledTimes(2)
    expect(gl.createShader).toHaveBeenCalledTimes(2)
    expect(frames.size).toBe(1)
  })

  it('sizes the backing store once, then again at most once per frame after resizes', () => {
    const { gl, canvas } = start()
    run(0)
    expect(gl.viewport).toHaveBeenCalledTimes(1)
    expect(canvas.width).toBe(backingSize(window.innerWidth, window.innerHeight, window.devicePixelRatio)[0])
    run(16)
    expect(gl.viewport).toHaveBeenCalledTimes(1)
    for (let i = 0; i < 5; i++) window.dispatchEvent(new Event('resize'))
    run(32)
    run(48)
    expect(gl.viewport).toHaveBeenCalledTimes(2)
  })

  it('visibilitychange cancels the loop and resumes it; time continues without a jump', () => {
    const { gl } = start()
    run(0)
    run(1000) // clamped to 0.1 s
    const before = timeUniforms(gl).at(-1)!
    setVisibility('hidden')
    expect(frames.size).toBe(0)
    setVisibility('visible')
    expect(frames.size).toBe(1)
    run(61000) // a minute later: no jump
    run(61016)
    const after = timeUniforms(gl)
    expect(after.at(-2)).toBe(before)
    expect(after.at(-1)! - before).toBeCloseTo(0.016, 5)
  })

  it('does not start while hidden', () => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    start()
    expect(frames.size).toBe(0)
  })

  it('context loss stops the loop and notifies', () => {
    const { canvas, onLost } = start()
    const e = new Event('webglcontextlost', { cancelable: true })
    canvas.dispatchEvent(e)
    expect(e.defaultPrevented).toBe(true)
    expect(frames.size).toBe(0)
    expect(onLost).toHaveBeenCalledOnce()
  })

  it('dispose cancels rAF, removes listeners, deletes GL objects and loses the context', () => {
    const doc = vi.spyOn(document, 'removeEventListener')
    const win = vi.spyOn(window, 'removeEventListener')
    const { gl, loseContext, canvas, dispose } = start()
    const canvasOff = vi.spyOn(canvas, 'removeEventListener')
    run(0)
    expect(frames.size).toBe(1)
    dispose!()
    expect(frames.size).toBe(0)
    expect(doc).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    expect(win).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(canvasOff).toHaveBeenCalledWith('webglcontextlost', expect.any(Function))
    expect(gl.deleteShader).toHaveBeenCalledTimes(2)
    expect(gl.deleteProgram).toHaveBeenCalledOnce()
    expect(gl.deleteBuffer).toHaveBeenCalledOnce()
    expect(loseContext).toHaveBeenCalledOnce()
    setVisibility('visible') // listener is gone: nothing restarts
    expect(frames.size).toBe(0)
  })
})
