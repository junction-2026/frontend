## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Key-completeness test
A test SHALL iterate every namespace found in `locales/en` (same `import.meta.glob` discovery as the runtime, so namespaces added by other changes are covered) and, for each of fr, ar, de and fi, assert the same namespaces and keys, non-empty values and identical `{placeholder}` sets. Plural forms are compared by base key and each plural group SHALL contain `_other`.

#### Scenario: Missing translation fails
- **WHEN** a key of an en namespace is absent or empty in ar
- **THEN** the test fails naming the locale, namespace and key

#### Scenario: Placeholders differ
- **WHEN** a de string lacks a `{count}` that the en string has
- **THEN** the test fails

### Requirement: Isolation of untranslatable fragments
In every locale, URLs, outlet and model names, API codes, percentages and quoted source text rendered inside translated sentences or lists SHALL be wrapped in `<bdi>` (or carry `dir="auto"`), so that they keep their own direction inside Arabic text. A `rich(text, nodes)` helper SHALL split a translated string on its `{name}` placeholders and insert the given nodes.

#### Scenario: Quote in Arabic
- **WHEN** an Explore claim line is rendered in ar
- **THEN** the claim text is inside a `bdi` element and the sentence around it is Arabic

### Requirement: Language switching keeps state
Changing the locale SHALL only change the context: the route, Explore filters and search text, the History filter and list, and the Home input SHALL be kept, and no request SHALL be made other than data that is itself locale-specific. The language preference SHALL keep persisting in `localStorage['veil.locale']`.

#### Scenario: Filter survives a switch
- **WHEN** an Explore country filter and search text are set and the locale changes from en to ar
- **THEN** the filter and the search text are unchanged, `html` has dir rtl, and no new request was sent

### Requirement: No hardcoded static strings
User-visible static text of the shell, Home, Explore, Region, History, Ask, Settings and States views and of `src/explore`, `src/history` and `src/ui` SHALL come from the catalogs. A test SHALL fail when those `.tsx` files contain JSX text or `placeholder`, `title`, `aria-label` or `alt` string literals that contain letters, other than an allow-list of the brand name "VEIL" and the avatar initial.

#### Scenario: Literal added to a view
- **WHEN** a view gets `<h2>Hello</h2>`
- **THEN** the test fails naming the file and the text
