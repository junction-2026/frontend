## ADDED Requirements

### Requirement: Risk card type scale
The risk card SHALL use only four text styles (title, body, section heading and secondary text) as defined in the scenarios. Numbers SHALL use `font-variant-numeric: tabular-nums`.

#### Scenario: Title and body
- **WHEN** the card is rendered
- **THEN** the title `.risk-title` is 1rem with `var(--fw-semibold)`; body text (`.risk-summary`, `.risk-unavailable`, dimension labels and values, technique names and percentages, driver and caveat sentences) is 0.875rem with `var(--fw-regular)`, except dimension labels and percentages which use `var(--fw-medium)`

#### Scenario: Section heading and disclosure buttons
- **WHEN** the card shows `.risk-subtitle` headings and the Main drivers and Caveats buttons (`.risk-toggle`)
- **THEN** all are styled by one shared rule: 0.75rem, `var(--fw-semibold)`, `var(--muted)`, uppercase, letter-spacing 0.04em, no extra inline padding or indent, and they start at the same inline-start edge as the card content

#### Scenario: Secondary text
- **WHEN** the card shows the short dimension reason, `n/a`, the impact badge, the low-confidence marker or Show all / Show less
- **THEN** they are 0.75rem, `var(--fw-medium)` for badges and `var(--fw-regular)` for text, coloured `var(--muted)` or `var(--ink-2)`

### Requirement: Risk card spacing rhythm
Sections (`.risk-block`) SHALL be separated by one gap of 0.875rem, with 0.375rem between a section heading and its content. The card padding SHALL stay 0.8rem 1rem. Disclosure chevrons SHALL be the same 0.75rem glyph placed after the label with a 0.375rem gap and mirrored in right-to-left.

#### Scenario: Section gap
- **WHEN** the card shows several sections
- **THEN** every pair of sections is separated by the same 0.875rem gap

### Requirement: Risk dimension layout at narrow widths
`.risk-dims` SHALL use `grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr))` with a 1rem column gap. At card widths below 30rem it SHALL stack into one column, with all cells the same height and aligned label, value and track.

#### Scenario: Narrow card
- **WHEN** the card is narrower than 30rem
- **THEN** the three dimension cells are stacked in one column without overlap

### Requirement: Risk card theming and right-to-left
`riskScore.css` SHALL use only colour tokens from `src/styles/tokens.css` (no hex, rgb or hsl literals), only logical properties (no left/right/margin-left/padding-right/text-align:left and similar) and no font weight above 600. Secondary text and badges SHALL reach a contrast of at least 4.5:1 against `var(--surface)` using the existing tokens.

#### Scenario: Stylesheet scan
- **WHEN** `riskScore.css` is scanned
- **THEN** it has no colour literals, no physical-direction properties and no font weight above 600

### Requirement: Risk catalog keys for the calm layout
The `results` namespace SHALL contain in en, fr, ar, de, fi and ru the keys `risk.na`, `risk.reason_short.<reason>` for `no_author_context`, `analyzer_unavailable`, `no_bot_score`, `no_scores` and `unknown`, and `risk.drivers_count` (with `{n}` formatted by the locale number formatter). All existing `risk.*` keys SHALL be kept unchanged, and the short reasons SHALL NOT repeat the dimension name.

#### Scenario: English texts
- **WHEN** the locale is en
- **THEN** the keys read "n/a", "No author information", "Check not available", "No usable author signal", "No detailed scores stored", "Input not available" and "Main drivers ({n})"

#### Scenario: Arabic render
- **WHEN** the risk card is rendered in Arabic
- **THEN** no new key falls back to the catalog placeholder

## MODIFIED Requirements

### Requirement: Risk dimension breakdown
Every dimension cell SHALL use one grid: row 1 holds the label at inline-start, an optional low-confidence pill after the label and the value at inline-end; row 2 is a 4px track in the single `--progress-active` colour; row 3 is a single secondary line of reserved height (one line, ellipsis on overflow, full text in a `title` attribute).

#### Scenario: Available dimension
- **WHEN** a dimension is available
- **THEN** it shows the formatted percentage and a filled track with `role="meter"`, `aria-label`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow` and `aria-valuetext`, and row 3 stays empty but keeps its height

#### Scenario: Amplification unavailable
- **WHEN** `dimensions.amplification` has `available: false` and `reason: "no_author_context"`
- **THEN** two meters are shown, and the amplification cell shows `n/a`, an empty track with `aria-hidden="true"` and no meter role, and the short reason `results.risk.reason_short.no_author_context` in row 3 (an unknown reason uses `results.risk.reason_short.unknown`)
- **AND** the sentence `results.risk.reason.<reason>` with `{dimension}` is rendered in a `.sr-only` span so screen readers get the full explanation

#### Scenario: Low confidence
- **WHEN** a dimension has `confidence` `low` or amplification `basis` `single_text`
- **THEN** its cell carries the low-confidence marker as a small pill after the label

#### Scenario: Same structure in every state
- **WHEN** a dimension is scored, low-confidence or unavailable
- **THEN** its cell has the same label, value, track and secondary-line elements and the same block size

### Requirement: Risk detected techniques
The technique list SHALL be a grid with the columns `minmax(0,1fr) auto auto` (name, percentage, impact) shared by all rows and a `max-inline-size` of 36rem. Order, names (localized technique name, otherwise server `display`, otherwise `label`) and percentages are those of `risk.techniques`.

#### Scenario: Two techniques
- **WHEN** `techniques` lists `Loaded_Language` (0.7, high) and `Doubt` (0.35, lower)
- **THEN** two rows show, in DOM order within one row element, the name, `70%` or `35%` and the impact badge

#### Scenario: Row style
- **WHEN** several techniques are listed
- **THEN** rows are separated by a 1px `border-block-end` in `var(--line)` with none after the last row, the percentage is end-aligned with tabular numbers, and long names wrap within the name column

#### Scenario: Impact badge
- **WHEN** a technique has an impact group
- **THEN** the label is a pill badge (border 1px `var(--line-strong)`, `var(--radius-pill)`, 0.75rem, `var(--ink-2)`) of the same style for every group, and an unknown group shows its id

#### Scenario: Missing impact group
- **WHEN** a technique has no impact group
- **THEN** no impact badge is rendered for that row, and its name and percentage stay in their columns

### Requirement: Risk drivers
For a scored risk, Main drivers SHALL be a disclosure button labelled `results.risk.drivers_count` with the driver count, styled like the Caveats toggle, collapsed initially, with `aria-expanded` and `aria-controls` pointing to a region with `aria-label` `results.risk.drivers`. Expanded, it lists every driver with no Show all toggle.

#### Scenario: Collapsed by default
- **WHEN** a scored risk with five drivers is shown
- **THEN** the button reads "Main drivers (5)" with `aria-expanded="false"` and no driver sentence is shown

#### Scenario: Expand and collapse
- **WHEN** the Main drivers button is activated
- **THEN** all five sentences are listed with no Show all button, and activating it again hides them

#### Scenario: Technique driver
- **WHEN** a driver has `kind: "technique"` and `technique: "Loaded_Language"`
- **THEN** the expanded sentence names the localized technique; other kinds use the localized sentence keyed by `kind`, falling back to the server `text`, and kind `none` shows the no-signal sentence

### Requirement: Risk caveats
The Caveats toggle SHALL use the shared disclosure style (`.risk-toggle`) and the inline-start alignment of the section headings, and open a collapsible region with `aria-expanded` and `aria-controls`, listing the localized text of each caveat by `id` with the server `text` as fallback for an unknown id. `content_not_reader` SHALL always be listed, also when the server omits it. Caveats SHALL be collapsed initially.

#### Scenario: Expand
- **WHEN** the caveats button is activated
- **THEN** `aria-expanded` becomes `true` and the list, including `content_not_reader`, is shown

#### Scenario: Collapse
- **WHEN** the expanded caveats button is activated
- **THEN** `aria-expanded` becomes `false` and the list is hidden

### Requirement: Compact risk overview
The overview SHALL be a single section in this order: the heading `results.risk.title` with the info button, the summary or unavailable reason, Breakdown, Detected techniques (hidden when intensity is unavailable and no techniques are present), the Main drivers disclosure (scored only) and the Caveats disclosure. No percentage headline is shown.

#### Scenario: Overview content
- **WHEN** a scored risk is shown
- **THEN** one section holds the heading, info button, summary, three dimensions, techniques, a Main drivers disclosure and a Caveats disclosure, and no percentage headline

### Requirement: Compact risk lists
Detected techniques SHALL show at most the first 3 entries by default. When there are more, a button "Show all (N)" / "Show less" with `aria-expanded` and `aria-controls` pointing to the list SHALL toggle the full list, so every entry stays reachable. With 3 or fewer entries no toggle is shown. Drivers use the Main drivers disclosure instead and have no Show all toggle.

#### Scenario: Five techniques
- **WHEN** `techniques` has five entries
- **THEN** three are listed with a "Show all (5)" button whose `aria-expanded` is false; activating it lists all five and the button reads "Show less"
