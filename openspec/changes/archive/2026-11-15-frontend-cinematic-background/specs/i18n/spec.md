## ADDED Requirements

### Requirement: Ambient demo catalog
A namespace `ambient` SHALL exist as `src/i18n/locales/<lng>/ambient.ts` for en, fr, ar, de, fi and ru with identical keys: `card.<n>.source`, `card.<n>.text`, `card.<n>.meta`, `card.<n>.phrase` (a substring of the text) for each highlighted card, and `no_signals`. Every value SHALL be non-empty fictional demo copy. The completeness and static-string tests SHALL pass without extending their allow-lists.

#### Scenario: Neutral badge text
- **WHEN** `t('ambient.no_signals')` is called in en
- **THEN** it returns "No strong signals"

#### Scenario: Completeness
- **WHEN** the catalog completeness test runs
- **THEN** every locale has the `ambient` namespace with the same keys and non-empty values as en

## MODIFIED Requirements

### Requirement: Catalogs
Catalogs SHALL be one TS module per locale and namespace at `src/i18n/locales/<lng>/<ns>.ts` with a default export of a flat key→string object, discovered with `import.meta.glob` and addressed as `<ns>.<key>`; the `en` catalogs are the source of truth. First-pass translations of every key in `common`, `shell` and `home` SHALL exist for fr, ar, de and fi, and of every key in every namespace of `en` for ru.

#### Scenario: Adding a namespace
- **WHEN** a file `locales/<lng>/<ns>.ts` is added
- **THEN** its keys are available as `<ns>.<key>` without editing a registry

#### Scenario: Russian namespaces
- **WHEN** the files of `locales/ru` and `locales/en` are listed
- **THEN** both hold the same namespaces (ambient, analysis, ask, common, compose, explore, history, home, results, settings, shell, techniques)
