## RENAMED Requirements
- FROM: `### Requirement: Shared detail body`
- TO: `### Requirement: Detail body`

## MODIFIED Requirements

### Requirement: Detailed analysis region content
The detailed region SHALL contain the analyzed excerpt (first 400 characters), the technique tags, "Explore coverage" and the Copy button, followed by the Detail metrics bar, the JobView and the Coverage section. It SHALL NOT contain a link to a separate detail page.

#### Scenario: Expanded content
- **WHEN** the region is expanded
- **THEN** it shows the excerpt, technique tags, "Explore coverage", the Copy button and coverage, and has no link to a detail page

### Requirement: Results and Detail copy from the results catalog
All fixed text of `/jobs/:id` (meta row, verdict headings and bodies, confidence line and tooltip, state cards, actions) and of `/states` SHALL come from the `results` catalog in the active locale for en, fr, ar, de and fi. The English text quoted in the Results requirements of this capability is the `en` catalog value.

#### Scenario: Another locale
- **WHEN** the locale is `de` and the verdict is `detected`
- **THEN** the Results heading reads "Ja, Propaganda erkannt." and `user_text` is shown unchanged

#### Scenario: Language switch
- **WHEN** the user switches the language while Results is open
- **THEN** the page re-renders in the new language without a reload

#### Scenario: Removed detail strings
- **WHEN** the `results` catalog of any locale is read
- **THEN** it has no `open_detail`, `detail.back`, `detail.label`, `detail.title`, `detail.lede` or `detail.final` key

### Requirement: Results layout in right-to-left languages
Results (`/jobs/:id`) and States SHALL remain usable with `dir=rtl` (Arabic): the verdict, the detailed region, the highlighted text and the "why" region lay out without physical left or right.

#### Scenario: Arabic
- **WHEN** the locale is `ar`
- **THEN** the document direction is `rtl` and the Results verdict heading is Arabic

### Requirement: Mock-only parts of the Results screen
The detailed analysis region SHALL NOT render a Polarity/Intensity signal row, a "High rhetorical bias factor" line or a Share button. Copy SHALL copy the page URL to the clipboard without `Mock`. "Explore coverage" SHALL link to `/explore?job=<encoded job id>`.

#### Scenario: Removed items
- **WHEN** the detailed region of a job with a `detected` verdict is expanded
- **THEN** it contains no "High rhetorical bias factor", no Polarity/Intensity text, no Share button and no `[data-mock]` element

#### Scenario: Copy
- **WHEN** the user presses Copy
- **THEN** `navigator.clipboard.writeText` receives the page URL and Copy has no `Mock` ancestor

#### Scenario: Explore coverage link
- **WHEN** Results renders for job `j 1`
- **THEN** the link "Explore coverage" has `href` `/explore?job=j%201` and no "Cross-source coverage" link exists

### Requirement: Detailed summary card presentation
The `.card.detailed-summary` in the expanded detailed region SHALL have inner padding of at least 1rem block and 1.15rem inline, in LTR and RTL, so its content never touches the border. "Explore coverage" SHALL stay an anchor link styled as a secondary button scoped to `.detailed-summary`. The copy icon button SHALL keep its aria-label, title and behaviour and stay at the inline end.

#### Scenario: Card padding
- **WHEN** the detailed region is expanded
- **THEN** `.card.detailed-summary` has non-zero padding on all four sides and its chips, links and copy button lie inside it, with `dir` ltr or rtl

#### Scenario: Links keep their meaning
- **WHEN** the detailed region is expanded for job `j 1`
- **THEN** "Explore coverage" is an `<a>` with href `/explore?job=j%201` and the card has no "Open detailed analysis page" link and no anchor whose href ends in `/detail`

#### Scenario: Button styling
- **WHEN** the link is rendered
- **THEN** it has a 1px border, a background, horizontal padding, a minimum height of 44px and a pill radius, and under 640px the link MAY wrap to full width

#### Scenario: Button states
- **WHEN** the link has keyboard focus, is hovered or is pressed
- **THEN** it shows a focus ring of at least 2px with at least 3:1 contrast, a distinct hover background and a distinct active background, transitions last at most 150ms and none run under `prefers-reduced-motion`

### Requirement: Detail body
The Detail metrics bar (Patterns, Claims, Risk and Latency, all real values) and the full JobView (title, highlighted text, technique list, risk overview, why region, notes, LLM-assessed group) SHALL be one component (DetailedAnalysis) rendered in the detailed region of `/jobs/:id`.

#### Scenario: Metrics in the region
- **WHEN** two techniques were detected and the region is expanded
- **THEN** the metrics bar shows Patterns "2 detected" and the JobView content is present

## REMOVED Requirements

### Requirement: Detail verdict text
**Reason**: The `/jobs/:id/detail` page is removed; the verdict card already shows `finalization.result.user_text`.
