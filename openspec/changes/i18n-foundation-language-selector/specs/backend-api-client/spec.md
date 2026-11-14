## MODIFIED Requirements
### Requirement: Error messages
`src/api/errors.ts` SHALL map the codes `invalid_request`, `validation_failed` (listing `details.fields` per path), `not_found`, `method_not_allowed`, `payload_too_large`, `internal_error`, `unknown_analyzer` (listing `details.analyzer_ids`), `analyzer_not_selectable`, `job_finished` and `network_error` to copy from the active locale's `common.errors.*` catalog (en: "Content is larger than 1 MiB" for 413). Any other code SHALL return `error.message` as plain text, untranslated.

#### Scenario: Field errors
- **WHEN** a `validation_failed` error has `details.fields {"input.content": "must not be blank"}`
- **THEN** the copy mentions `input.content` and "must not be blank"

#### Scenario: Translated copy
- **WHEN** the locale is de and the error code is `not_found`
- **THEN** the German catalog text is returned, and an unknown code still returns `error.message`
