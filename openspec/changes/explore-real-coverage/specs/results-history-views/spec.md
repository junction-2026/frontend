## MODIFIED Requirements
### Requirement: Mock-only parts of Results
In the detailed analysis region the "Polarity / Intensity" signal row, "High rhetorical bias factor" and the Share button SHALL be wrapped in `Mock`. Copy SHALL copy the page URL to the clipboard without `Mock`. "Explore coverage" SHALL link to `/explore?job=<encoded job id>` and "Open detailed analysis page" to `/jobs/:id/detail`. The Ask VEIL call-to-action card SHALL NOT be shown on Results; the compact "Ask VEIL" link carries no data and SHALL NOT be wrapped in `Mock`.

#### Scenario: Copy
- **WHEN** the user presses Copy
- **THEN** `navigator.clipboard.writeText` receives the page URL and Copy has no `Mock` ancestor

#### Scenario: Ask VEIL link
- **WHEN** the Results screen is shown
- **THEN** the "Ask VEIL" link points to `/ask`, has no `Mock` ancestor and no "Have questions about this verdict" card is shown

#### Scenario: Explore coverage link
- **WHEN** Results renders for job `j 1`
- **THEN** the link "Explore coverage" has `href` `/explore?job=j%201` and no "Cross-source coverage" link exists

### Requirement: Detailed analysis region content
The detailed region SHALL contain the analyzed excerpt (first 400 characters), the technique tags, the Mock-wrapped Polarity/Intensity row and "High rhetorical bias factor", "Explore coverage", "Open detailed analysis page" and the Copy and Share buttons, followed by the Coverage section.

#### Scenario: Expanded content
- **WHEN** the region is expanded
- **THEN** it shows the excerpt, technique tags, coverage and the link to `/jobs/:id/detail`
