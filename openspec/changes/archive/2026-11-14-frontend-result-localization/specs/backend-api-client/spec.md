## ADDED Requirements

### Requirement: Job localization client
`src/api/client.ts` SHALL export `getJobLocalization(id, language)` for `GET /api/v1/jobs/{id}/localization?language=<code>` (shared job-text-localization), returning `{ok, data}` or `{ok:false, error}` and never throwing, with the id and language URL-encoded. `JobLocalization` and `LocalizedText` types SHALL be tolerant: unknown members are ignored and a `status` other than `original` or `translated`, or a missing `text`, SHALL count as unavailable.

#### Scenario: Request URL
- **WHEN** `getJobLocalization('a/b c', 'ar')` is called
- **THEN** the request URL is `/api/v1/jobs/a%2Fb%20c/localization?language=ar`

#### Scenario: Error response
- **WHEN** the response is 409 `job_not_finished`
- **THEN** the result is `{ok:false, error:{status:409, code:'job_not_finished', ...}}` and nothing is thrown
