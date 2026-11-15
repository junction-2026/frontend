## MODIFIED Requirements

### Requirement: Catalogs
Catalogs SHALL be one TS module per locale and namespace at `src/i18n/locales/<lng>/<ns>.ts` with a default export of a flat key→string object, discovered with `import.meta.glob` and addressed as `<ns>.<key>`; the `en` catalogs are the source of truth. First-pass translations of every key in `common`, `shell` and `home` SHALL exist for fr, ar, de and fi, and of every key in every namespace of `en` for ru. There is no `settings` namespace.

#### Scenario: Adding a namespace
- **WHEN** a file `locales/<lng>/<ns>.ts` is added
- **THEN** its keys are available as `<ns>.<key>` without editing a registry

#### Scenario: Russian namespaces
- **WHEN** the files of `locales/ru` and `locales/en` are listed
- **THEN** both hold the same namespaces (ambient, analysis, ask, common, compose, explore, history, home, results, shell, techniques) and no `locales/<lng>/settings.ts` exists in en, de, fi, fr, ru or ar

### Requirement: No hardcoded static strings
User-visible static text of the shell, Home, Explore, Region, History, Ask and States views and of `src/explore`, `src/history` and `src/ui` SHALL come from the catalogs. A test SHALL fail when those `.tsx` files contain JSX text or `placeholder`, `title`, `aria-label` or `alt` string literals that contain letters, other than an allow-list of the brand name "VEIL" and the keycap of the search shortcut.

#### Scenario: Literal added to a view
- **WHEN** a view gets `<h2>Hello</h2>`
- **THEN** the test fails naming the file and the text
