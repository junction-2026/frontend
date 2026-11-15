## MODIFIED Requirements

### Requirement: Thread storage
The thread SHALL be kept in `sessionStorage` under a per-job key, so a reload in the same tab restores it; storage failures SHALL be ignored. The focus a user turn was sent with SHALL be saved in the same entry; an entry without focus (stored before focus existed) SHALL load as turns without focus. A restored thread whose last message is the user's SHALL show a Retry action.

#### Scenario: Reload
- **WHEN** the screen of the same job is mounted again in the same tab
- **THEN** the earlier bubbles are shown, each user bubble with the focus it was sent with

#### Scenario: Older stored thread
- **WHEN** the stored entry holds turns without a `focus` member
- **THEN** they load as turns without focus and no "About:" line is shown

## ADDED Requirements

### Requirement: Split layout
`/jobs/:id/ask` for a loaded job SHALL render a two-column grid with the chat section (context bar, thread, composer) first in the DOM and the result panel second, at viewport widths of 960px and more, using CSS logical properties so the chat is at inline-start (left in ltr, right in rtl). Below 960px the sections SHALL stack with the chat first.

#### Scenario: Wide viewport
- **WHEN** the viewport is at least 960px wide
- **THEN** the chat and the result panel are side by side and the chat is in the inline-start column

#### Scenario: Narrow viewport
- **WHEN** the viewport is narrower than 960px
- **THEN** the sections are stacked, chat first

### Requirement: Narrow toggle
Below 960px a "Choose result elements" button near the composer SHALL scroll to the result panel and move focus to its heading. The panel SHALL have an `<h2>` heading and `role="region"` with a localized accessible name. At 960px and more the button SHALL be hidden.

#### Scenario: Toggle
- **WHEN** the user presses "Choose result elements"
- **THEN** the panel heading has keyboard focus

### Requirement: Result panel content
For a completed job the result panel SHALL list, in this order and only when present in the Job, the kinds `final_assessment`, `technique` (each Detection), `passage` (each TechniqueSpan, under its Detection), `llm_finding`, `risk_dimension` (available ones), `risk_driver`, `risk_caveat`, `wikipedia_claim` and `term_context`, under localized group headings.

#### Scenario: Absent data
- **WHEN** the Job has no `wikipedia` result and no risk
- **THEN** no Wikipedia or risk items are listed

### Requirement: Element references
Item refs SHALL follow the shared element reference requirements exactly: the Detection `name`; `<start>:<end>:<technique>`; the 0-based index into the raw `llm_techniques` `findings`, `Job.risk.drivers`, `wikipedia` `claims` and `term_context` `terms`; `intensity`, `confirmation` or `amplification`; the RiskCaveat `id` (first caveat with that id); the literal `final_assessment`.

#### Scenario: Element kinds and refs
- **WHEN** a completed job has a Detection `Doubt` with a span 12..40, an LLM finding at index 0, a second risk driver and a first Wikipedia claim
- **THEN** the panel lists items with `{kind, ref}` `technique/Doubt`, `passage/12:40:Doubt`, `llm_finding/0`, `risk_driver/1` and `wikipedia_claim/0`

### Requirement: Element labels
Each item label SHALL be built from the same localized text the result view shows (verdict label, technique display name, span text, LLM finding name, dimension name, driver or caveat text, claim text, term), with whitespace runs collapsed, shortened to at most 120 code points for display and at most 500 code points for `focus.label`, a cut label ending in `…`. Labels SHALL be rendered as text nodes with `dir="auto"`. An element whose label is blank SHALL NOT be listed.

#### Scenario: Long span
- **WHEN** a passage is 300 code points long
- **THEN** the panel shows its first 119 code points and `…` and the request label has 300 code points

### Requirement: Panel states
For a job that is not completed, or that has no selectable elements, the panel SHALL show a localized note and no checkboxes. Selection SHALL be disabled while the composer is disabled.

#### Scenario: Running job
- **WHEN** the job is `running`
- **THEN** the panel shows the note and no checkbox exists

### Requirement: Selection controls
Each item SHALL be a checkbox with its label as accessible name and a visible `:focus-visible` ring from the existing design tokens, toggled with Space. At most 20 items SHALL be selectable; once 20 are selected the unselected checkboxes SHALL be disabled and a polite live note SHALL say the limit is reached. A "Clear selection" button SHALL be shown while at least one item is selected.

#### Scenario: Limit
- **WHEN** 20 items are selected
- **THEN** the other checkboxes are disabled and the limit note is shown; deselecting one enables them again

#### Scenario: Clear
- **WHEN** the user presses "Clear selection"
- **THEN** no item is selected and the button is gone

### Requirement: Selection chips
The selection SHALL be shown above the composer as a list of chips, each with the label and a remove button named "Remove <label>"; removing a chip deselects the element. With nothing selected a localized hint SHALL say the question is about the whole analysis. The selection SHALL live in component state only and not survive a reload.

#### Scenario: Chip removal
- **WHEN** the user presses "Remove Doubt"
- **THEN** the chip and the checked state of that element are gone

### Requirement: Chat request with focus
Sending SHALL add `focus` (the current selection in panel order, each `{kind, ref, label}`) to the ChatRequest; with an empty selection the `focus` member SHALL be omitted. The selection SHALL be kept after sending.

#### Scenario: Two elements
- **WHEN** two elements are selected and the user sends a question
- **THEN** the request has `focus` with those two items in panel order and both stay selected

#### Scenario: No selection
- **WHEN** nothing is selected and the user sends a question
- **THEN** the request body has no `focus` member

### Requirement: Per-turn focus
Each user turn SHALL store the focus it was sent with. A user bubble with focus SHALL show a localized "About:" line with the labels as plain-text chips; later selection changes SHALL NOT change earlier bubbles. Retry SHALL resend the stored focus of that turn, not the current selection.

#### Scenario: Retry
- **WHEN** a request with focus A fails, the selection changes to B and the user presses Retry
- **THEN** the resent request carries focus A

### Requirement: Focus copy in every locale
All new Ask text (panel heading and region name, narrow toggle, clear selection, remove chip, limit note, whole-analysis hint, "About:" line, empty and not-completed notes, group headings) SHALL be in the `ask` namespace for en, de, fr, fi, ar and ru, with the brand "VEIL" verbatim.

#### Scenario: Arabic
- **WHEN** the locale is `ar`
- **THEN** the panel renders right-to-left with the chat at the right and no static Latin-script text other than the brand
