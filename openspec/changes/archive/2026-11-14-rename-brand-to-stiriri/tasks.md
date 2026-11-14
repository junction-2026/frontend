## 1. Brand copy
- [x] 1.1 index.html title, Shell brand, catalogs (en, de, fr, fi, ar) with correct inflection
- [x] 1.2 docs/mock-areas.md and secondary.css comment

## 2. Locale key
- [x] 2.1 STORAGE_KEY `stiriri.locale` with legacy `veil.locale` fallback and migration in `detectLocale`

## 3. Tests
- [x] 3.1 Update assertions and fixtures from VEIL/veil.locale to Stiriri/stiriri.locale
- [x] 3.2 Add i18n tests: legacy adopted, new key wins, setLocale writes `stiriri.locale`
