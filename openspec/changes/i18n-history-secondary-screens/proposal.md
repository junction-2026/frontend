## Why
After the i18n foundation (junction-2026/project#39, child #41) only Shell and Home are translated. History, Explore, Region, Ask and Settings (child #43) still show fixed English text and English dates.

## What Changes
- Every user-facing string of HistoryView, ExploreView (and the Explore coverage components it renders), RegionView, AskView, SettingsView, `src/history/*` and `src/secondary/*` moves into the catalogs `history`, `explore`, `ask`, `settings` for en, fr, ar, de and fi.
- `dayLabel` and `relativeTime` take the locale (and a translator) as parameters and use the foundation formatters.
- Country names use `Intl.DisplayNames` in the active locale, falling back to the existing English name; mock dataset numbers use `formatNumber`.
- `history.css` and `secondary.css` use logical properties; the map SVG is not mirrored.
- The Settings "Interface & analysis language" block, its toggle and the tabs stay `Mock` and non-functional; only their text is translated.
- No shared contract change; API-provided strings (job excerpts, API error messages) are never translated.
