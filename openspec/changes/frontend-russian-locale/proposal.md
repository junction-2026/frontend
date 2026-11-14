## Why
Russian (`ru`) becomes a supported platform language (junction-2026/project#60). The backend's job-text-localization accepts `language=ru` (shared change `russian-localization-language`, shared-specs@293a1a1b5d86de5d8fd59bbe3938ba053d799b47); the frontend needs a Russian UI.

## What Changes
- `src/i18n/locales.ts` declares `ru` (native label Русский, ltr) after `fi`.
- New catalogs `src/i18n/locales/ru/<ns>.ts` for every namespace of `en` (analysis, ask, common, compose, explore, history, home, results, settings, shell, techniques) with all keys; count keys get `_one`, `_few`, `_many` and `_other` forms.
- Brand stays "VEIL" in Latin caps. Technique names, definitions and the why templates follow the backend glossary's ru entries.
- Tests enumerating locales include `ru`; new tests cover Russian plurals, detection, document lang/dir, formatters and the `language=ru` localization request.
- No shared contract change: the frontend already sends the UI locale as `language`; until the backend ships `ru`, the 400 takes the existing "unavailable" path and shows the original texts.

## Impact
Spec: i18n. No other capability changes. Existing locales are unchanged.
