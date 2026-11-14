## Why
The top-bar language selector was a mock and Home showed a mock "Auto-detect (EN, FR, AR, DE, FI)" chip; the UI is English only (junction-2026/project#39, child #41).

## What Changes
- New dependency-free i18n layer `src/i18n/` (provider, `useT`, `useLocale`, `useFormat`, formatters) with locales en, fr, ar, de, fi and RTL for Arabic.
- The top-bar language selector becomes a real native `<select>`; the Home chip is removed.
- Shell, Home, HealthIndicator, the Mock badge and client-side API error copy are moved into catalogs (`common`, `shell`, `home`) with first-pass translations.
- Shell, base, components and analyze CSS use logical properties so the layout mirrors under `dir=rtl`.
- No shared contract change: everything is local to the frontend; API data is never translated.
