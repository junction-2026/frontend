## MODIFIED Requirements
### Requirement: Mock areas register
`docs/mock-areas.md` SHALL list every marked mock area by route and element, and SHALL NOT list the top-bar language selector or any element removed from a screen: the `/jobs/:id` Polarity / Intensity, bias factor and Share items, the `/jobs/:id/detail` metrics bar, and the `/jobs/:id/live` ledger caption "Synchronous consensus pool".

#### Scenario: Language selector not listed
- **WHEN** a reader opens `docs/mock-areas.md`
- **THEN** it has no row for the top-bar language selector or the Home language chip

#### Scenario: Removed Results items not listed
- **WHEN** a reader opens `docs/mock-areas.md`
- **THEN** it has no row for Polarity / Intensity, the bias factor, the Share button or the `/jobs/:id/detail` metrics bar

#### Scenario: Removed ledger caption not listed
- **WHEN** a reader opens `docs/mock-areas.md`
- **THEN** it has no row for the `/jobs/:id/live` ledger caption "Synchronous consensus pool"
