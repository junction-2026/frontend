## MODIFIED Requirements

### Requirement: Home sample statements
The Home Try row SHALL initially render the samples energy, breaking, editorial and springfield, in that order, each as a `<button type="button">` labelled `home.sample.<key>.label`, both while the corpus loads, after it fails, and after it loads successfully, until Shuffle is first pressed. A sample button SHALL select text mode and set the textarea to `home.sample.<key>.text` without submitting. Sample buttons SHALL have no `data-expectation` and SHALL NOT be inside `[data-mock]`.

#### Scenario: Four samples in order
- **WHEN** Home renders, and again after the corpus has loaded
- **THEN** the Try row contains four buttons in the order energy, breaking, editorial, springfield

#### Scenario: Springfield sample
- **WHEN** the springfield button is clicked
- **THEN** text mode is selected, the textarea holds the exact quote and no createJob request is sent

### Requirement: Try-out corpus lazy load and validation
Home SHALL load the corpus through a dynamic `import()` after first render, outside the main entry chunk, with this validity rule: an item is valid when `statement` is non-empty after trimming and `expectation` is `detected`, `not_detected` or `uncertain`; invalid items SHALL be dropped. Loading SHALL NOT change the displayed examples. On load failure, a non-array payload or fewer than 5 valid items, the corpus is inactive.

#### Scenario: Load does not change the row
- **WHEN** the corpus loads with 5 or more valid items
- **THEN** the Try row still shows the four fixed samples

#### Scenario: Load rejection
- **WHEN** the corpus import rejects
- **THEN** the four fixed samples show, fill the textarea on click, and no Shuffle button appears

#### Scenario: Too few valid items
- **WHEN** the payload holds fewer than 5 valid items
- **THEN** the four fixed samples show and no Shuffle button is rendered

### Requirement: Try-out draw and Shuffle
`draw(items, 5, random = Math.random)` SHALL stay unchanged (uniform, no replacement, no input mutation). Home SHALL NOT draw when the corpus loads. While the corpus is active, the Try row SHALL show after the examples a keyboard-focusable button with class `try-shuffle` labelled `home.try.shuffle`, styled as an unobtrusive text button (see scenario). Each press SHALL replace the displayed examples with `draw(corpus, 5)`. When the corpus is inactive, no Shuffle button SHALL be rendered.

#### Scenario: Shuffle button style
- **WHEN** the Shuffle button is inspected
- **THEN** it has no pill border and a tap target of at least 24x24 CSS px

#### Scenario: Unique draw
- **WHEN** a draw is made from a list of at least 5 items
- **THEN** it returns 5 distinct items and different random sources can give different sets

#### Scenario: Shuffle
- **WHEN** Shuffle is pressed by click, or by Enter or Space with keyboard focus, and then pressed again
- **THEN** the four fixed samples are replaced by 5 distinct corpus statements and each later press shows a new draw

### Requirement: Try-out chip expectation text
Each corpus example SHALL keep `aria-describedby` referencing a visually hidden element (not `display:none`) whose text is `home.try.chip_expectation` with the localized value from `home.try.expectation.<value>`.

#### Scenario: Accessible description
- **WHEN** a corpus example with expectation `uncertain` is rendered in en
- **THEN** its accessible description is "Expected result predicted by the LLM: Uncertain"

### Requirement: Try-out explainer
Home SHALL always render, directly below the Try row, a paragraph with class `try-info` and text `home.try.info`, in fallback mode and in corpus mode alike. It SHALL NOT use `role="status"` or `aria-live`, SHALL NOT be inside `[data-mock]`, and SHALL stay identical after example clicks, Shuffle, clearing the textarea and switching to link mode.

#### Scenario: Fallback has no explainer
- **WHEN** Home renders in fallback mode (corpus loading, failed or too small)
- **THEN** the same `.try-info` paragraph is present, exactly once, directly below the Try row (the explainer is no longer corpus-only)

#### Scenario: Permanent explainer
- **WHEN** an example is clicked, Shuffle pressed, the textarea cleared and link mode selected
- **THEN** the same explainer paragraph is present throughout

### Requirement: Explainer copy
The en `home.try.info` SHALL read exactly the text in the scenario below. The fr, de, fi, ar and ru catalogs SHALL carry faithful translations; the ar text SHALL contain no Latin-script letters, except that the product name VEIL may appear per the existing ar catalog convention. Locale key sets SHALL stay identical.

#### Scenario: English copy
- **WHEN** the en catalog is read
- **THEN** `home.try.info` reads exactly: "Explore real-world statements, compare your judgment with AI, and discover what VEIL detects."

#### Scenario: No locale keeps the parenthetical
- **WHEN** any locale catalog is read
- **THEN** `home.try.info` contains no "(" and no text about the Grok LLM predicting results

### Requirement: Try-out localization and unmarked
The keys `home.try.shuffle`, `home.try.info`, `home.try.chip_expectation`, `home.try.expectation.detected`, `home.try.expectation.not_detected` and `home.try.expectation.uncertain` SHALL exist in en, fr, de, fi, ar and ru; ar strings SHALL contain no Latin letters other than the product name VEIL. Corpus statements are not translated. Corpus examples, the Shuffle button and the explainer SHALL NOT be inside `[data-mock]`.

#### Scenario: Arabic strings
- **WHEN** the ar values of these keys are inspected, ignoring `{placeholders}` and VEIL
- **THEN** none contains a Latin letter

### Requirement: Try row responsive layout
At 390px width the Try row SHALL wrap its examples and Shuffle onto several centered lines with no horizontal page overflow (long labels wrap via `overflow-wrap:anywhere`), and each example and the Shuffle button SHALL keep a tap target of at least 24x24 CSS px.

#### Scenario: Narrow viewport
- **WHEN** Home is viewed at 390px width
- **THEN** the examples wrap onto several lines and the page does not scroll horizontally

## ADDED Requirements

### Requirement: Try row link style
Every example button in the Try row (fixed or corpus) SHALL render as inline text with `text-decoration: underline`, transparent background, no border and no pill `border-radius`, using the inherited Inter font. Adjacent examples SHALL be separated by a `·` character in an `aria-hidden="true"` span; there SHALL be no separator before the first or after the last example, nor between the last example and the Shuffle button. Example buttons SHALL keep a visible `:focus-visible` outline.

#### Scenario: Separators
- **WHEN** the Try row shows N examples
- **THEN** it contains exactly N-1 `aria-hidden` `·` separators, none at either end and none before Shuffle

#### Scenario: Plain links
- **WHEN** the Try row styles are inspected
- **THEN** examples are underlined with transparent background, no border and no rounded pill

### Requirement: Try-out corpus links
Each corpus example SHALL show its statement truncated to 60 code points plus an ellipsis when longer, as plain text with `dir="auto"`. Its `aria-label` SHALL be the statement truncated to 300 code points. Its `title` SHALL be the full statement, a newline, then `home.try.chip_expectation` with the localized value label. Clicking it SHALL select text mode, set the textarea to the full statement verbatim and SHALL NOT submit.

#### Scenario: Long statement
- **WHEN** a corpus example with a statement longer than 60 code points is clicked
- **THEN** its label was truncated with an ellipsis, the textarea holds the full statement and no request is sent

#### Scenario: Title carries the expectation
- **WHEN** a corpus example whose expectation is `detected` is rendered in en
- **THEN** its title is the statement, a newline, and "Expected result predicted by the LLM: Detected"

## REMOVED Requirements

### Requirement: Try-out chip tint
**Reason**: The Try row is minimalist again; corpus examples are plain underlined links and no longer carry the expectation as a tint.
**Migration**: Corpus examples SHALL NOT carry `data-expectation` and SHALL NOT use any `--verdict-*` background, border or text color. The `.try-row button[data-expectation]` CSS rules are deleted and no new color tokens are introduced. The expectation stays available through `title` and the visually hidden description.

### Requirement: Try-out chips
**Reason**: Renamed to "Try-out corpus links" (see MODIFIED above) because examples are no longer chips.
**Migration**: Use the added requirement "Try-out corpus links".
