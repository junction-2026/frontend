## MODIFIED Requirements

### Requirement: Mock areas register
`docs/mock-areas.md` SHALL list every marked mock area by route and element; each screen task appends its rows. The top-bar language selector is functional and SHALL NOT be marked mock or listed. The register SHALL have no row for the `/jobs/:id` detailed-region items "Polarity / Intensity", "High rhetorical bias factor" and Share (removed from the screen), and none for the `/jobs/:id/detail` metrics bar (Risk and Latency are real).

#### Scenario: Language selector not listed
- **WHEN** a reader opens `docs/mock-areas.md`
- **THEN** it has no row for the top-bar language selector or the Home language chip

#### Scenario: Removed Results items not listed
- **WHEN** a reader opens `docs/mock-areas.md`
- **THEN** it has no row for Polarity / Intensity, the bias factor, the Share button or the `/jobs/:id/detail` metrics bar
