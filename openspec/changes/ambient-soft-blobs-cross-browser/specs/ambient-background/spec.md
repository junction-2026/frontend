## MODIFIED Requirements

### Requirement: Blob palette
Blobs SHALL use only the colours #C4B5FD, #93C5FD, #86EFAC, #FDBA9A and #F9A8D4, each at least once. A colour stop SHALL be a palette colour as `#RRGGBB`, a palette colour with alpha as `#RRGGBBAA`, or `transparent`. No other colour notation and no other hex colour SHALL appear in ambient.css.

#### Scenario: Palette
- **WHEN** `ambient.css` is read
- **THEN** every hex colour is a palette colour with optional alpha suffix and no rgb(), hsl() or other hex is present

### Requirement: Blob shape, blur and placement
Each blob SHALL be absolutely positioned, between 300px and 600px on its longer side (it MAY shrink with `vw` on narrow viewports, `max-width: 90vw`), have unequal width and height and opacity 0.4. `filter: blur()` SHALL stay on `.ambient-blob` as extra smoothing with a radius of 40px to 160px (60px chosen; at most 100px if lowered for WebKit caps). At least one blob SHALL be anchored past the left edge, one past the right edge, and one SHALL sit near the horizontal centre.

#### Scenario: Shape
- **WHEN** `ambient.css` is read
- **THEN** blob sizes are 300px to 600px, width differs from height, blur is 40px to 160px and opacity is 0.4

#### Scenario: Placement
- **WHEN** `ambient.css` is read
- **THEN** a blob has a negative `left`, a blob has a negative `right` and a blob is placed near the horizontal centre

### Requirement: Blob animation
Keyframes, names, durations (18s to 35s), delays, `ease-in-out` easing and `infinite` iteration SHALL stay unchanged. Only `transform` SHALL be animated and `will-change: transform` SHALL be kept on `.ambient-blob`. No new animated property, `backdrop-filter`, `translateZ`/3D hack, extra pseudo-element layer or SVG filter SHALL be added.

#### Scenario: Motion
- **WHEN** `ambient.css` is read
- **THEN** keyframes declare only `transform` and no backdrop-filter or 3D hack is present

## ADDED Requirements

### Requirement: Gradient falloff
Each `.ambient-blob-N` background SHALL be one `radial-gradient(closest-side, ...)` of a single palette colour with at least 5 colour stops. Alpha SHALL decrease monotonically along an eased, non-linear curve from the centre. The last stop SHALL be `transparent` at 100% or earlier and no stop past 30% SHALL be fully opaque.

#### Scenario: Falloff
- **WHEN** `ambient.css` is read
- **THEN** every blob gradient has 5+ stops, non-increasing alpha, ends in transparent and has no opaque stop past 30%

### Requirement: Blur not clipped
The blurred blob SHALL NOT be visibly clipped by its own box or layer. Neither `.ambient-blob` nor `.ambient-bg` SHALL set `contain: paint`, `clip-path` or `overflow` other than the existing `overflow: hidden` on `.ambient-bg`.

#### Scenario: No clipping
- **WHEN** `ambient.css` is read
- **THEN** it has no `contain`, `clip-path` and exactly one `overflow` declaration, on `.ambient-bg`
