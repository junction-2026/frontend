## MODIFIED Requirements

### Requirement: Risk score section placement
The Results screen SHALL NOT render a risk section in `.results-stack`; the verdict card SHALL be its first item. The shared DetailedAnalysis body (`/jobs/:id/detail` and the detailed region of `/jobs/:id`) SHALL render the risk overview directly after the technique-list card and before the LLM-assessed group when `Job.risk` is a non-null object, and nothing (no error) when it is null or missing. Reads shared `manipulation-risk-score` (shared-specs@18e157ddd9d020aeb9af984d337bf47f5c970659).

#### Scenario: Job with a risk score
- **WHEN** the job has `risk` with `status: "scored"` and the detailed analysis is shown
- **THEN** the risk overview follows the technique-list card and precedes the LLM-assessed group, and no risk section is in the results stack

#### Scenario: Job without a risk score
- **WHEN** `risk` is null or the member is missing
- **THEN** no risk overview is rendered and no error is shown

### Requirement: Risk score headline
The risk overview SHALL NOT repeat the percentage and band headline, which the metrics bar shows. For a scored risk it SHALL show a one-line summary composed from catalog texts by band and first driver, falling back to the server `summary` for an unknown band or driver kind. The metrics bar percentage SHALL be `Math.round(score * 100)` formatted with the locale number formatter, with a band chip carrying the localized band label.

#### Scenario: Scored high
- **WHEN** `score` is 0.5932 and `band` is `high`
- **THEN** the metrics bar shows `59%` and a `High risk` chip and the overview shows the summary sentence

### Requirement: Risk score unavailable
For an unavailable risk the overview SHALL show the unavailable text and `reason` from the catalog (an unknown reason reads as "input not available"), no percentage or band, and SHALL still show the info button, the dimension notes and the caveats.

#### Scenario: Nothing to score
- **WHEN** `status` is `unavailable` and `reason` is `no_content_signals`
- **THEN** the reason is explained, the caveats are available and the metrics Risk cell shows `—`

### Requirement: Risk score info tooltip
An info button with an `aria-label` from the catalog SHALL sit beside the heading `results.risk.title` of every risk overview. Its tooltip SHALL open on hover, focus and tap and close on blur and Escape; it SHALL name the three observations (techniques, propaganda-like writing patterns, artificial amplification) and say the rating describes the content, not reader reactions, without naming a model, algorithm, classifier or probability in any locale.

#### Scenario: Keyboard access
- **WHEN** the info button receives focus
- **THEN** a `role="tooltip"` with the description is shown and the button is described by it

### Requirement: Risk dimension breakdown
The overview SHALL render the three dimensions as one condensed row or tight list of slim meters, each with a label, the formatted value and `role="meter"` with `aria-label`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow` and `aria-valuetext`. An unavailable dimension SHALL show its reason note inline (an unknown reason reads as "input not available"). A dimension with `confidence` `low` or amplification `basis` `single_text` SHALL carry a low-confidence marker.

#### Scenario: Amplification unavailable
- **WHEN** `dimensions.amplification` has `available: false` and `reason: "no_author_context"`
- **THEN** two meters and an inline note for amplification are shown

### Requirement: Risk detected techniques
The overview SHALL list `risk.techniques` in their order, each with the display name (the localized technique name where the technique catalog has it, otherwise the server `display`, otherwise the `label`), the probability as a percentage and the impact group label (an unknown group shows its id).

#### Scenario: Two techniques
- **WHEN** `techniques` lists `Loaded_Language` (0.7, high) and `Doubt` (0.35, lower)
- **THEN** two rows show the names, `70%`, `35%` and the group labels in that order

### Requirement: Risk caveats
The overview SHALL show a collapsible region opened by a button with `aria-expanded` and `aria-controls`, listing the localized text of each caveat by `id` with the server `text` as fallback for an unknown id. `content_not_reader` SHALL always be listed, also when the server omits it. Caveats SHALL be collapsed initially.

#### Scenario: Expand
- **WHEN** the caveats button is activated
- **THEN** `aria-expanded` becomes `true` and the list, including `content_not_reader`, is shown

#### Scenario: Collapse
- **WHEN** the expanded caveats button is activated
- **THEN** `aria-expanded` becomes `false` and the list is hidden

### Requirement: Risk text rendering and catalog
Server texts (`summary`, driver and caveat `text`, technique `display`, unknown ids) SHALL be rendered as plain text. All fixed texts SHALL be `risk.*` keys of the `results` namespace (including `risk.show_all` and `risk.show_less`) in en, fr, ar, de, fi and ru, and the overview and the metrics chip SHALL use logical CSS properties so they lay out in right-to-left languages.

#### Scenario: Markup in a server text
- **WHEN** a caveat with an unknown id has the text `<b>x</b>`
- **THEN** `<b>x</b>` is shown literally

## ADDED Requirements

### Requirement: Compact risk overview
The overview SHALL be a single section with the heading `results.risk.title` and the info button beside it, using reduced spacing and type size compared to the former card. It SHALL contain at least the summary or unavailable reason, the dimensions, the detected techniques, the drivers and the caveats.

#### Scenario: Overview content
- **WHEN** a scored risk is shown
- **THEN** one section holds the heading, info button, summary, three dimensions, techniques, drivers and caveats, and no percentage headline

### Requirement: Compact risk lists
Detected techniques and drivers SHALL show at most the first 3 entries by default. When there are more, a button "Show all (N)" / "Show less" with `aria-expanded` and `aria-controls` pointing to the list SHALL toggle the full list, so every entry stays reachable. With 3 or fewer entries no toggle is shown.

#### Scenario: Five techniques
- **WHEN** `techniques` has five entries
- **THEN** three are listed with a "Show all (5)" button whose `aria-expanded` is false; activating it lists all five and the button reads "Show less"
