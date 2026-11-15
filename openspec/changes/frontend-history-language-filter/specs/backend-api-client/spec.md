## ADDED Requirements

### Requirement: listJobs language filter
`listJobs` SHALL accept an optional `language` (a two-letter code or `unknown`) and send it as the `language` query parameter only when it is non-empty, together with the other parameters and on every page requested with `next_cursor`. `JobSummary` SHALL have `language?: string | null`; a missing member SHALL be read as `null`.

#### Scenario: Language sent
- **WHEN** `listJobs({ limit: 20, status: 'failed', q: 'x', language: 'unknown' })` is called
- **THEN** the request is `/api/v1/jobs?limit=20&status=failed&q=x&language=unknown`

#### Scenario: No language
- **WHEN** `language` is absent or empty
- **THEN** the request has no `language` parameter

#### Scenario: Missing member
- **WHEN** an item has no `language` member
- **THEN** it is read as `language: null`
