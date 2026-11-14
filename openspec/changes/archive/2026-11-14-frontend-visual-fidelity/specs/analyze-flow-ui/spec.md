## ADDED Requirements

### Requirement: Progress ring
The live view ring SHALL be an inline SVG of 56px outer diameter with a 2.5px stroke, track `var(--progress-track)`, arc `var(--progress-active)` with a round linecap, and one centered activity (pulse) icon of about 18px in `var(--progress-active)`. It SHALL stay `aria-hidden` and SHALL NOT display a fabricated percentage; the determinate value remains the progress bar.

#### Scenario: Running
- **WHEN** the job is not terminal
- **THEN** the ring has no `idle` class and rotates indeterminately (about 1.2s, linear)

#### Scenario: Terminal
- **WHEN** the job is terminal
- **THEN** the ring has the `idle` class and does not animate

#### Scenario: Reduced motion
- **WHEN** `prefers-reduced-motion: reduce` applies
- **THEN** the ring does not animate

### Requirement: Analyzing layout
The quote banner, progress panel and Active Worker Ledger SHALL share one centered column of max-width 780px with inline padding of at least 16px below 640px. Only logical properties are used, so the layout holds under `dir="rtl"`. The existing Live view state, Live progress, ledger, cancel, terminal and RTL requirements are unchanged.

#### Scenario: Column width
- **WHEN** the analyzing view is rendered
- **THEN** the banner, progress panel and ledger are inside one column with `max-width: 780px`

### Requirement: Analyzing progress panel styling
The heading SHALL use weight 600, about 1.5rem and letter-spacing about -0.02em; the subtitle weight 400, about 1rem, `var(--muted)`, centered, max-width about 34rem. The progress bar is 4-6px high with track `var(--progress-track)` and fill `var(--progress-active)`. The hide-details control is a pill chip with a caret and Cancel is a text button.

#### Scenario: Bar colours
- **WHEN** progress is shown
- **THEN** the bar track is `var(--progress-track)` and its fill `var(--progress-active)`

### Requirement: Ledger header
The ledger header SHALL be a light grey band with a small uppercase, letter-spaced pool label at the inline end.

#### Scenario: Header band
- **WHEN** the ledger is shown
- **THEN** its header has the light band and the pool label at the inline end
