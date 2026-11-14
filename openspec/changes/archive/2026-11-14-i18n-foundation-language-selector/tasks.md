## 1. i18n layer
- [x] 1.1 `src/i18n/{locales,catalogs,translate,format,context,I18nProvider}` and `index.ts`
- [x] 1.2 Catalogs `common`, `shell`, `home` for en, fr, ar, de, fi
- [x] 1.3 Catalog consistency test

## 2. UI
- [x] 2.1 Language selector in `Shell`; Shell, HealthIndicator, MockBadge on `useT`
- [x] 2.2 HomeView on `useT`; remove the Auto-detect chip
- [x] 2.3 `errorMessage` returns translated copy
- [x] 2.4 Logical CSS properties; `index.html` keeps `lang="en" dir="ltr"`

## 3. Docs and tests
- [x] 3.1 `docs/mock-areas.md`: remove the two rows
- [x] 3.2 Tests for provider, selector, detection, persistence, fallback, html lang/dir, formatters, HomeView chip absence
