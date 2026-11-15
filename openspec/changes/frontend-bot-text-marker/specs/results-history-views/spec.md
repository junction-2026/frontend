## ADDED Requirements

### Requirement: Text-origin reader
`botTextOf(job)` SHALL return `{label, score}` only when the AnalyzerRun with `id` `bot_detection` has `status` `succeeded` and its `result.scope` is `text`, `result.label` is `human` or `bot_or_generated` and `result.score` is a finite number from 0 to 1; otherwise it SHALL return `null`. Unknown result members SHALL be ignored. Reads shared `bot-detection-result` (shared-specs@92a5491bf6c142f2322523c4a24e41a5b04d4946).

#### Scenario: Valid result
- **WHEN** `bot_detection` succeeded with `{label: "bot_or_generated", score: 0.87, scope: "text", extra: 1}`
- **THEN** the reader returns `{label: "bot_or_generated", score: 0.87}`

#### Scenario: Invalid or absent result
- **WHEN** the run is missing, `skipped`, `failed`, or succeeded with no `scope`, a `scope` other than `text`, a label such as `mixed`, or a score of 1.2, -0.1, `"0.5"` or NaN
- **THEN** the reader returns `null` without throwing

### Requirement: Text-origin marker
For a non-null `botTextOf` result, the verdict card SHALL render inside `.verdict-confidence`, after the confidence info button, an inline small neutral pill with class `verdict-origin` reading `Looks generated` for `bot_or_generated` and `Looks human-written` for `human` (localized). It SHALL NOT add a section or card and SHALL render nothing for a null result. The score SHALL be shown only as a percentage in the tooltip text, never as confidence in `human`.

#### Scenario: Generated
- **WHEN** `bot_detection` succeeded with `{label: "bot_or_generated", score: 0.87, scope: "text"}`
- **THEN** `.verdict-confidence` contains a `.verdict-origin` marker reading `Looks generated` after the confidence info button, and the card text shows no `87`

#### Scenario: Human
- **WHEN** the result has `label: "human"` and `score: 0.1`
- **THEN** the marker reads `Looks human-written` and its tooltip says about 10% probability of bot or generated, not confidence in human

#### Scenario: No signal
- **WHEN** `bot_detection` is missing, skipped, failed or invalid
- **THEN** no `.verdict-origin` exists, no error is shown and the confidence reading is unchanged

### Requirement: Text-origin marker accessibility
The marker SHALL be a focusable `button` with an `aria-label` and, on hover or focus, a `role="tooltip"` text referenced by `aria-describedby`, dismissed by Escape and on blur or mouse leave. The text SHALL say that the model checked this text only, in its original language, that it is not a verdict about the author or account, and that it is not propaganda detection.

#### Scenario: Focus
- **WHEN** the marker is focused
- **THEN** a tooltip with that text appears and Escape hides it

### Requirement: Text-origin copy in all locales
Keys `results.origin.bot_or_generated`, `results.origin.human` and `results.origin.tip` (with `{pct}`) SHALL exist in the en, de, fi, fr, ru and ar results catalogs.

#### Scenario: Locale
- **WHEN** the locale is `de`, `fi`, `fr`, `ru` or `ar` and the marker is shown
- **THEN** its label and tooltip are localized with no raw key or `{pct}`
