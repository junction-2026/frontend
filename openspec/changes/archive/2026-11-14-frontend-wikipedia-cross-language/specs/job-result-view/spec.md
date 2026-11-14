## ADDED Requirements

### Requirement: Wikipedia lookup section
The job view SHALL end with a read-only "Wikipedia lookup" section built from the AnalyzerRun with `id` `wikipedia`. For each claim of the result it SHALL show the claim text and, for each WikiLookup in order, the edition's language name, the page title and the `passage`, separately and verbatim. While the run is `pending` or `running` the section SHALL NOT be rendered.

#### Scenario: Two editions
- **WHEN** the run succeeded and a claim has a found `de` and a found `en` WikiLookup
- **THEN** each passage is shown in its own block with "Wikipedia (German)" or "Wikipedia (English)" and its title, unchanged and unmerged

### Requirement: Wikipedia passages are not merged
The section SHALL NOT combine passages, SHALL NOT present a passage as a translation of the other, SHALL NOT show a true/false verdict and SHALL show no count. A WikiLookup whose `status` is not `found` (an unknown `status` included) or whose `passage` is empty SHALL be shown as "no page found in this edition", without a passage.

#### Scenario: Page not found
- **WHEN** a WikiLookup has `status: "no_page"`, `ambiguous` or an unknown status
- **THEN** its block reads "No page found in this edition" and the claim is not presented as false or unverified

### Requirement: Wikipedia lookup availability
The section SHALL render the note "No Wikipedia lookup available" instead of claims when the `wikipedia` run is missing, `skipped` or `failed`, or `succeeded` without a `claims` array. This SHALL NOT be presented as an error and not as "Wikipedia has nothing on it".

#### Scenario: Failed run
- **WHEN** the `wikipedia` run has `status: "failed"`
- **THEN** the section shows "No Wikipedia lookup available" and no passage

#### Scenario: Deployment without the analyzer
- **WHEN** the job has no AnalyzerRun with id `wikipedia`
- **THEN** the section shows "No Wikipedia lookup available" without error

### Requirement: Wikipedia text is plain and isolated
Claim, title, passage, evidence sentence and compared value `text` SHALL be rendered as plain text, without HTML or Markdown interpretation and without turning their contents into links. Each SHALL be direction-isolated (`dir="auto"` on a block, a `<bdi dir="auto">` inline) so it keeps its own direction in a right-to-left UI. Their wording SHALL NOT be replaced by a translation in any UI language.

#### Scenario: Markup in a passage
- **WHEN** a `passage` is `<b>bold</b> [x](https://example.com)`
- **THEN** exactly those characters are shown, and no element other than the section's own markup and no link is created from them

### Requirement: Wikipedia links
A WikiLookup `url` and a CrossLanguageDifference `url` SHALL be rendered as a link only when it parses as an absolute `https` URL whose host ends in `.wikipedia.org`; the link text is the page title (the `url` itself when there is none) and it opens with `rel="noopener noreferrer"`. Any other value (`http`, another host, a host that only contains `wikipedia.org` elsewhere, a relative or protocol-relative URL, `javascript:`) SHALL be shown as plain text, never as a link.

#### Scenario: Not a Wikipedia host
- **WHEN** a `url` is `https://de.wikipedia.org.evil.example/x` or `http://de.wikipedia.org/x`
- **THEN** it is not a link

### Requirement: Wikipedia coverage labels
For a found WikiLookup the section SHALL show its `coverage` as a localized label: `no_coverage`, `mentioned`, `aligned` or `conflicts`; an unknown or absent `coverage` SHALL be shown as `no_coverage`. For `aligned` and `conflicts` the `evidence_sentence` SHALL be shown as plain text. `conflicts` SHALL use the warning tone (orange tag); every other label the neutral tone. A label SHALL describe the evidence sentence only ("has a different number or date"), never the claim as true or false.

#### Scenario: Unknown coverage
- **WHEN** a found WikiLookup has `coverage: "partially_aligned"` or no `coverage`
- **THEN** it shows the `no_coverage` label

### Requirement: Cross-language state
For each claim the section SHALL present `cross_language` as follows. `agree`: the neutral note "Both editions give the same numbers and dates". `gap`: the neutral note "Only one language edition had a page for this claim". `null`, a missing member and an unknown value SHALL show no comparison and no error. The state SHALL NOT be presented as a verdict on the claim.

#### Scenario: Agree
- **WHEN** a claim has `cross_language: "agree"`
- **THEN** the neutral note "Both editions give the same numbers and dates" is shown, also when neither passage has a number or date

#### Scenario: Unknown or absent state
- **WHEN** `cross_language` is `null`, missing or `"partial"`
- **THEN** no comparison note is shown and no error is shown

### Requirement: Cross-language discrepancy
For `discrepancy` the section SHALL show a note with one entry per CrossLanguageDifference, in order: the edition's language name, the link (see "Wikipedia links") and each differing value quoted by its `text`. An entry with no values says "No value of its own". A missing, null or malformed `cross_language_differences` SHALL show the note without entries.

#### Scenario: Discrepancy with one empty side
- **WHEN** `cross_language` is `discrepancy` and the `de` entry has `values: []` and the `en` entry has the value with `text` `1945`
- **THEN** the `de` entry reads "No value of its own" and the `en` entry quotes “1945” with its language and link

### Requirement: Gap and discrepancy are not coverage conflicts
A `gap` SHALL be shown without discrepancy, disagreement or conflict wording and without the warning tone. A `discrepancy` SHALL use a tone (purple border) distinct from the `conflicts` coverage tag. No count of conflicts, discrepancies or gaps SHALL be shown, so none includes a `gap` or `discrepancy`.

#### Scenario: Gap next to a conflicts label
- **WHEN** a claim has `cross_language: "gap"` and its found WikiLookup has `coverage: "conflicts"`
- **THEN** the `conflicts` label is shown for that WikiLookup only, the gap note is neutral and has no conflict wording, and no conflict is counted for the gap

### Requirement: Wikipedia copy from the results catalog
All fixed text of the Wikipedia section SHALL come from `results.wiki.*` keys present in en, de, fr, fi and ar, covered by the catalog completeness test. Edition names use the language name of the UI language.

#### Scenario: Another locale
- **WHEN** the locale is `de` and a claim has `cross_language: "agree"`
- **THEN** the note reads "Beide Ausgaben nennen dieselben Zahlen und Daten"
