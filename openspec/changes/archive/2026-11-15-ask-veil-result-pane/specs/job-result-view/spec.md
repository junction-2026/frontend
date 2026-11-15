## ADDED Requirements

### Requirement: Optional selection mode
Result components (Verdict, JobView, RiskScore, WikipediaLookup, TermContext) SHALL render selection toggles only when a focus-selection context provider is present. `/jobs/:id` SHALL NOT provide it, so its rendering, collapsed detailed region and actions are unchanged.

#### Scenario: Result screen
- **WHEN** `/jobs/:id` is rendered and the detailed region is opened
- **THEN** no element has an accessible name starting with "Ask about" and no selection toggle exists

#### Scenario: Ask page
- **WHEN** the Ask page provides the context and the job has a Wikipedia claim
- **THEN** the claim block has a toggle named "Ask about <claim>"
