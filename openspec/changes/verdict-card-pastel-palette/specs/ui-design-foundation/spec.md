## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Verdict headline weight token
`src/styles/tokens.css` SHALL define `--fw-extrabold: 800`. It SHALL be used only by the Results verdict headline (`.verdict h2`) and is the sole exception to the Type scale weight ceiling.

#### Scenario: Token value
- **WHEN** the test reads tokens.css
- **THEN** `--fw-extrabold` is 800
