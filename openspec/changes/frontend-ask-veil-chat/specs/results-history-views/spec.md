## MODIFIED Requirements

### Requirement: Initial actions
Below the verdict card the Results screen SHALL show a primary `<button class="btn-primary">` "View detailed analysis" and a secondary link "Ask VEIL" (class `btn-secondary`, `href` `/jobs/{id}/ask` with the id URL-encoded). Before the detailed region is opened only the meta row, the verdict card (or state card) and these actions SHALL be shown; the one technique name on the Top technique card is the only technique shown. Non-verdict state cards keep their content and tones.

#### Scenario: Initial view
- **WHEN** a completed job `j1` is shown
- **THEN** the "Ask VEIL" link has `href` `/jobs/j1/ask`

### Requirement: Ask VEIL link on Results
The Ask VEIL call-to-action card SHALL NOT be shown on Results; the compact "Ask VEIL" link carries no data and SHALL NOT be wrapped in `Mock`. The static `/states` showcase has no job, so its "Ask VEIL" link keeps `/ask` (the "Choose an analysis" state).

#### Scenario: Ask VEIL link
- **WHEN** the Results screen of job `j 1` is shown
- **THEN** the "Ask VEIL" link points to `/jobs/j%201/ask`, has no `Mock` ancestor and no "Have questions about this verdict" card is shown
