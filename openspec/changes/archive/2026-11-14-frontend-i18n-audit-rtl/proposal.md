## Why
Part of junction-2026/project#45 (incomplete translations, Arabic RTL). The shell, Home, Explore, History, Ask, Settings and States are mostly localized, but a few static strings and the Ask mock outlet and wire source names are still literal, a missing key is silent, nothing enforces that all catalogs stay complete, some directional glyphs and untranslatable fragments (URLs, percentages, quotes) are not isolated in Arabic, and nothing tests a locale switch over live Explore filters.

## What Changes
- `translate` falls back to `en` for a key missing or empty in the active locale, warns once per key in development, and never returns the key, `undefined` or an empty string.
- A key-completeness test iterates every namespace found in `locales/en` and checks keys, non-empty values and `{placeholder}` sets in fr, ar, de and fi; plural forms follow each language's `Intl.PluralRules` categories.
- A static-string test scans the owned views for hardcoded user-visible JSX text and attributes.
- Intl helpers: `formatPercent`, `pluralCategory`, `formatCountryName` (Intl.DisplayNames with fallback).
- Remaining literals (Ask and Region source names) become catalog keys in all five locales.
- `<bdi>` isolation for URLs, model/outlet names, percentages, codes and source quotes; directional glyphs (↗, ⌕) mirror under `[dir=rtl]`.
- Tests: Home, Explore, History and Settings in ar and in the four other locales; a filter kept across a locale switch; missing-key fallback.
- No shared contract change (frontend-only UI behaviour; shared spec job-text-localization @ 07b1fce6 is cited, not changed). No branding, colour, typography or navigation change.

## Impact
Specs: i18n, results-history-views, explore-coverage, analyze-flow-ui, secondary-screens, ui-design-foundation. Files: `src/i18n/*`, `src/views/*` (not result/detail), `src/explore/*`, `src/history/*`, `src/ui/*`, `src/styles/*`, catalogs `common, home, explore, history, ask, settings, shell`. The `analysis`, `results` and `techniques` namespaces and `src/job/*` belong to frontend-result-localization and are only covered by the completeness test.
