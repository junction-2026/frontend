## 1. Brand copy
- [x] 1.1 index.html title, Shell brand, catalogs (en, de, fr, fi, ar) with correct inflection
- [x] 1.2 docs/mock-areas.md and secondary.css comment

## 2. Locale key
- [x] 2.1 STORAGE_KEY `veil.locale` with legacy `stiriri.locale` fallback and migration in `detectLocale`

## 3. Tests
- [x] 3.1 Update assertions and fixtures from Stiriri to VEIL
- [x] 3.2 i18n tests: legacy migrated, veil.locale wins, setLocale writes `veil.locale`, catalog brand strings
