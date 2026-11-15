## ADDED Requirements

### Requirement: Job list search and excerpt
`JobSummary` SHALL have the optional member `excerpt?: string | null`. `listJobs` SHALL accept an optional `q` and send it as the `q` query parameter only when it is non-empty. This reads the shared capability `analysis-jobs-api` (shared-specs@d4745c605a5b00999884130a9b08823a04c2c4e9).

#### Scenario: q sent
- **WHEN** `listJobs({ limit: 20, q: 'needle' })` is called
- **THEN** the request is `/api/v1/jobs?limit=20&q=needle`

#### Scenario: Empty q
- **WHEN** `listJobs({ q: '' })` is called
- **THEN** the request has no `q` parameter
