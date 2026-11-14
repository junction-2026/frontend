## MODIFIED Requirements

### Requirement: Initial locale and persistence
The initial locale SHALL be a valid `localStorage['veil.locale']`, else a valid legacy `localStorage['stiriri.locale']`, else the first supported `navigator.languages` primary subtag, else `en`. Invalid stored values SHALL be ignored and a valid `veil.locale` SHALL win. `setLocale` SHALL store under `veil.locale`; storage exceptions SHALL be caught and the locale kept in memory.

#### Scenario: Navigator detection
- **WHEN** nothing is stored and `navigator.languages` is `['fi-FI']` (or `['ja']`)
- **THEN** the locale is `fi` (or `en`)

#### Scenario: Reload keeps the choice
- **WHEN** the user selects de and the app is mounted again
- **THEN** the locale is de and `localStorage['veil.locale']` is `de`

#### Scenario: Legacy key adopted
- **WHEN** only `localStorage['stiriri.locale']` is `de`
- **THEN** the locale is `de`; the client SHALL write `veil.locale` as `de` and remove `stiriri.locale`

#### Scenario: New key wins
- **WHEN** `stiriri.locale` is `de` and `veil.locale` is `fi`
- **THEN** the locale is `fi`

### Requirement: Brand name in catalogs
Every string in the en, de, fr, fi and ar catalogs that names the product SHALL use "VEIL" (all caps) unchanged (never translated or transliterated), grammatically inflected where the language requires it. The French common noun "veille" is not the brand and is unchanged.

#### Scenario: Inflection
- **WHEN** the fi catalog says "ask VEIL" or "VEIL's"
- **THEN** the strings read "Kysy VEILiltä" and "VEILin", the fi mock label reads "Ask VEIL:llä ei ole taustajärjestelmää", the de string reads "VEIL fragen" and the fr string reads "Demander à VEIL"
