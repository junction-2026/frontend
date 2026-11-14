# i18n Specification

## Purpose
Defines the frontend's in-house internationalization layer: the supported locales, message catalogs, fallback, locale persistence and detection, the document language and direction, and locale-aware formatters.

## Requirements

### Requirement: Supported locales
`src/i18n/locales.ts` SHALL declare, once, exactly the locales `en` (default and fallback), `fr`, `ar`, `de` and `fi` with the native labels English, Français, العربية, Deutsch and Suomi and a text direction; only `ar` SHALL be `rtl`.

#### Scenario: Declared locales
- **WHEN** the locale list is read
- **THEN** it holds en, fr, ar, de, fi with those labels and only `ar` has direction rtl

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
Catalogs SHALL be one TS module per locale and namespace at `src/i18n/locales/<lng>/<ns>.ts` with a default export of a flat key→string object, discovered with `import.meta.glob` and addressed as `<ns>.<key>`; the `en` catalogs are the source of truth. First-pass translations of every key in `common`, `shell` and `home` SHALL exist for fr, ar, de and fi.

#### Scenario: Adding a namespace
- **WHEN** a file `locales/<lng>/<ns>.ts` is added
- **THEN** its keys are available as `<ns>.<key>` without editing a registry

### Requirement: Fallback and catalog consistency
Lookup SHALL go active locale → `en` → the key itself; a missing key SHALL NOT throw and SHALL NOT log. Every key of a non-en catalog SHALL exist in the matching en catalog (a plural form `<key>_<category>` is valid when en has `<key>_other`) and its placeholders SHALL equal those of the en string.

#### Scenario: Missing key falls back
- **WHEN** a key is absent from the de catalog but present in en
- **THEN** `t` returns the en string; and for a key absent from en it returns the key

#### Scenario: Catalog consistency
- **WHEN** the catalog test runs
- **THEN** no non-en catalog has a key or placeholder absent from en

### Requirement: Initial locale and persistence
The initial locale SHALL be a valid `localStorage['veil.locale']`, else the first `navigator.languages` entry whose primary subtag is supported, else `en`; an invalid stored value SHALL be ignored. `setLocale` SHALL store the locale; storage exceptions SHALL be caught and the locale kept in memory.

#### Scenario: Navigator detection
- **WHEN** nothing is stored and `navigator.languages` is `['fi-FI']` (or `['ja']`)
- **THEN** the locale is `fi` (or `en`)

#### Scenario: Reload keeps the choice
- **WHEN** the user selects de and the app is mounted again
- **THEN** the locale is de

### Requirement: Document language and direction
On init and on every change the provider SHALL set `document.documentElement.lang` to the locale and `document.documentElement.dir` to `rtl` for `ar`, else `ltr`. `index.html` SHALL keep `lang="en" dir="ltr"` as the pre-hydration default.

#### Scenario: Arabic and back
- **WHEN** the locale becomes ar and then en
- **THEN** `html` has lang ar dir rtl, then lang en dir ltr

### Requirement: Locale-aware formatters
`src/i18n/format.ts` SHALL export `formatDate(value, options)`, `formatNumber(value, options)` and `formatRelativeTime(iso, now)` using `Intl.DateTimeFormat`, `Intl.NumberFormat` and `Intl.RelativeTimeFormat` with the active locale, and `useFormat()` SHALL expose them bound to the locale.

#### Scenario: Number in German
- **WHEN** `formatNumber(1234.5)` is called with locale de
- **THEN** the result is "1.234,5"

### Requirement: Right-to-left layout
The shell, base, components and analyze CSS SHALL use logical properties instead of physical left/right margins, paddings, positions and text alignment, and directional glyphs SHALL be mirrored under `[dir=rtl]`; the top bar and Home SHALL remain usable at 1280px and 375px in Arabic.

#### Scenario: Arabic layout
- **WHEN** the locale is ar
- **THEN** the top bar and Home render mirrored without overflow
