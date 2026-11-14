## ADDED Requirements

### Requirement: Technique catalog
The `techniques` namespace SHALL exist for en, fr, ar, de and fi with, for every technique id, the keys `<id>.name` and `<id>.definition`, and the templates `why_span` (placeholders `{name}` and `{span}`) and `why_no_span` (placeholder `{name}`). The ids SHALL be the 18 classifier names (technique-classifier-result) and the 3 LLM labels (llm-technique-result).

#### Scenario: Every id in every language
- **WHEN** the catalog test runs
- **THEN** each of the 21 ids has a non-empty name and definition in en, fr, ar, de and fi, and `why_span` contains `{span}` and `{name}`

#### Scenario: Template with span text
- **WHEN** the locale is `ar` and `why_span` is filled with the localized name of `Loaded_Language` and the span text `mensonges`
- **THEN** the result is Arabic text containing `mensonges` unchanged

### Requirement: Technique terminology
Technique wording SHALL be natural in each language (Modern Standard Arabic for ar), and one term per technique SHALL be used on every page.

#### Scenario: One term across pages
- **WHEN** `Loaded_Language` appears in the results tags, the detail list and a highlight label in `de`
- **THEN** all three show the same German name from the catalog
