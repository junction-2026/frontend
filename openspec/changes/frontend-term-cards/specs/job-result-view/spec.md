## MODIFIED Requirements

### Requirement: Wikipedia lookup section
The job view SHALL show a read-only "Wikipedia lookup" section built from the AnalyzerRun with `id` `wikipedia`, followed by the "Term context section". For each claim of the result it SHALL show the claim text and, for each WikiLookup in order, the edition's language name, the page title and the `passage`, separately and verbatim. While the run is `pending` or `running` the section SHALL NOT be rendered.

#### Scenario: Two editions
- **WHEN** the run succeeded and a claim has a found `de` and a found `en` WikiLookup
- **THEN** each passage is shown in its own block with "Wikipedia (German)" or "Wikipedia (English)" and its title, unchanged and unmerged

## ADDED Requirements

### Requirement: Term context section
The job view SHALL show a read-only "Term context" section after the Wikipedia lookup section, built from the AnalyzerRun `term_context` with existing ui-design-foundation tokens only. It SHALL show one card per TermContext with the `term`, the `in_post` sentence, the encyclopedia quote with its link or a no-coverage note, the `elsewhere` snippets with links, and a sense label. It SHALL NOT be rendered while the run is `pending` or `running`.

#### Scenario: Full card
- **WHEN** the run succeeded and a TermContext has an EncyclopediaQuote, two `elsewhere` items and `sense: same`
- **THEN** one card shows the term, the post sentence, the encyclopedia quote with its link, both snippets with their links and the label "The quotes use the term for the same thing"

#### Scenario: No coverage
- **WHEN** a TermContext has `encyclopedia: "no_coverage"` (or a non-object value)
- **THEN** its card reads "No Wikipedia page of its own for this term" and shows no encyclopedia quote

#### Scenario: Nothing to compare
- **WHEN** a TermContext has `elsewhere: []`, `encyclopedia: "no_coverage"` and `sense: "unknown"`
- **THEN** the card reads "No news snippet contains this term" and the label "No other quote to compare with"

### Requirement: Term context is read tolerantly
Unknown members SHALL be ignored, a non-object `encyclopedia` SHALL read as no coverage and an unknown `sense` SHALL read as `unknown`.

#### Scenario: Unknown members
- **WHEN** the result or a TermContext has members the client does not know, or `sense` is an unknown value
- **THEN** they are ignored and the card is shown with the label for `unknown`

### Requirement: Term context availability
The section SHALL read "No term context available" when the `term_context` run is missing, `skipped` or `failed`, or `succeeded` without a `terms` array; this SHALL NOT be presented as an error or as "the post has no such terms". A succeeded run with `terms: []` SHALL read "No loaded or unfamiliar terms were picked from the post".

#### Scenario: Skipped run
- **WHEN** the `term_context` run is `skipped` or `failed`
- **THEN** the section shows "No term context available" and no card

#### Scenario: No terms kept
- **WHEN** the run succeeded with `terms: []`
- **THEN** the section shows "No loaded or unfamiliar terms were picked from the post"

### Requirement: Term context text is plain and isolated
`term`, `in_post`, `quote`, `title`, `snippet` and `domain` SHALL be rendered as plain text, without HTML or Markdown interpretation and without turning their content into links, each inside an element with `dir="auto"` so that an RTL quote does not reorder the surrounding labels. An encyclopedia `url` SHALL be a link only when it is an absolute `https` URL whose host ends in `.wikipedia.org`; an elsewhere `url` only when its scheme is `http` or `https`; otherwise the title is shown as text.

#### Scenario: Markup in a snippet
- **WHEN** a `snippet` is `<b>x</b> [y](https://example.com)`
- **THEN** exactly those characters are shown, no element or link is created from them

#### Scenario: Disallowed urls
- **WHEN** an encyclopedia `url` has host `example.com` and an elsewhere `url` is `javascript:alert(1)`
- **THEN** neither is rendered as a link

### Requirement: Differing quotes are marked
For `sense: differs` the card SHALL mark each quote referenced by a resolvable `differs_from` QuoteRef (`encyclopedia`, or `elsewhere` with an index of an existing item) with a visible marker and a `data-differs` attribute inside the same card, next to the quote and its link; QuoteRefs that do not resolve SHALL be ignored.

#### Scenario: Snippet differs
- **WHEN** `sense` is `differs` and `differs_from` is `[{"source": "elsewhere", "index": 1}, {"source": "elsewhere", "index": 9}]`
- **THEN** only the second snippet is marked, with its link

### Requirement: Term context sense labels are neutral
Sense labels SHALL state only the relation between the quotes ("The quotes use the term for the same thing", "The quotes use the term for different things", "No other quote to compare with") and SHALL NOT say or imply that the post is right or wrong, define the term or judge the author. The labels, notes and markers SHALL exist in every UI locale including `ru`.

#### Scenario: Differs wording
- **WHEN** a card has `sense: differs`
- **THEN** its label reads "The quotes use the term for different things" and no text of the card says the post is wrong or false

### Requirement: Final assessment keeps its Wikipedia quotations
The final assessment SHALL present only `wikipedia_quotes` entries as quotations from Wikipedia; the encyclopedia quote of a term card is shown only in the Term context section.

#### Scenario: Term context present
- **WHEN** a job has a succeeded `term_context` run and a final assessment without `wikipedia_quotes`
- **THEN** the final assessment shows no Wikipedia quotation
