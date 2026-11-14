## MODIFIED Requirements

### Requirement: Supported locales
`src/i18n/locales.ts` SHALL declare, once, exactly the locales `en` (default and fallback), `fr`, `ar`, `de`, `fi` and `ru` with the native labels English, Français, العربية, Deutsch, Suomi and Русский and a text direction; only `ar` SHALL be `rtl`.

#### Scenario: Declared locales
- **WHEN** the locale list is read
- **THEN** it holds en, fr, ar, de, fi, ru with those labels and only `ar` has direction rtl

#### Scenario: Russian in the language selector
- **WHEN** the language selector is rendered
- **THEN** it lists Русский after Suomi and `ru` has direction ltr

### Requirement: Catalogs
Catalogs SHALL be one TS module per locale and namespace at `src/i18n/locales/<lng>/<ns>.ts` with a default export of a flat key→string object, discovered with `import.meta.glob` and addressed as `<ns>.<key>`; the `en` catalogs are the source of truth. First-pass translations of every key in `common`, `shell` and `home` SHALL exist for fr, ar, de and fi, and of every key in every namespace of `en` for ru.

#### Scenario: Adding a namespace
- **WHEN** a file `locales/<lng>/<ns>.ts` is added
- **THEN** its keys are available as `<ns>.<key>` without editing a registry

#### Scenario: Russian namespaces
- **WHEN** the files of `locales/ru` and `locales/en` are listed
- **THEN** both hold the same namespaces (analysis, ask, common, compose, explore, history, home, results, settings, shell, techniques)

### Requirement: Brand name in catalogs
Every string in the en, de, fr, fi, ar and ru catalogs that names the product SHALL use "VEIL" (all caps, Latin script) unchanged (never translated or transliterated), grammatically inflected where the language requires it; in ru an inflection SHALL be a hyphenated ending (for example "VEIL-а"). The French common noun "veille" is not the brand and is unchanged.

#### Scenario: Inflection
- **WHEN** the fi catalog says "ask VEIL" or "VEIL's"
- **THEN** the strings read "Kysy VEILiltä" and "VEILin", the fi mock label reads "Ask VEIL:llä ei ole taustajärjestelmää", the de string reads "VEIL fragen" and the fr string reads "Demander à VEIL"

#### Scenario: Russian brand
- **WHEN** the ru catalog names the product
- **THEN** the name is "VEIL" in Latin caps (the ru `results.ask` reads "Спросить VEIL") and no catalog string contains a Cyrillic transliteration of it

### Requirement: Key-completeness test
A test SHALL iterate every namespace found in `locales/en` (same `import.meta.glob` discovery as the runtime, so namespaces added by other changes are covered) and, for each of fr, ar, de, fi and ru, assert the same namespaces and keys, non-empty values and identical `{placeholder}` sets. Plural forms are compared by base key and each plural group SHALL contain `_other`. The test SHALL assert that the catalog locales are exactly ar, de, en, fi, fr and ru.

#### Scenario: Missing translation fails
- **WHEN** a key of an en namespace is absent or empty in ar
- **THEN** the test fails naming the locale, namespace and key

#### Scenario: Placeholders differ
- **WHEN** a de string lacks a `{count}` that the en string has
- **THEN** the test fails

#### Scenario: Russian covered
- **WHEN** a key of an en namespace is absent or empty in ru, or a ru string lacks a placeholder of en
- **THEN** the test fails naming ru, the namespace and the key

### Requirement: Technique catalog
The `techniques` namespace SHALL exist for en, fr, ar, de, fi and ru with, for every technique id, the keys `<id>.name` and `<id>.definition`, and the templates `why_span` (placeholders `{name}` and `{span}`) and `why_no_span` (placeholder `{name}`). The ids SHALL be the 18 classifier names (technique-classifier-result) and the 3 LLM labels (llm-technique-result). The ru wording SHALL be aligned with the ru entries of the backend glossary (`technique_glossary.yaml`).

#### Scenario: Every id in every language
- **WHEN** the catalog test runs
- **THEN** each of the 21 ids has a non-empty name and definition in en, fr, ar, de, fi and ru, and `why_span` contains `{span}` and `{name}`

#### Scenario: Template with span text
- **WHEN** the locale is `ar` and `why_span` is filled with the localized name of `Loaded_Language` and the span text `mensonges`
- **THEN** the result is Arabic text containing `mensonges` unchanged

## ADDED Requirements

### Requirement: Russian plural forms
Every plural group of `en` (`<key>_one`, `<key>_other`) SHALL have the ru forms `<key>_one`, `<key>_few`, `<key>_many` and `<key>_other`, each with the `{count}` or `{n}` placeholder set of the en group, and `t` SHALL select among them with `Intl.PluralRules('ru')`.

#### Scenario: Russian plural categories
- **WHEN** `pluralCategory` is called for 1, 2, 5, 11, 21 and 1.5 in ru
- **THEN** it returns one, few, many, many, one and other

#### Scenario: Count key renders the matching form
- **WHEN** `t('home.chars', {count})` is called in ru for 1, 2, 5, 11, 21 and 1.5
- **THEN** it returns "1 символ", "2 символа", "5 символов", "11 символов", "21 символ" and "1.5 символа"

### Requirement: Russian locale behaviour
Selecting or detecting `ru` SHALL behave as for the other locales: `navigator.languages` `['ru-RU']` with nothing stored resolves to `ru`, a stored `veil.locale` of `ru` wins over the navigator, `html` gets lang `ru` and dir `ltr`, formatters (`formatDate`, `formatNumber`, `formatRelativeTime`, `formatCountryName`) produce Russian output, and job localization requests carry `language=ru`.

#### Scenario: Navigator detection
- **WHEN** nothing is stored and `navigator.languages` is `['ru-RU']`
- **THEN** the locale is `ru`

#### Scenario: Stored choice wins
- **WHEN** `veil.locale` is `ru` and `navigator.languages` is `['fi-FI']`
- **THEN** the locale is `ru`

#### Scenario: Document language
- **WHEN** the locale is switched to ru
- **THEN** `html` has lang `ru` and dir `ltr` and `localStorage['veil.locale']` is `ru`

#### Scenario: Russian formatters
- **WHEN** ru formatters are called for 1234.5, 2026-11-14, one day ago, three hours ago and the region FI
- **THEN** they return "1 234,5" (with a no-break space), "14 ноября 2026 г.", "вчера", "3 часа назад" and "Финляндия"

#### Scenario: Localization request
- **WHEN** a finished job is shown with the UI in Russian
- **THEN** exactly one request `/jobs/<id>/localization?language=ru` is sent

### Requirement: Russian strings fit the main screens
The Russian strings of the shell navigation, Home, Results and History SHALL NOT cause horizontal overflow or clipped text at viewport widths of 360px and 1280px; where a string is too long it SHALL be shortened instead of changing the layout.

#### Scenario: No overflow
- **WHEN** the locale is ru and the shell, Home, History and Results are rendered at 360px and 1280px
- **THEN** the document is not wider than the viewport and no control text is clipped
