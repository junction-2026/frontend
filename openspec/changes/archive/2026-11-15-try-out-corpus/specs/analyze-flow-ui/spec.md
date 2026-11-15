## MODIFIED Requirements

### Requirement: Home sample statements
The Home Try row SHALL render the samples energy, breaking, editorial and springfield, in that order, each as a button whose label comes from `home.sample.<key>.label`, only in fallback mode (corpus loading, failed, or under five valid items). A sample button SHALL select text mode, set the textarea to `home.sample.<key>.text` and show no indicator. The sample buttons SHALL stay unmarked (not inside `[data-mock]`).

#### Scenario: Four samples in order
- **WHEN** Home renders in fallback mode
- **THEN** the Try row contains four buttons in the order energy, breaking, editorial, springfield

#### Scenario: Springfield sample
- **WHEN** the springfield button is clicked
- **THEN** text mode is selected and the textarea holds the exact quote

## ADDED Requirements

### Requirement: Try-out corpus asset
`src/data/try-out-statements.json` SHALL be the agreed gist file committed verbatim: 1000 items of `{statement, expectation}`. No fields SHALL be added and no texts SHALL be regenerated.

#### Scenario: Corpus shape
- **WHEN** the file is read
- **THEN** it holds 1000 items with exactly the keys `statement` and `expectation`, of which 581 are `not_detected`, 233 `uncertain` and 186 `detected`

### Requirement: Try-out corpus lazy load and validation
Home SHALL load the corpus through a dynamic `import()` after first render, outside the main entry chunk; the Try row SHALL show the fallback samples meanwhile. An item is valid when `statement` is non-empty after trimming and `expectation` is `detected`, `not_detected` or `uncertain`; invalid items SHALL be dropped. If loading fails, the payload is not an array, or fewer than 5 valid items remain, Home SHALL use the fallback.

#### Scenario: Load rejection
- **WHEN** the corpus import rejects
- **THEN** the four fallback samples show, fill the textarea on click, and no indicator appears

#### Scenario: Too few valid items
- **WHEN** the payload holds fewer than 5 valid items
- **THEN** the fallback samples show and no Shuffle button is rendered

### Requirement: Try-out draw and Shuffle
`draw(items, 5, random = Math.random)` SHALL return 5 items chosen uniformly without replacement (a partial Fisher-Yates over indices), without mutating the input. Home SHALL draw once per mount, once the corpus has loaded, and again on each press of the Shuffle button. While the corpus is active the Try row SHALL show a button labelled `home.try.shuffle` that redraws the five chips and removes the expectation indicator; it SHALL be hidden in fallback mode.

#### Scenario: Unique draw
- **WHEN** a draw is made from a list of at least 5 items
- **THEN** it returns 5 distinct items and different random sources can give different sets

#### Scenario: Shuffle
- **WHEN** Shuffle is pressed
- **THEN** a new set of five chips is drawn and any expectation indicator is removed

### Requirement: Try-out chips
Each corpus chip SHALL show its statement truncated to 60 Unicode code points plus an ellipsis when longer. Its `title` SHALL be the full statement and its `aria-label` the statement truncated to 300 code points. The statement SHALL be rendered as plain text with `dir="auto"`. Clicking a chip SHALL select text mode and set the textarea to the full statement verbatim (no length cap, statements of 1800 characters SHALL be accepted) and SHALL NOT submit the job.

#### Scenario: Long statement
- **WHEN** a chip with a statement longer than 60 code points is clicked
- **THEN** the chip label was truncated with an ellipsis, the textarea holds the full statement and no request is sent

### Requirement: Expectation indicator
After a corpus chip click, Home SHALL render an element with `role="status"` and `data-expectation=<value>` below the Try row. Its text SHALL be `home.try.expectation.prefix` followed by the localized value label (en: "Expected for this demo: Detected") plus the disclaimer `home.try.expectation.note` (en: "A demo guide — live models may not match every time.").

#### Scenario: Indicator per value
- **WHEN** a chip with expectation `uncertain` is clicked
- **THEN** a status element with `data-expectation="uncertain"` and the text "Expected for this demo: Uncertain" shows

### Requirement: Expectation indicator colors
The indicator SHALL use the tokens `--verdict-detected-*`, `--verdict-not-detected-*` and `--verdict-uncertain-*` (background, border, pill text) so the three values differ in color, while the text label also conveys the value.

#### Scenario: Three colors
- **WHEN** the indicator shows detected, not_detected and uncertain in turn
- **THEN** each uses its own verdict tokens and its text label names the value

### Requirement: Expectation indicator lifecycle
Selecting another chip SHALL replace it. Setting the textarea to empty after trim, pressing Shuffle, or switching to link mode SHALL remove it; editing without clearing MAY keep it. The indicator SHALL NOT be passed to `createJob`, the router or the result views.

#### Scenario: Replace and clear
- **WHEN** another chip is clicked, then the textarea is cleared
- **THEN** the indicator first shows the second chip's value and then disappears

### Requirement: Try-out localization and unmarked
The keys `home.try.shuffle`, `home.try.expectation.prefix`, `home.try.expectation.note`, `home.try.expectation.detected`, `home.try.expectation.not_detected` and `home.try.expectation.uncertain` SHALL exist in en, fr, de, fi, ar and ru; the ar strings SHALL contain no Latin letters. Corpus statements are not translated. Corpus chips, the Shuffle button and the indicator SHALL NOT be inside `[data-mock]`.

#### Scenario: Arabic strings
- **WHEN** the ar values of the new keys are inspected
- **THEN** none contains a Latin letter

### Requirement: Try row responsive layout
At 390px width the chip row SHALL wrap with no horizontal page overflow, and each chip and the Shuffle button SHALL keep a tap target of at least 24x24 CSS px.

#### Scenario: Narrow viewport
- **WHEN** Home is viewed at 390px width
- **THEN** the chips wrap onto several lines and the page does not scroll horizontally
