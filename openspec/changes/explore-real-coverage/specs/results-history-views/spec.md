## MODIFIED Requirements
### Requirement: Mock-only parts of Results
The "Polarity / Intensity" signal row, "High rhetorical bias factor", the Share button and the Ask VEIL call to action SHALL be wrapped in `Mock`. Copy SHALL copy the page URL to the clipboard without `Mock`. "Explore full analysis" SHALL link to `/jobs/:id/detail` and "Explore coverage" to `/explore?job=<encoded job id>`.

#### Scenario: Copy
- **WHEN** the user presses Copy
- **THEN** `navigator.clipboard.writeText` receives the page URL and Copy has no `Mock` ancestor

#### Scenario: Explore coverage link
- **WHEN** Results renders for job `j 1`
- **THEN** the link "Explore coverage" has `href` `/explore?job=j%201` and no "Cross-source coverage" link exists
