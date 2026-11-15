# ui-design-foundation Specification

## Purpose
Defines the frontend design foundation shared by every screen: self-hosted fonts, design tokens and ported base CSS, the History-API router and its routes, the app shell with navigation and backend health indicator, the MockBadge for unconnected areas and the mock register.

## Requirements

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

### Requirement: Routing
A dependency-free History-API router SHALL map `/` to Home, `/jobs/:id/live` to Analyzing, `/jobs/:id` to Results, `/jobs/:id/detail` to Detail, `/jobs/:id/ask` to Ask, `/history`, `/explore`, `/explore/region`, `/ask` and `/states` to their views. It SHALL NOT map `/settings`, and `RouteName` and `navFor` SHALL have no settings case. An unknown path SHALL render Home. Plain left clicks on links SHALL navigate client-side and scroll to the top.

#### Scenario: Known route
- **WHEN** the path is `/jobs/abc/detail`
- **THEN** the Detail view is rendered inside the shell with job id `abc`

#### Scenario: Ask route
- **WHEN** the path is `/jobs/abc/ask`
- **THEN** the Ask view is rendered for job `abc`

#### Scenario: Unknown route
- **WHEN** the path is `/nope`
- **THEN** the Home view is rendered

#### Scenario: Settings is gone
- **WHEN** the path is `/settings` or `/settings/x`
- **THEN** the Home view is rendered and the Analyze nav item is active

#### Scenario: States stays routed
- **WHEN** the path is `/states`
- **THEN** the States view is rendered

#### Scenario: Client navigation
- **WHEN** the user clicks a link to `/history`
- **THEN** the URL changes without a reload, the History view is shown and the window is scrolled to the top

### Requirement: Legacy job link
`/?job=<id>` with a non-empty id SHALL replace the URL with `/jobs/<id>` (id URL-encoded) without reloading.

#### Scenario: Legacy link
- **WHEN** the URL is `/?job=a%20b`
- **THEN** the URL becomes `/jobs/a%20b` and the Results view is rendered for id `a b`

#### Scenario: Empty job parameter
- **WHEN** the URL is `/?job=`
- **THEN** the URL is unchanged and Home is rendered

### Requirement: Shell and navigation
The top bar SHALL show the brand link to `/`, the nav Analyze, Explore, History (no count), the health indicator, and the functional language selector (not wrapped in `Mock`), with texts from the active locale. It SHALL NOT show a "+ New Analysis" button or an account or avatar link, and keeps its spacing in LTR and RTL at 1440, 768 and 390px. The active nav item is Analyze for `/`, `/jobs/*`, `/ask`, `/states`; Explore for `/explore*`; History for `/history`, with `aria-current="page"`.

#### Scenario: Active state
- **WHEN** the path is `/explore/region`
- **THEN** only the Explore nav item is active

#### Scenario: Job path
- **WHEN** the path is `/jobs/abc`
- **THEN** only the Analyze nav item is active

#### Scenario: No account link
- **WHEN** the top bar renders
- **THEN** no link named "Account" and no link to `/settings` exists, and the `.avatar` styles and the `shell.account` key of every locale are removed

#### Scenario: No New Analysis button
- **WHEN** any route is rendered in any locale
- **THEN** the top bar contains no link or button with the text of the former `shell.new_analysis` key, and the brand link and the Analyze nav item link to `/`

#### Scenario: Selector markup
- **WHEN** the top bar renders
- **THEN** a native `<select class="lang-select">` named "Language" lists English, Français, العربية, Deutsch, Suomi with `lang` attributes and the active locale as value

#### Scenario: Language selector
- **WHEN** the user picks Deutsch in the selector
- **THEN** the nav reads "Analysieren", "Entdecken", "Verlauf" without a reload

### Requirement: Backend health indicator
The top bar SHALL call `checkHealth()` once on mount and show a status dot with the text "Backend online" on success; while pending, "Checking backend…" with `role="status"`; on failure, "Backend offline" with the checkHealth message as its tooltip (`title`) and `role="alert"`. The page "Hello, World!" SHALL no longer exist.

#### Scenario: Offline
- **WHEN** `/healthz` returns 503
- **THEN** the indicator reads "Backend offline", has role alert and its title contains "HTTP 503"

### Requirement: MockBadge
`src/ui/MockBadge.tsx` SHALL export `<Mock label?>` that wraps its children with a dashed outline in a dedicated token colour (`--mock`) and a small uppercase "MOCK" badge. The wrapper SHALL have `data-mock="true"`, a `title` of "Mock data – not connected to the backend" (followed by the label when given) and an `aria-label` containing "mock"; it SHALL be visible without devtools. Real data SHALL NOT be wrapped in it.

#### Scenario: Rendering
- **WHEN** `<Mock label="Language">English</Mock>` is rendered
- **THEN** the text "MOCK" is visible, the wrapper has `data-mock="true"`, a title containing "Mock data – not connected to the backend" and "Language", and an aria-label containing "mock"

### Requirement: Stub views
Each of `src/views/{Home,Analyzing,Results,Detail,History,Explore,Region,Ask,States}View.tsx` SHALL default-export a component rendering its page heading (`h1`), so that routes are testable before the screen tasks replace them.

#### Scenario: Stub heading
- **WHEN** the path is `/history`
- **THEN** an h1 "History" is shown in the shell

### Requirement: Mock areas register
`docs/mock-areas.md` SHALL list every marked mock area by route and element; each screen task appends its rows. The top-bar language selector is functional and SHALL NOT be marked mock or listed. The register SHALL have no row for the `/jobs/:id` detailed-region items "Polarity / Intensity", "High rhetorical bias factor" and Share (removed from the screen), and none for the `/jobs/:id/detail` metrics bar (Risk and Latency are real).

#### Scenario: Language selector not listed
- **WHEN** a reader opens `docs/mock-areas.md`
- **THEN** it has no row for the top-bar language selector or the Home language chip

#### Scenario: Removed Results items not listed
- **WHEN** a reader opens `docs/mock-areas.md`
- **THEN** it has no row for Polarity / Intensity, the bias factor, the Share button or the `/jobs/:id/detail` metrics bar

### Requirement: Product brand
The document `<title>` SHALL be "VEIL / Intelligence". The top-bar brand link SHALL read "VEIL" followed by the translated brand subtitle ("Intelligence" in `en`) and point to `/`. The brand name "VEIL" SHALL NOT be translated in any locale.

#### Scenario: Brand in en
- **WHEN** the app is shown in `en`
- **THEN** the document title is "VEIL / Intelligence" and the banner brand link reads "VEIL / Intelligence" and points to `/`

### Requirement: Logical properties and mirrored glyphs
The stylesheets in `src/styles`, `src/history` and `src/secondary` SHALL use logical properties (`margin-inline-*`, `padding-inline-*`, `inset-inline-*`, `border-inline-*`, `text-align: start|end`) instead of physical left/right ones, and directional glyphs (chevrons, arrows, the submit arrow, the search glyph) SHALL be mirrored under `[dir=rtl]` with the `mirror-rtl` class. No colour, typography or spacing value SHALL change.

#### Scenario: Arabic shell
- **WHEN** the locale is ar
- **THEN** html has dir rtl and the navigation, buttons and expandable sections are mirrored with the same colours, type and spacing as in en

### Requirement: Verdict tokens
`src/styles/tokens.css` SHALL define per verdict state a background, border, heading, text, pill background and pill text token (`--verdict-<state>-bg|border|heading|text|pill-bg|pill-text`) and `--radius-verdict` of 30px. Heading, text and pill text SHALL reach at least 4.5:1 contrast on the background and on the pill background, and a unit test computes this from the token values.

#### Scenario: Contrast
- **WHEN** the test reads the token values for the three states
- **THEN** heading, text and pill text each reach at least 4.5:1 on bg and on pill bg

#### Scenario: Detected values
- **WHEN** the verdict state is detected
- **THEN** bg is #FDE8E8, border #F5B8B8, heading, text and pill text #8B2525, and pill bg #FDE8E8

#### Scenario: Uncertain values
- **WHEN** the verdict state is uncertain
- **THEN** bg is #FFF1DC, border #F2D49B, heading, text and pill text #8A5A18, and pill bg #FFF1DC

#### Scenario: Not detected values
- **WHEN** the verdict state is not_detected
- **THEN** bg is #E5F7EC, border #A8E4BF, heading, text and pill text #246B45, and pill bg #E5F7EC

### Requirement: Neutral surface tokens
`tokens.css` SHALL define at least `--font: "Inter Variable", Inter, system-ui, sans-serif`, `--bg: #fafaf9`, `--surface: #ffffff`, `--line: #ecece9`, `--ink: #171717`, `--muted: #737373`, `--shadow: 0 1px 2px rgba(17,17,17,0.04)`, `--progress-active: #3b82f6` and `--progress-track: #eaf2ff`. `--serif` SHALL be removed or aliased to `var(--font)`. The verdict tokens follow the Verdict tokens requirement.

#### Scenario: Muted text contrast
- **WHEN** `--muted` is compared with `--bg`
- **THEN** the contrast ratio is at least 4.5:1

### Requirement: Type scale
`tokens.css` SHALL define `--fw-regular: 400`, `--fw-medium: 500` and `--fw-semibold: 600`. Body and secondary text uses 400, navigation and buttons 500, section headings 500-600, the main progress heading 600 and small metadata 400-500. No stylesheet under `src` SHALL use a font weight above 600 or `bold`/`bolder`, except `.verdict h2` using `var(--fw-extrabold)`; a vitest scan enforces this. Every `font-family` SHALL resolve to `var(--font)`, except monospace for ids and durations.

#### Scenario: Weight ceiling
- **WHEN** the test scans `src/**/*.css`
- **THEN** no `font-weight` is above 600 and none is `bold` or `bolder`, and `var(--fw-extrabold)` appears only in the `.verdict h2` rule

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

### Requirement: Verdict headline weight token
`src/styles/tokens.css` SHALL define `--fw-extrabold: 800`. It SHALL be used only by the Results verdict headline (`.verdict h2`) and is the sole exception to the Type scale weight ceiling.

#### Scenario: Token value
- **WHEN** the test reads tokens.css
- **THEN** `--fw-extrabold` is 800
