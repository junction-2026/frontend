## ADDED Requirements

### Requirement: Wikipedia lookup types
`src/api/types.ts` SHALL describe the `wikipedia` result (shared wikipedia-lookup-result with change wikipedia-cross-language) as `WikipediaLookup`, `ClaimLookup`, `WikiLookup`, `CrossLanguageDifference` and `CompareValue`, each "at least these members" (index-tolerant). `cross_language`, `cross_language_differences`, `coverage` and `evidence_sentence` SHALL be optional, and enumerations SHALL be typed as strings because unknown values occur.

#### Scenario: Older result
- **WHEN** a stored result has ClaimLookups without `cross_language` and `cross_language_differences`
- **THEN** it is accepted by the types and rendered without a comparison
