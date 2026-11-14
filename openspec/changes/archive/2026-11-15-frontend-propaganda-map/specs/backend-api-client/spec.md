## ADDED Requirements

### Requirement: Propaganda map client
`src/api/client.ts` SHALL export `getMapCountries()` (`GET /api/v1/map/countries`) and `listCountryAnalyses(code, { cursor, limit })` (`GET /api/v1/map/countries/{code}/analyses`, code URL-encoded, `cursor` and `limit` sent only when given). Failures SHALL be returned as the existing `ApiError` result, never thrown.

#### Scenario: Request shape
- **WHEN** `listCountryAnalyses('R U', { cursor: 'c 1', limit: 20 })` is called
- **THEN** the request is `GET /api/v1/map/countries/R%20U/analyses?limit=20&cursor=c+1`

#### Scenario: Error envelope
- **WHEN** the server answers 400 with an error envelope
- **THEN** the result is `{ ok: false, error }` with the envelope's code and message

### Requirement: Propaganda map types
The types in `src/api/mapTypes.ts` SHALL follow shared capability `propaganda-map-api` as a tolerant reader: unknown members are ignored, a MapTechnique without `strength` has no `strength`, and `verdict` and `source.title` may be null.

#### Scenario: Tolerant parsing
- **WHEN** the response items carry unknown members, a technique without `strength` and `verdict: null`
- **THEN** the call resolves `ok` with those items, the technique has no `strength` and the verdict is null
