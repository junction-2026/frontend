# explore-veil Specification

## Purpose
Defines the decorative animated cloth veil shown behind the Explore page: its structure, placement, palette, motion and reduced-motion behaviour, without altering the real UI.

## Requirements

### Requirement: Veil component
`ExploreVeil` SHALL render one `div.explore-veil` with `aria-hidden="true"`, no text, no focusable element and no `tabindex`. In WebGL mode it SHALL contain one `canvas.explore-veil-canvas`. In fallback mode it SHALL contain one `div.explore-veil-fallback` and no canvas. The `.explore-veil-truth` and `.explore-veil-panel*` elements and their CSS SHALL NOT exist.

#### Scenario: Structure
- **WHEN** `ExploreVeil` is rendered and a WebGL context can be created
- **THEN** there is one hidden `.explore-veil` containing one `canvas.explore-veil-canvas` and no `.explore-veil-fallback`, text or focusable element

#### Scenario: Fallback mode
- **WHEN** `ExploreVeil` is rendered and no WebGL context can be created
- **THEN** there is one hidden `.explore-veil` containing one `.explore-veil-fallback` and no canvas

### Requirement: Explore-only mounting
`ExploreView` SHALL render `<ExploreVeil />` as the sibling directly preceding the `.view` section in both modes (with a job: `ExploreJob`; without: `PropagandaMap`), not inside `.view`, whose `rise` transform would capture the fixed layer. No other view SHALL render it.

#### Scenario: Both modes
- **WHEN** `ExploreView` is rendered with and without a job id
- **THEN** exactly one `.explore-veil` exists and it directly precedes `section.view`

#### Scenario: Other views
- **WHEN** `HomeView` is rendered
- **THEN** no `.explore-veil` exists

### Requirement: Layer geometry and stacking
`.explore-veil` SHALL be `position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; background: #FFFFFF`. `.explore-veil + .view` SHALL be `position: relative; z-index: 1`. The sticky topbar (z-index 40) SHALL stay above both. No rule SHALL re-enable pointer events. The document SHALL gain no horizontal overflow at any width from 320px up, in LTR and RTL.

#### Scenario: Geometry
- **WHEN** `explore-veil.css` is read
- **THEN** `.explore-veil` has the declarations above, `.explore-veil-canvas` fills it, `.explore-veil + .view` has `position: relative` and `z-index: 1`, and no `pointer-events: auto|all` exists

### Requirement: Style isolation and palette
All veil styles SHALL live in `src/styles/explore-veil.css`, imported by `ExploreVeil`. Every selector SHALL target an `.explore-veil*` class. Hex colours SHALL be only the neutral palette `#FFFFFF`, `#F4F1EC`, `#E9E5DE` and `#DCD8D1`, each optionally with alpha, with every RGB channel at least `0xD0`. Body, Explore, map and panel styles SHALL be untouched.

#### Scenario: Palette
- **WHEN** `explore-veil.css` is read
- **THEN** every hex colour is one of the four palette colours (with optional alpha) and every selector contains `.explore-veil`

### Requirement: Cloth look
In WebGL mode the fragment shader SHALL compute a heightfield of vertical hanging folds (at least 3 fold frequencies) plus at least 2 travelling wave or noise octaves. Lighting SHALL come from normals derived from that heightfield: soft diffuse shading plus a low specular sheen. There SHALL be no repeating tile, stripe or hue pattern.

#### Scenario: Folds
- **WHEN** the shader module is inspected
- **THEN** it declares at least 3 fold frequencies and 2 travelling octaves

### Requirement: Reduced motion
Under `@media (prefers-reduced-motion: reduce)` `explore-veil.css` SHALL declare `animation: none` and `transition: none` for `.explore-veil *`, and the veil SHALL use the static fallback instead of WebGL.

#### Scenario: Reduced motion
- **WHEN** `explore-veil.css` is read
- **THEN** the reduced-motion block sets `animation: none` and `transition: none` on `.explore-veil *` and hides nothing

### Requirement: Canvas layout
`.explore-veil-canvas` SHALL be `display: block`, absolutely positioned at `inset: 0` with `width: 100%` and `height: 100%`.

#### Scenario: Canvas fills the layer
- **WHEN** `explore-veil.css` is read
- **THEN** `.explore-veil-canvas` has the declarations above

### Requirement: Cloth colour
Output alpha SHALL be within 0.35 to 0.75 at rest. Colours SHALL be neutral only: base tint `#F4F1EC` and shadow `#D9D5CE`. Every composited pixel over the `#FFFFFF` base SHALL keep each RGB channel at least `0xD0`, so `--ink` and `--muted` text contrast on content surfaces is preserved.

#### Scenario: Contrast floor
- **WHEN** the shader module is inspected
- **THEN** its alpha range is within 0.35 to 0.75 and the base and shadow colours composited at the maximum alpha stay at or above `0xD0` per channel

### Requirement: Renderer
The WebGL renderer SHALL use plain WebGL1 (`canvas.getContext('webgl', {alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power'})`) and draw one full-screen quad with a single fragment shader. Shader source SHALL live in `src/ui/silkVeil/`. No npm dependency and no video or image asset SHALL be added.

#### Scenario: Context request
- **WHEN** the renderer starts
- **THEN** it requests a `webgl` context with the attributes above and issues one draw call per frame

### Requirement: Motion
All motion SHALL be a continuous function of elapsed time `t` in seconds (uniform `u_time`), slow (wave phase speed at most 0.15 viewport widths per second, fold sway amplitude at most 3% of the viewport width) and eased. `t` SHALL never reset and no periodic loop with a restart SHALL be used, so no seam occurs. While paused, `t` SHALL stop advancing and on resume SHALL continue from the paused value without a jump.

#### Scenario: Pause and resume
- **WHEN** the document becomes hidden for 60 s and then visible again
- **THEN** `u_time` on the first frame after resume is within one clamped frame step of its value before the pause

### Requirement: Reveal scheduler
`src/ui/silkVeil/reveal.ts` SHALL be a pure, unit-testable module that schedules reveals with gaps drawn uniformly at random from 10 s to 20 s, measured from the end of the previous reveal; the first reveal SHALL fall in the same window after mount. Each reveal SHALL last a random 3 s to 5 s and rise with a smooth ease-in-out (no derivative jump) to `u_reveal = 1` and back to 0. The RNG SHALL be injectable. Elapsed-time accounting SHALL exclude paused (hidden) time.

#### Scenario: Gaps and durations
- **WHEN** 200 reveals are scheduled with a seeded RNG
- **THEN** every gap is within 10 s to 20 s, every duration within 3 s to 5 s, the gaps are not all equal, and the value is 0 at the start and end of each reveal and 1 at its plateau

#### Scenario: Paused time
- **WHEN** no time is advanced while the document is hidden
- **THEN** the scheduler state is unchanged

### Requirement: Reveal visual
At `u_reveal = 1` the shader SHALL displace the cloth toward one randomly chosen side (left or right, re-chosen per reveal), passing through it with a lifted curved edge. Cloth alpha SHALL drop to 0 over at least 40% of the viewport area, so the `#FFFFFF` base is visible there. At `u_reveal = 0` the cloth SHALL fully cover the view again.

#### Scenario: Coverage
- **WHEN** the shader tuning constants are inspected
- **THEN** the fully cleared share of the viewport at `u_reveal = 1` is at least 40% and the edge sits at the side boundary at `u_reveal = 0`

### Requirement: Performance
The device pixel ratio SHALL be capped at `min(devicePixelRatio, 1.5)` and the canvas backing store SHALL be scaled by a render scale between 0.5 and 0.75 (CSS upscales). Resize SHALL be handled with a window resize listener, applied at most once per animation frame. Rendering SHALL run on `requestAnimationFrame` only, with one draw call per frame.

#### Scenario: Backing store size
- **WHEN** the viewport is 1000x600 CSS pixels at a device pixel ratio of 3
- **THEN** the backing store is 1000 * 1.5 * scale by 600 * 1.5 * scale pixels, with the scale between 0.5 and 0.75

### Requirement: Pause
While `document.visibilityState` is `'hidden'` the rAF loop SHALL be cancelled and the reveal clock frozen; on `'visible'` it SHALL resume. On `webglcontextlost` the loop SHALL stop and the component SHALL switch to the fallback.

#### Scenario: Visibility
- **WHEN** `visibilitychange` fires while hidden
- **THEN** the pending animation frame is cancelled, and when it fires while visible a frame is requested again

### Requirement: Cleanup
On unmount the component SHALL cancel the pending animation frame, remove the `visibilitychange`, `resize` and `webglcontextlost` listeners, delete the shader, program and buffer, and call `WEBGL_lose_context.loseContext()` when available.

#### Scenario: Unmount
- **WHEN** a WebGL-mode `ExploreVeil` unmounts
- **THEN** the frame is cancelled, the listeners are removed, the GL objects are deleted and `loseContext` is called

### Requirement: Fallback selection
The static fallback SHALL be used when WebGL context creation fails or throws, when `matchMedia('(prefers-reduced-motion: reduce)')` matches (re-evaluated on change), or when a low-power heuristic holds: `navigator.hardwareConcurrency` at most 2, or `navigator.deviceMemory` at most 2 when defined, or `navigator.connection.saveData`. Detection SHALL live in `src/ui/silkVeil/capability.ts`.

#### Scenario: Selection
- **WHEN** reduced motion matches, or a low-power signal is present, or the context cannot be created
- **THEN** the veil renders `.explore-veil-fallback` and no canvas

### Requirement: Fallback look
`.explore-veil-fallback` SHALL be a static CSS fabric-like background (layered linear and radial gradients of the neutral palette, suggesting soft vertical folds) with no animation, transition or keyframes, and with every RGB channel at least `0xD0`.

#### Scenario: Static fabric
- **WHEN** `explore-veil.css` is read
- **THEN** `.explore-veil-fallback` has at least 2 linear gradients and a radial gradient, and the file contains no `@keyframes`, `animation:` (other than `none`) or `transition:` (other than `none`)
