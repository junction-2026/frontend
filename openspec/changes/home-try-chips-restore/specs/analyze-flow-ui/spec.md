## MODIFIED Requirements

### Requirement: Home sample statements
The Home Try row SHALL render the samples energy, breaking, editorial and springfield, in that order, each as a `<button type="button">` labelled `home.sample.<key>.label`, only in fallback mode (corpus loading, failed, non-array payload, or fewer than 5 valid items). A sample button SHALL select text mode and set the textarea to `home.sample.<key>.text` without submitting. Sample buttons SHALL have no `data-expectation` and no tint, and SHALL NOT be inside `[data-mock]`.

#### Scenario: Four samples in order
- **WHEN** Home renders while the corpus is loading, after it failed, or with fewer than 5 valid items
- **THEN** the Try row contains four buttons in the order energy, breaking, editorial, springfield and no Shuffle button

#### Scenario: Springfield sample
- **WHEN** the springfield button is clicked
- **THEN** text mode is selected, the textarea holds the exact quote and no createJob request is sent

### Requirement: Try-out corpus lazy load and validation
Home SHALL load the corpus through the existing `loadRaw` dynamic `import()` after first render, outside the main entry chunk, and filter it with `validItems` (an item is valid when `statement` is non-empty after trimming and `expectation` is `detected`, `not_detected` or `uncertain`); the fallback samples show meanwhile. On load rejection, a non-array payload or fewer than 5 valid items Home SHALL stay in fallback mode (no chips, no Shuffle, no explainer).

#### Scenario: Load does not change the row
- **WHEN** the corpus import has not settled yet
- **THEN** loading itself leaves the fallback row unchanged: the four fixed samples show, with no Shuffle button and no `.try-info`

#### Scenario: Load rejection
- **WHEN** the corpus import rejects
- **THEN** the four fixed samples show, fill the textarea on click, and no Shuffle button or `.try-info` appears

#### Scenario: Too few valid items
- **WHEN** the payload is not an array or holds fewer than 5 valid items
- **THEN** the four fixed samples show and no Shuffle button or `.try-info` is rendered

### Requirement: Try-out draw and Shuffle
`draw(items, 5, random = Math.random)` SHALL stay unchanged. Home SHALL call `draw(corpus, 5)` once as soon as the corpus becomes active (per mount) and show those 5 chips at once instead of the fallback samples. While the corpus is active, a keyboard-focusable `<button type="button" class="try-shuffle">` labelled `home.try.shuffle` SHALL follow the chips; each press SHALL replace them with a new `draw(corpus, 5)`. No Shuffle button SHALL render in fallback mode.

#### Scenario: Auto draw
- **WHEN** the corpus loads with 5 or more valid items
- **THEN** `draw(corpus, 5)` was called once, exactly 5 chips show without any press, and the four fixed samples are gone

#### Scenario: Shuffle
- **WHEN** Shuffle is pressed by click, or by Enter or Space with keyboard focus, and then pressed again
- **THEN** each press replaces the 5 chips with a new `draw(corpus, 5)`

#### Scenario: Shuffle button style
- **WHEN** the Shuffle button is inspected
- **THEN** it is a pill with a 1px `--line-strong` border and a tap target of at least 24x24 CSS px

#### Scenario: Unique draw
- **WHEN** a draw is made from a list of at least 5 items
- **THEN** it returns 5 distinct items and different random sources can give different sets

### Requirement: Try-out localization and unmarked
The keys `home.try.shuffle`, `home.try.info`, `home.try.chip_expectation` and `home.try.expectation.{detected,not_detected,uncertain}` SHALL exist in en, fr, de, fi, ar and ru; ar strings SHALL contain no Latin letters (ignoring `{placeholders}`). Corpus statements are not translated. Chips, the Shuffle button and the explainer SHALL NOT be inside `[data-mock]`.

#### Scenario: Arabic strings
- **WHEN** the ar values of these keys are inspected, ignoring `{placeholders}`
- **THEN** none contains a Latin letter

### Requirement: Try row responsive layout
At 390px width the Try row SHALL wrap its chips and Shuffle onto several lines with no horizontal page overflow (long labels wrap via `overflow-wrap:anywhere`), each with a tap target of at least 24x24 CSS px.

#### Scenario: Narrow viewport
- **WHEN** Home is viewed at 390px width
- **THEN** the chips wrap onto several lines and the page does not scroll horizontally

### Requirement: Try-out chip expectation text
Each corpus chip SHALL keep `aria-describedby` referencing a visually hidden element (not `display:none`) whose text is `home.try.chip_expectation` with the localized value from `home.try.expectation.<value>`.

#### Scenario: Accessible description
- **WHEN** a corpus chip with expectation `uncertain` is rendered in en
- **THEN** its accessible description is "Expected result predicted by the LLM: Uncertain"

### Requirement: Explainer copy
The en `home.try.info` SHALL read exactly: "These statements were collected from the web; the Grok LLM predicted their expected results. Read one yourself, decide whether you agree with the LLM, then run the analysis and compare it with our engine's result." fr, de, fi, ar and ru SHALL carry faithful translations. Locale key sets SHALL stay identical.

#### Scenario: English copy
- **WHEN** the en catalog is read
- **THEN** `home.try.info` reads exactly the text above

#### Scenario: No locale keeps the parenthetical
- **WHEN** any locale catalog is read
- **THEN** `home.try.info` contains no "("

#### Scenario: Shorter, plain copy in every locale
- **WHEN** any locale catalog is read
- **THEN** `home.try.info` is strictly shorter in code points than that locale's pre-#96 value (frontend 83231bd^), names no chip color, and neither equals nor paraphrases the #96 copy ("Explore real-world statements, compare your judgment with AI, and discover what VEIL detects."); the six values are pairwise distinct

#### Scenario: Arabic script
- **WHEN** the ar `home.try.info` is read
- **THEN** it contains no Latin-script letters (Grok transliterated as in the pre-#96 ar text)

## ADDED Requirements

### Requirement: Shuffle style
`.try-row .try-shuffle` SHALL be a pill: `border: 1px solid var(--line-strong)`, `border-radius: 999px`, padding about `0.1rem 0.7rem`, no text-decoration, a visible `:focus-visible` outline and a tap target of at least 24x24 CSS px.

#### Scenario: Shuffle pill style
- **WHEN** the Shuffle button is inspected
- **THEN** it has the pill border, radius and padding above

### Requirement: Try-out chips
Each corpus chip SHALL be a `<button type="button" dir="auto">` showing its statement truncated to 60 code points plus an ellipsis when longer, with `aria-label` = statement truncated to 300 code points and `title` = the full statement, a newline, then `home.try.chip_expectation` with the localized value label. Clicking SHALL select text mode and set the textarea to the full statement verbatim and SHALL NOT submit. There SHALL be no `·` separator elements in the Try row.

#### Scenario: Long statement
- **WHEN** a chip with a statement longer than 60 code points is clicked
- **THEN** its label was truncated with an ellipsis, the textarea holds the full statement and no request is sent

#### Scenario: Title carries the expectation
- **WHEN** a chip whose expectation is `detected` is rendered in en
- **THEN** its title is the statement, a newline, and "Expected result predicted by the LLM: Detected"

### Requirement: Try-out chip tint
Each corpus chip SHALL carry `data-expectation=<detected|not_detected|uncertain>` and be a pill (`border-radius: 999px`, padding about `0.15rem 0.7rem`, no underline, `text-align: start`) with `background: var(--try-<value>-bg)`, a 1px solid `var(--try-<value>-border)` border and `color: var(--try-<value>-text)`; `not_detected` maps to `--try-not-detected-*`. It SHALL keep a visible `:focus-visible` outline (2px solid `var(--ink-2)`, offset 2px).

#### Scenario: Tinted pill
- **WHEN** the Try row shows corpus chips
- **THEN** each has `data-expectation`, a pill shape, no underline and its `--try-*` background, border and text color

### Requirement: Try chip tokens
`tokens.css` SHALL define nine tokens `--try-{detected,not-detected,uncertain}-{bg,border,text}`. Each `--try-*-bg` and `--try-*-border` SHALL have higher WCAG relative luminance than the matching `--verdict-*` token, the three backgrounds SHALL keep their red, green and amber hue families and be pairwise distinct, and each `--try-*-text` SHALL have contrast of at least 4.5:1 against its background. Existing `--verdict-*` tokens SHALL NOT change.

#### Scenario: Lighter and readable tokens
- **WHEN** `tokens.css` is parsed
- **THEN** every `--try-*-bg` and `--try-*-border` is lighter than the matching verdict token (currently #fde8e8/#f5b8b8, #e5f7ec/#a8e4bf, #fff1dc/#f2d49b) and every text reaches 4.5:1 on its background

### Requirement: Try-out explainer
Only while the corpus is active, Home SHALL render directly below the Try row a paragraph with class `try-info` and text `home.try.info`; it SHALL NOT use `role="status"` or `aria-live`, SHALL NOT be inside `[data-mock]`, and SHALL stay identical after chip clicks, Shuffle, clearing the textarea and switching to link mode. It SHALL NOT render in fallback mode.

#### Scenario: Corpus-only explainer
- **WHEN** Home is in corpus mode, then in fallback mode
- **THEN** exactly one `.try-info` paragraph follows the Try row in corpus mode and none exists in fallback mode

#### Scenario: Stable explainer
- **WHEN** a chip is clicked, Shuffle pressed, the textarea cleared and link mode selected
- **THEN** the same explainer paragraph is present throughout

## REMOVED Requirements

### Requirement: Try row link style
**Reason**: project#105 reverts the minimalist Try row of project#96; examples are tinted pills again.
**Migration**: Use "Try-out chips" and "Try-out chip tint".

### Requirement: Try-out corpus links
**Reason**: project#105 restores chips; "Try-out corpus links" is replaced by "Try-out chips".
**Migration**: Use "Try-out chips".

### Requirement: Try-out explainer always shown
**Reason**: project#105 makes the explainer corpus-only again.
**Migration**: Use "Try-out explainer".
