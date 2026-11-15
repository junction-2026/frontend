# i18n Specification

## Purpose
Defines the frontend's in-house internationalization layer: the supported locales, message catalogs, fallback, locale persistence and detection, the document language and direction, and locale-aware formatters.

## Requirements

### Requirement: Supported locales
`src/i18n/locales.ts` SHALL declare, once, exactly the locales `en` (default and fallback), `fr`, `ar`, `de`, `fi` and `ru` with the native labels English, Français, العربية, Deutsch, Suomi and Русский and a text direction; only `ar` SHALL be `rtl`.

#### Scenario: Declared locales
- **WHEN** the locale list is read
- **THEN** it holds en, fr, ar, de, fi, ru with those labels and only `ar` has direction rtl

#### Scenario: Russian in the language selector
- **WHEN** the language selector is rendered
- **THEN** it lists Русский after Suomi and `ru` has direction ltr

### Requirement: Translation API
`src/i18n` SHALL export `I18nProvider`, `useT`, `useLocale`, `useFormat`, `formatDate`, `formatNumber` and `formatRelativeTime` and add no runtime npm dependency. `useT()` SHALL return `t(key, params?)` that replaces `{name}` placeholders from `params`. `useLocale()` SHALL return `{locale, setLocale, dir}`; without a provider the locale SHALL be `en`.

#### Scenario: Interpolation and plural
- **WHEN** `t('home.chars', {count: 1})` and `t('home.chars', {count: 3})` are called in en
- **THEN** they return "1 char" and "3 chars"

### Requirement: Plural forms
When `params.count` is a number, `t` SHALL select the key `<key>_<category>` using `Intl.PluralRules` of the locale (`zero`, `one`, `two`, `few`, `many`, `other`), falling back to `<key>_other`.

#### Scenario: Arabic plural
- **WHEN** `t('home.chars', {count: 2})` is called in ar
- **THEN** the `_two` form is used

### Requirement: Catalogs
Catalogs SHALL be one TS module per locale and namespace at `src/i18n/locales/<lng>/<ns>.ts` with a default export of a flat key→string object, discovered with `import.meta.glob` and addressed as `<ns>.<key>`; the `en` catalogs are the source of truth. First-pass translations of every key in `common`, `shell` and `home` SHALL exist for fr, ar, de and fi, and of every key in every namespace of `en` for ru.

#### Scenario: Adding a namespace
- **WHEN** a file `locales/<lng>/<ns>.ts` is added
- **THEN** its keys are available as `<ns>.<key>` without editing a registry

#### Scenario: Russian namespaces
- **WHEN** the files of `locales/ru` and `locales/en` are listed
- **THEN** both hold the same namespaces (ambient, analysis, ask, common, compose, explore, history, home, results, settings, shell, techniques)

### Requirement: Fallback and catalog consistency
A key that is absent or empty in the active locale SHALL fall back to the `en` value; a key that no catalog defines SHALL render as "…". `translate` SHALL NEVER return the key, `undefined` or an empty string and SHALL NOT throw. In development each missing `locale:key` SHALL log one `console.warn`; production logs nothing. Non-en keys and placeholders SHALL exist in the en catalog (a plural form `<key>_<category>` is valid when en has `<key>_other`).

#### Scenario: Missing key falls back
- **WHEN** a key is absent or empty in the de catalog but present in en
- **THEN** `t` returns the en string and, in development, logs one console.warn naming the key and locale

#### Scenario: Key missing everywhere
- **WHEN** a key is absent from every catalog
- **THEN** `t` returns "…" and never the key, `undefined` or an empty string

#### Scenario: Catalog consistency
- **WHEN** the catalog test runs
- **THEN** no non-en catalog has a key or placeholder absent from en

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

### Requirement: Document language and direction
On init and on every change the provider SHALL set `document.documentElement.lang` to the locale and `document.documentElement.dir` to `rtl` for `ar`, else `ltr`. `index.html` SHALL keep `lang="en" dir="ltr"` as the pre-hydration default.

#### Scenario: Arabic and back
- **WHEN** the locale becomes ar and then en
- **THEN** `html` has lang ar dir rtl, then lang en dir ltr

### Requirement: Locale-aware formatters
`src/i18n/format.ts` SHALL export `formatDate`, `formatNumber`, `formatPercent`, `formatRelativeTime`, `pluralCategory` and `formatCountryName(code, fallback, locale)`, built on `Intl.DateTimeFormat`, `NumberFormat`, `RelativeTimeFormat`, `PluralRules` (Arabic zero to other forms) and `DisplayNames` for the active locale. `formatCountryName` SHALL return the fallback when `Intl.DisplayNames` is missing or has no name. `useFormat()` SHALL expose them bound to the locale.

#### Scenario: Number in German
- **WHEN** `formatNumber(1234.5)` is called with locale de
- **THEN** the result is "1.234,5"

#### Scenario: Arabic plural categories
- **WHEN** `pluralCategory` is called for 0, 1, 2, 3, 11 and 100 in ar
- **THEN** it returns zero, one, two, few, many and other

#### Scenario: Country name fallback
- **WHEN** `formatCountryName('FI', 'Finland', 'fr')` is called and `Intl.DisplayNames` throws
- **THEN** the result is "Finland"

### Requirement: Right-to-left layout
The shell, base, components and analyze CSS SHALL use logical properties instead of physical left/right margins, paddings, positions and text alignment, and directional glyphs SHALL be mirrored under `[dir=rtl]`; the top bar and Home SHALL remain usable at 1280px and 375px in Arabic.

#### Scenario: Arabic layout
- **WHEN** the locale is ar
- **THEN** the top bar and Home render mirrored without overflow

### Requirement: Brand name in catalogs
Every string in the en, de, fr, fi, ar and ru catalogs that names the product SHALL use "VEIL" (all caps, Latin script) unchanged (never translated or transliterated), grammatically inflected where the language requires it; in ru an inflection SHALL be a hyphenated ending (for example "VEIL-а"). The French common noun "veille" is not the brand and is unchanged.

#### Scenario: Inflection
- **WHEN** the fi catalog says "ask VEIL" or "VEIL's"
- **THEN** the strings read "Kysy VEILiltä" and "VEILin", the de string reads "VEIL fragen" and the fr string reads "Demander à VEIL"

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

### Requirement: Isolation of untranslatable fragments
In every locale, URLs, outlet and model names, API codes, percentages and quoted source text rendered inside translated sentences or lists SHALL be wrapped in `<bdi>` (or carry `dir="auto"`), so that they keep their own direction inside Arabic text. A `rich(text, nodes)` helper SHALL split a translated string on its `{name}` placeholders and insert the given nodes.

#### Scenario: Quote in Arabic
- **WHEN** an Explore claim line is rendered in ar
- **THEN** the claim text is inside a `bdi` element and the sentence around it is Arabic

### Requirement: Language switching keeps state
Changing the locale SHALL only change the context: the route, the Explore country selection, the History filter and list, and the Home input SHALL be kept, and no request SHALL be made other than data that is itself locale-specific. The language preference SHALL keep persisting in `localStorage['veil.locale']`.

#### Scenario: Filter survives a switch
- **WHEN** an Explore country is selected on the map and the locale changes from en to ar
- **THEN** the country stays selected, `html` has dir rtl, and no new request was sent

### Requirement: No hardcoded static strings
User-visible static text of the shell, Home, Explore, Region, History, Ask, Settings and States views and of `src/explore`, `src/history` and `src/ui` SHALL come from the catalogs. A test SHALL fail when those `.tsx` files contain JSX text or `placeholder`, `title`, `aria-label` or `alt` string literals that contain letters, other than an allow-list of the brand name "VEIL" and the avatar initial.

#### Scenario: Literal added to a view
- **WHEN** a view gets `<h2>Hello</h2>`
- **THEN** the test fails naming the file and the text

### Requirement: Technique catalog
The `techniques` namespace SHALL exist for en, fr, ar, de, fi and ru with, for every technique id, the keys `<id>.name` and `<id>.definition`, and the templates `why_span` (placeholders `{name}` and `{span}`) and `why_no_span` (placeholder `{name}`). The ids SHALL be the 18 classifier names (technique-classifier-result) and the 3 LLM labels (llm-technique-result). The ru wording SHALL be aligned with the ru entries of the backend glossary (`technique_glossary.yaml`).

#### Scenario: Every id in every language
- **WHEN** the catalog test runs
- **THEN** each of the 21 ids has a non-empty name and definition in en, fr, ar, de, fi and ru, and `why_span` contains `{span}` and `{name}`

#### Scenario: Template with span text
- **WHEN** the locale is `ar` and `why_span` is filled with the localized name of `Loaded_Language` and the span text `mensonges`
- **THEN** the result is Arabic text containing `mensonges` unchanged

### Requirement: Technique terminology
Technique wording SHALL be natural in each language (Modern Standard Arabic for ar), and one term per technique SHALL be used on every page.

#### Scenario: One term across pages
- **WHEN** `Loaded_Language` appears in the results tags, the detail list and a highlight label in `de`
- **THEN** all three show the same German name from the catalog

### Requirement: German home title
When the active locale is `de`, the Home page title SHALL render the text from the catalog key `home.title`, which SHALL be "Sehen Sie hinter das Narrativ.". The `home.title` values of all other locales SHALL be unchanged.

#### Scenario: German Home title
- **WHEN** the locale is switched to de on the Home page
- **THEN** the page title reads "Sehen Sie hinter das Narrativ."

#### Scenario: Other locales unchanged
- **WHEN** the `home.title` catalog values of en, fr, ar and fi are compared with the previous revision
- **THEN** they are byte-for-byte identical

### Requirement: Visibility catalog keys
The catalogs SHALL include the keys `compose.visibility.label` and `compose.visibility.hint` in en, fr, ar, de and fi, covered by the key-completeness test.

#### Scenario: Keys in every locale
- **WHEN** the completeness test runs
- **THEN** every locale has non-empty `compose.visibility.label` and `compose.visibility.hint`

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

### Requirement: Propaganda map strings
Every string of the global propaganda map SHALL be a key in the `explore` namespace of en, fr, ar, de, fi and ru, with the plural forms of each locale for counted phrases. The i18n runtime SHALL NOT change.

#### Scenario: Catalog completeness
- **WHEN** the catalog completeness test runs
- **THEN** every new `explore` key exists in all six locales with matching placeholders

### Requirement: History catalog keys for search and export
All catalogs (ar, de, en, fi, fr, ru) SHALL NOT contain the keys `history.ledger`, `history.session`, `history.session_scope`, `history.synchronized`, `history.sync_state`, `history.export_label` and `history.search_label`, and SHALL contain `history.empty.search` (with the placeholder `{query}`), `history.exporting` and `history.export_hint`. The key-completeness test SHALL pass. The CSV header names of the History export are fixed machine names and SHALL NOT be translated.

#### Scenario: Complete catalogs
- **WHEN** the key-completeness test runs
- **THEN** every locale has the same History keys and placeholders as en

### Requirement: Ambient demo catalog
A namespace `ambient` SHALL exist as `src/i18n/locales/<lng>/ambient.ts` for en, fr, ar, de, fi and ru with identical keys: `card.<n>.source`, `card.<n>.text`, `card.<n>.meta`, `card.<n>.phrase` (a substring of the text) for each highlighted card, and `no_signals`. Every value SHALL be non-empty fictional demo copy. The completeness and static-string tests SHALL pass without extending their allow-lists.

#### Scenario: Neutral badge text
- **WHEN** `t('ambient.no_signals')` is called in en
- **THEN** it returns "No strong signals"

#### Scenario: Completeness
- **WHEN** the catalog completeness test runs
- **THEN** every locale has the `ambient` namespace with the same keys and non-empty values as en

### Requirement: No New Analysis shell key
The `shell` namespace SHALL NOT define `new_analysis` in any locale (en, de, fi, fr, ar, ru); the catalog-parity test continues to pass.

#### Scenario: Key removed
- **WHEN** the `shell` catalogs of all locales are inspected
- **THEN** none defines `new_analysis`
