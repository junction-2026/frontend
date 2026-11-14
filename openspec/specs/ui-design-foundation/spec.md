# ui-design-foundation Specification

## Purpose
Defines the frontend design foundation shared by every screen: self-hosted fonts, design tokens and ported base CSS, the History-API router and its routes, the app shell with navigation and backend health indicator, the MockBadge for unconnected areas and the mock register.

## Requirements

### Requirement: Self-hosted fonts
Newsreader (optical size axis, weights 500 and 600, normal and italic) and Plus Jakarta Sans (400, 500, 600, 700) SHALL be served from bundled woff2 files (the `@fontsource-variable/newsreader` and `@fontsource/plus-jakarta-sans` packages, which carry the OFL licence) with `font-display: swap`. `index.html`, `src/**` and `dist/**` SHALL contain no `fonts.googleapis.com` or `fonts.gstatic.com` URL; a vitest test scans `index.html` and `src`.

#### Scenario: No third-party font URL
- **WHEN** the test scans `index.html` and every file under `src`
- **THEN** none contains `fonts.googleapis.com` or `fonts.gstatic.com`

#### Scenario: Bundled font files
- **WHEN** the app is built
- **THEN** `dist/assets` contains woff2 files for both families and the generated CSS declares `font-display: swap`

### Requirement: Design tokens and ported CSS
Colours, radii, shadows, spacing and the type scale of `UI_DESIGN/css/styles.css` SHALL be CSS custom properties in `src/styles/tokens.css`. The base and component CSS (shell, card, soft-card, btn-primary, btn-secondary, btn-link, status-pill colours, tag colours, meta-row, page-head, bar, toggle, badge-soft, badge-blue) SHALL be React-owned CSS in `src/styles/`, not copied markup.

#### Scenario: Tokens available
- **WHEN** a component uses `var(--radius)` or `var(--blue)`
- **THEN** the value is defined in `src/styles/tokens.css`

### Requirement: Routing
A dependency-free History-API router SHALL map `/` to Home, `/jobs/:id/live` to Analyzing, `/jobs/:id` to Results, `/jobs/:id/detail` to Detail, `/history` to History, `/explore` to Explore, `/explore/region` to Region, `/ask` to Ask, `/settings` to Settings and `/states` to States (mock edge cases). An unknown path SHALL render Home. Links SHALL be `<a href>` elements whose plain left clicks are intercepted for client navigation, and every navigation SHALL scroll to the top.

#### Scenario: Known route
- **WHEN** the path is `/jobs/abc/detail`
- **THEN** the Detail view is rendered inside the shell with job id `abc`

#### Scenario: Unknown route
- **WHEN** the path is `/nope`
- **THEN** the Home view is rendered

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
The top bar SHALL show the brand link to `/`, the nav Analyze, Explore, History (no count), the functional language selector (not wrapped in `Mock`), "+ New Analysis" to `/` and an account button to `/settings`, with texts from the active locale. The active nav item is Analyze for `/`, `/jobs/*`, `/ask`, `/states`; Explore for `/explore*`; History for `/history`, with `aria-current="page"`.

#### Scenario: Active state
- **WHEN** the path is `/explore/region`
- **THEN** only the Explore nav item is active

#### Scenario: Job path
- **WHEN** the path is `/jobs/abc`
- **THEN** only the Analyze nav item is active

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
Each of `src/views/{Home,Analyzing,Results,Detail,History,Explore,Region,Ask,States,Settings}View.tsx` SHALL default-export a component rendering its page heading (`h1`), so that routes are testable before the screen tasks replace them.

#### Scenario: Stub heading
- **WHEN** the path is `/history`
- **THEN** an h1 "History" is shown in the shell

### Requirement: Mock areas register
`docs/mock-areas.md` SHALL list every marked mock area by route and element; each screen task appends its rows. The top-bar language selector is functional and SHALL NOT be marked mock or listed.

#### Scenario: Language selector not listed
- **WHEN** a reader opens `docs/mock-areas.md`
- **THEN** it has no row for the top-bar language selector or the Home language chip

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
