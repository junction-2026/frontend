// Silk-veil shader source. The palette and tuning numbers are exported so tests can check the contrast floor,
// the speed limits and the reveal coverage without a GPU; GLSL below interpolates them.
export const BASE: [number, number, number] = [0xf4 / 255, 0xf1 / 255, 0xec / 255] // #F4F1EC
export const SHADOW: [number, number, number] = [0xd9 / 255, 0xd5 / 255, 0xce / 255] // #D9D5CE
export const ALPHA = { min: 0.4, max: 0.72 } // cloth alpha at rest; deeper folds are more opaque
/** Fold frequencies in cycles per viewport width (vertical hanging folds). */
export const FOLDS = [3.1, 5.3, 8.7]
/** Fold sway amplitude as a share of the viewport width (sum of the two sway terms). */
export const SWAY = [0.018, 0.01]
/** Travelling octaves: cycles per viewport width and phase speed in viewport widths per second. */
export const WAVES = [
  { freq: 1.4, speed: 0.07 },
  { freq: 2.3, speed: 0.1 },
  { freq: 3.7, speed: 0.13 },
]
/** Reveal edge, in viewport widths measured from the far side (the cloth gathers on the near side): edge = u_reveal * (REACH + CURVE * wave), softened by SOFT. */
export const EDGE = { reach: 0.85, curve: 0.12, soft: 0.1 }

const f = (n: number) => n.toFixed(5)
const v3 = (c: number[]) => `vec3(${c.map(f).join(', ')})`
const TAU = Math.PI * 2

export const VERTEX = `attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

const wave = (i: number, dir: string, phase: number) =>
  `sin(${f(TAU * WAVES[i].freq)} * dot(p, ${dir}) - ${f(TAU * WAVES[i].freq * WAVES[i].speed)} * u_time + ${f(phase)})`

export const FRAGMENT = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 u_res;
uniform float u_time;
uniform float u_reveal;
uniform float u_side;

// Heightfield of the cloth at p (x in viewport widths, y in the same unit): hanging folds plus travelling waves.
float height(vec2 p) {
  float t = u_time;
  float sway = ${f(SWAY[0])} * sin(0.31 * t + p.y * 2.6) + ${f(SWAY[1])} * sin(0.23 * t - p.y * 4.1 + 1.7);
  float x = p.x + sway;
  float depth = 0.75 + 0.25 * sin(p.y * 2.2 + 0.17 * t);
  float h = 0.55 * sin(${f(TAU * FOLDS[0])} * x + 0.4)
          + 0.30 * sin(${f(TAU * FOLDS[1])} * x + 2.1 + 0.6 * sin(p.y * 1.3))
          + 0.15 * sin(${f(TAU * FOLDS[2])} * x + 4.2);
  h *= depth;
  h += 0.14 * ${wave(0, 'vec2(0.8, 0.6)', 0.5)}
     + 0.09 * ${wave(1, 'vec2(-0.6, 0.8)', 2.4)}
     + 0.05 * ${wave(2, 'vec2(0.28, -0.96)', 4.6)};
  return h;
}

// d: distance in viewport widths from the side the cloth is gathered toward (0 there). The cleared region grows from the far side.
float sideDist(vec2 p) { return u_side > 0.0 ? p.x : 1.0 - p.x; }
float edgeAt(float y) {
  return u_reveal * (${f(EDGE.reach)} + ${f(EDGE.curve)} * sin(y * 3.4 + 0.9));
}
// Lifted crest of cloth along the moving edge.
float crest(vec2 p) {
  return 0.9 * exp(-pow((sideDist(p) - edgeAt(p.y)) / 0.07, 2.0)) * smoothstep(0.0, 0.15, u_reveal);
}
float surf(vec2 p) { return height(p) + crest(p); }

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = vec2(uv.x, (1.0 - uv.y) * u_res.y / u_res.x);
  float e = 1.5 / u_res.x;
  float h = surf(p);
  float hx = surf(p + vec2(e, 0.0));
  float hy = surf(p + vec2(0.0, e));
  vec3 n = normalize(vec3(-(hx - h) / e * 0.06, -(hy - h) / e * 0.06, 1.0));
  vec3 l = normalize(vec3(-0.45, -0.55, 0.7));
  float lit = clamp(0.65 + (dot(n, l) - l.z) * 1.6, 0.0, 1.0); // a flat cloth sits mid-light, folds go darker or lighter
  float spec = pow(max(dot(reflect(-l, n), vec3(0.0, 0.0, 1.0)), 0.0), 24.0) * 0.06;
  vec3 col = min(mix(${v3(SHADOW)}, ${v3(BASE)}, lit) + spec, 1.0);
  float a = mix(${f(ALPHA.max)}, ${f(ALPHA.min)}, lit);
  float edge = edgeAt(p.y);
  a *= smoothstep(edge - ${f(EDGE.soft)}, edge, sideDist(p));
  gl_FragColor = vec4(col * a, a);
}
`
