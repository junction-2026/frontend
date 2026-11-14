## ADDED Requirements

### Requirement: Risk score section placement
The Results screen SHALL render a Risk Score section above the verdict card when `Job.risk` is a non-null object. With `risk` null or missing it SHALL render no risk content and no error, and the rest of the screen SHALL be unchanged. This reads the shared capability `manipulation-risk-score` (shared-specs@3949bec3d32a399427d239e3147239fa1e716cfe).

#### Scenario: Job with a risk score
- **WHEN** the job has `risk` with `status: "scored"`
- **THEN** the Risk Score section appears before the verdict card

#### Scenario: Job without a risk score
- **WHEN** `risk` is null or the member is missing
- **THEN** no risk section is rendered and no error is shown

### Requirement: Risk score headline
For a scored risk the headline SHALL show `Math.round(score * 100)` percent formatted with the locale number formatter, a band chip with the localized band label, and a one-line summary composed from catalog texts by band and first driver, falling back to the server `summary` for an unknown band or driver kind.

#### Scenario: Scored high
- **WHEN** `score` is 0.5932 and `band` is `high`
- **THEN** the headline shows `59%` and a `High risk` chip

### Requirement: Risk band colours
Band chips SHALL use design tokens: low green, moderate yellow, high orange, critical red, with chip text contrast of at least 4.5:1. An unknown band SHALL be styled like moderate and show its id.

#### Scenario: Unknown band
- **WHEN** `band` is `extreme`
- **THEN** the chip shows `extreme` with the moderate colours and the server summary is shown

### Requirement: Risk score context is required
A scored risk without a finite score from 0 to 1, a band or at least one driver SHALL be shown like an unavailable one, and an unknown `status` SHALL be treated as unavailable, so a score never appears without its band, drivers and caveats.

#### Scenario: Scored without drivers
- **WHEN** `status` is `scored` and `drivers` is empty
- **THEN** no percentage is shown

### Requirement: Risk score unavailable
For an unavailable risk the section SHALL show no percentage or band, SHALL explain the `reason` from the catalog (an unknown reason reads as "input not available"), and SHALL still show the info button, the dimension notes and the caveats.

#### Scenario: Nothing to score
- **WHEN** `status` is `unavailable` and `reason` is `no_content_signals`
- **THEN** no percentage is shown, the reason is explained and the caveats are listed

### Requirement: Risk score info tooltip
An info button with an `aria-label` from the catalog SHALL sit beside the headline of every risk section. Its tooltip SHALL open on hover, focus and tap and close on blur and Escape; it SHALL name the three observations (manipulative techniques, propaganda-like writing patterns, signs of artificial amplification) and state that the rating describes the content, not reader reactions. In every locale it SHALL NOT name a model, algorithm, classifier or probability value.

#### Scenario: Keyboard access
- **WHEN** the info button receives focus
- **THEN** a `role="tooltip"` with the description is shown and the button is described by it

### Requirement: Risk dimension breakdown
The section SHALL show one horizontal bar per available dimension (intensity, confirmation, amplification) from 0 to 100 percent with a label, the formatted value and `role="meter"` with `aria-valuenow`. An unavailable dimension SHALL show a note by `reason` (`no_author_context`, `analyzer_unavailable`, `no_bot_score`, `no_scores`; an unknown reason reads as "input not available"). A dimension with `confidence` `low` or amplification `basis` `single_text` SHALL carry a low-confidence marker.

#### Scenario: Amplification unavailable
- **WHEN** `dimensions.amplification` has `available: false` and `reason: "no_author_context"`
- **THEN** two bars and a note for amplification are shown

### Requirement: Risk detected techniques
The section SHALL list `risk.techniques` in their order, each with the display name (the localized technique name where the technique catalog has it, otherwise the server `display`, otherwise the `label`), the probability as a percentage and the impact group label (an unknown group shows its id).

#### Scenario: Two techniques
- **WHEN** `techniques` lists `Loaded_Language` (0.7, high) and `Doubt` (0.35, lower)
- **THEN** two rows show the names, `70%`, `35%` and the group labels in that order

### Requirement: Risk drivers
The section SHALL show each driver as one localized sentence keyed by `kind` (and the technique name for `technique`), falling back to the server `text`; kind `none` shows the no-signal sentence.

#### Scenario: Technique driver
- **WHEN** a driver has `kind: "technique"` and `technique: "Loaded_Language"`
- **THEN** the sentence names the localized technique

### Requirement: Risk caveats
The section SHALL show a collapsible region opened by a button with `aria-expanded`, listing the localized text of each caveat by `id` with the server `text` as fallback for an unknown id. `content_not_reader` SHALL always be listed, also when the server omits it. Caveats SHALL be expanded initially.

#### Scenario: Collapse
- **WHEN** the caveats button is activated
- **THEN** `aria-expanded` becomes `false` and the list is hidden

### Requirement: Risk text rendering and catalog
Server texts (`summary`, driver and caveat `text`, technique `display`, unknown ids) SHALL be rendered as plain text. All fixed texts SHALL be `risk.*` keys of the `results` namespace in en, fr, ar, de, fi and ru, and the section SHALL use logical CSS properties so it lays out in right-to-left languages.

#### Scenario: Markup in a server text
- **WHEN** a caveat with an unknown id has the text `<b>x</b>`
- **THEN** `<b>x</b>` is shown literally
