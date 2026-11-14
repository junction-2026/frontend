## MODIFIED Requirements

### Requirement: Self-hosted fonts
Inter (variable weight axis, normal and italic, `@fontsource-variable/inter`, OFL) SHALL be the only text family, served from bundled woff2 with `font-display: swap`; the Plus Jakarta Sans and Newsreader packages SHALL be removed. No `fonts.googleapis.com` or `fonts.gstatic.com` URL SHALL appear in `index.html`, `src/**` or `dist/**`; a vitest test scans `index.html` and `src` and asserts `fonts.css` imports only Inter (`wght`, `wght-italic`).

#### Scenario: No third-party font URL
- **WHEN** the test scans `index.html` and every file under `src`
- **THEN** none contains `fonts.googleapis.com` or `fonts.gstatic.com`

#### Scenario: Bundled font files
- **WHEN** the app is built
- **THEN** `dist/assets` contains Inter woff2 files, no Plus Jakarta Sans or Newsreader files, and the generated CSS declares `font-display: swap`

### Requirement: Design tokens and ported CSS
Colours, radii, shadows, spacing and the type scale SHALL be CSS custom properties in `src/styles/tokens.css`. The base and component CSS (shell, card, soft-card, btn-primary, btn-secondary, btn-link, status-pill colours, tag colours, meta-row, page-head, bar, toggle, badge-soft, badge-blue) SHALL be React-owned CSS in `src/styles/`, not copied markup.

#### Scenario: Tokens available
- **WHEN** a component uses `var(--radius)` or `var(--progress-active)`
- **THEN** the value is defined in `src/styles/tokens.css`

## ADDED Requirements

### Requirement: Neutral surface tokens
`tokens.css` SHALL define at least `--font: "Inter Variable", Inter, system-ui, sans-serif`, `--bg: #fafaf9`, `--surface: #ffffff`, `--line: #ecece9`, `--ink: #171717`, `--muted: #737373`, `--shadow: 0 1px 2px rgba(17,17,17,0.04)`, `--progress-active: #3b82f6` and `--progress-track: #eaf2ff`. `--serif` SHALL be removed or aliased to `var(--font)`; verdict tokens are unchanged.

#### Scenario: Muted text contrast
- **WHEN** `--muted` is compared with `--bg`
- **THEN** the contrast ratio is at least 4.5:1

### Requirement: Type scale
`tokens.css` SHALL define `--fw-regular: 400`, `--fw-medium: 500` and `--fw-semibold: 600`. Body and secondary text uses 400, navigation and buttons 500, section headings 500-600, the main progress heading 600 and small metadata 400-500. No stylesheet under `src` SHALL use a font weight above 600 or `bold`/`bolder`; a vitest scan enforces this. Every `font-family` SHALL resolve to `var(--font)`, except monospace for ids and durations.

#### Scenario: Weight ceiling
- **WHEN** the test scans `src/**/*.css`
- **THEN** no `font-weight` is above 600 and none is `bold` or `bolder`

### Requirement: Base surface
The `body` background SHALL be the solid `var(--bg)` with no gradient or overlay. `body` SHALL set `-webkit-font-smoothing: antialiased`, `-moz-osx-font-smoothing: grayscale` and `font-synthesis-weight: none`.

#### Scenario: No gradient
- **WHEN** `base.css` is read
- **THEN** the `body` rule's background contains no `gradient`

### Requirement: Quote typography
Quote and excerpt text (`.quote-text`, `.job-text`, `.anchor`, `.wiki-passage`, `.wiki-evidence`, `.wiki-values`) SHALL use `var(--font)` in italic at weight 400, not a serif family.

#### Scenario: Quote font
- **WHEN** a quote is rendered
- **THEN** its font family is `var(--font)` and its style is italic
