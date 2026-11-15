## MODIFIED Requirements

### Requirement: Home sample statements
The Home Try row SHALL render the samples energy, breaking, editorial and springfield, in that order, each as a button whose label comes from `home.sample.<key>.label`, only in fallback mode (corpus loading, failed, or under five valid items). A sample button SHALL select text mode, set the textarea to `home.sample.<key>.text`. Sample buttons SHALL have no `data-expectation` and no verdict tint, and no explainer SHALL be shown. The sample buttons SHALL stay unmarked (not inside `[data-mock]`).

#### Scenario: Four samples in order
- **WHEN** Home renders in fallback mode
- **THEN** the Try row contains four buttons in the order energy, breaking, editorial, springfield

#### Scenario: Springfield sample
- **WHEN** the springfield button is clicked
- **THEN** text mode is selected and the textarea holds the exact quote

### Requirement: Try-out corpus lazy load and validation
Home SHALL load the corpus through a dynamic `import()` after first render, outside the main entry chunk; the Try row SHALL show the fallback samples meanwhile. An item is valid when `statement` is non-empty after trimming and `expectation` is `detected`, `not_detected` or `uncertain`; invalid items SHALL be dropped. If loading fails, the payload is not an array, or fewer than 5 valid items remain, Home SHALL use the fallback.

#### Scenario: Load rejection
- **WHEN** the corpus import rejects
- **THEN** the four fallback samples show, fill the textarea on click, and no tinted chip and no explainer appear

#### Scenario: Too few valid items
- **WHEN** the payload holds fewer than 5 valid items
- **THEN** the fallback samples show and no Shuffle button is rendered

### Requirement: Try-out draw and Shuffle
`draw(items, 5, random = Math.random)` SHALL return 5 items chosen uniformly without replacement (a partial Fisher-Yates over indices), without mutating the input. Home SHALL draw once per mount, once the corpus has loaded, and again on each press of the Shuffle button. While the corpus is active the Try row SHALL show a button labelled `home.try.shuffle` that redraws the five chips while the explainer stays visible; it SHALL be hidden in fallback mode.

#### Scenario: Unique draw
- **WHEN** a draw is made from a list of at least 5 items
- **THEN** it returns 5 distinct items and different random sources can give different sets

#### Scenario: Shuffle
- **WHEN** Shuffle is pressed
- **THEN** a new set of five chips is drawn and the explainer stays visible

### Requirement: Try-out chips
Each corpus chip SHALL show its statement truncated to 60 code points plus an ellipsis when longer, as plain text with `dir="auto"`. Its `aria-label` SHALL be the statement truncated to 300 code points. Its `title` SHALL be the full statement, a newline, then `home.try.chip_expectation` with the localized value label. Clicking a chip SHALL select text mode and set the textarea to the full statement verbatim (no length cap) and SHALL NOT submit the job.

#### Scenario: Long statement
- **WHEN** a chip with a statement longer than 60 code points is clicked
- **THEN** the chip label was truncated with an ellipsis, the textarea holds the full statement and no request is sent

#### Scenario: Title carries the expectation
- **WHEN** a chip whose expectation is `detected` is rendered in en
- **THEN** its title is the statement, a newline, and "Expected result predicted by the LLM: Detected"

#### Scenario: No per-click indicator
- **WHEN** any chip is clicked
- **THEN** no element with `role="status"` and `data-expectation` exists and the text "Expected for this demo:" appears nowhere

### Requirement: Try-out localization and unmarked
The keys `home.try.shuffle`, `home.try.info`, `home.try.chip_expectation`, `home.try.expectation.detected`, `home.try.expectation.not_detected` and `home.try.expectation.uncertain` SHALL exist in en, fr, de, fi, ar and ru; ar strings SHALL contain no Latin letters. Corpus statements are not translated. Keys `home.try.expectation.prefix` and `.note` SHALL be removed from all six catalogs. Corpus chips, the Shuffle button and the explainer SHALL NOT be inside `[data-mock]`.

#### Scenario: Arabic strings
- **WHEN** the ar values of the new keys are inspected
- **THEN** none contains a Latin letter

## ADDED Requirements

### Requirement: Try-out chip tint
Each corpus chip SHALL carry `data-expectation=<detected|not_detected|uncertain>` and SHALL be styled as a pill with rounded padding, background `var(--verdict-<value>-bg)`, a 1px border `var(--verdict-<value>-border)` and text color `var(--verdict-<value>-pill-text)` (`not_detected` maps to `--verdict-not-detected-*`). It SHALL keep a visible `:focus-visible` outline. No new color tokens SHALL be introduced.

#### Scenario: Three tints
- **WHEN** chips with `detected`, `not_detected` and `uncertain` expectations render
- **THEN** each uses its own `--verdict-*` background, border and text tokens

### Requirement: Try-out chip expectation text
Color SHALL NOT be the only cue: each corpus chip SHALL have `aria-describedby` referencing a visually hidden element (not `display:none`) whose text is `home.try.chip_expectation` with the localized value label from `home.try.expectation.<value>`.

#### Scenario: Accessible description
- **WHEN** a chip with expectation `uncertain` is rendered in en
- **THEN** its accessible description is "Expected result predicted by the LLM: Uncertain"

### Requirement: Try-out explainer
While the corpus is active (chips shown), Home SHALL render directly below the Try row a paragraph with class `try-info` and the text `home.try.info`. It SHALL NOT use `role="status"` or `aria-live`, SHALL NOT depend on any chip selection, and SHALL remain identical after chip clicks, Shuffle, clearing the textarea and switching to link mode. It SHALL NOT be rendered in fallback mode.

#### Scenario: Permanent explainer
- **WHEN** the corpus chips are shown, then a chip is clicked, Shuffle pressed, the textarea cleared and link mode selected
- **THEN** the same explainer paragraph is present throughout

#### Scenario: Fallback has no explainer
- **WHEN** Home renders in fallback mode
- **THEN** no `.try-info` element exists

### Requirement: Explainer copy
The en `home.try.info` SHALL carry the agreed copy given in the scenario below, and the fr, de, fi, ar and ru catalogs SHALL carry faithful translations.

#### Scenario: English copy
- **WHEN** the en catalog is read
- **THEN** `home.try.info` reads: "These try-out statements were collected from the web, and their expected results were predicted by the Grok LLM (shown by each chip's color). Pick one and read the statement yourself first. Then check the result the LLM predicted and decide whether you agree. Next, run the analysis and see our engine's result. Did you agree with the LLM? If not, did our engine confirm your own judgement?"

### Requirement: Try-out expectation not propagated
Home SHALL hold no selected-expectation state. The expectation of a chip SHALL NOT be passed to `createJob`, the router or the result views.

#### Scenario: Chip click does not leak the expectation
- **WHEN** a chip is clicked and the statement is analyzed
- **THEN** the `createJob` body, the navigation state and the result views carry no expectation

## REMOVED Requirements

### Requirement: Expectation indicator
**Reason**: Expected results are now shown on every chip and explained permanently, so the per-click indicator is redundant.
**Migration**: Use the chip tint, chip title and the `try-info` explainer.

### Requirement: Expectation indicator colors
**Reason**: The indicator no longer exists; its verdict tokens now tint the chips.
**Migration**: See "Try-out chip tint".

### Requirement: Expectation indicator lifecycle
**Reason**: Home holds no selected-expectation state; non-propagation to `createJob`, the router and result views moves to "Try-out expectation not propagated".
**Migration**: None.
