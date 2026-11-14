## ADDED Requirements

### Requirement: Job visibility members
`CreateJobBody` (both the `input` and the `scrape` variant) SHALL accept an optional `public?: boolean` member and `Job` SHALL describe an optional `public?: boolean` member. A reader of `Job` SHALL treat an absent `public` as `true`.

#### Scenario: Non-public body
- **WHEN** a `CreateJobBody` of either variant is built with `public: false`
- **THEN** it type-checks and is sent as given

#### Scenario: Job without public
- **WHEN** a Job object has no `public` member
- **THEN** it is treated as public
