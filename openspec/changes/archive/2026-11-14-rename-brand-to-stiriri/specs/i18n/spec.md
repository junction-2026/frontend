## MODIFIED Requirements

### Requirement: Initial locale and persistence
The initial locale SHALL be a valid `localStorage['stiriri.locale']`, else a valid legacy `localStorage['veil.locale']`, else the first `navigator.languages` entry whose primary subtag is supported, else `en`; an invalid stored value SHALL be ignored. A valid `stiriri.locale` SHALL win over the legacy key. `setLocale` SHALL store the locale under `stiriri.locale`; storage exceptions SHALL be caught and the locale kept in memory.

#### Scenario: Navigator detection
- **WHEN** nothing is stored and `navigator.languages` is `['fi-FI']` (or `['ja']`)
- **THEN** the locale is `fi` (or `en`)

#### Scenario: Reload keeps the choice
- **WHEN** the user selects de and the app is mounted again
- **THEN** the locale is de and `localStorage['stiriri.locale']` is `de`

#### Scenario: Legacy key adopted
- **WHEN** only `localStorage['veil.locale']` is `de`
- **THEN** the locale is `de`; the client SHOULD write `stiriri.locale` and MAY remove `veil.locale`

#### Scenario: New key wins
- **WHEN** `veil.locale` is `de` and `stiriri.locale` is `fi`
- **THEN** the locale is `fi`

## ADDED Requirements

### Requirement: Brand name in catalogs
Every string in the en, de, fr, fi and ar catalogs that names the product SHALL use "Stiriri" unchanged (never translated or transliterated), grammatically inflected where the language requires it. The French common noun "veille" is not the brand and is unchanged.

#### Scenario: Inflection
- **WHEN** the fi catalog says "ask Stiriri" or "Stiriri's"
- **THEN** the strings read "Kysy Stiririltä" and "Stiririn", and the de string reads "Stiriri fragen"
