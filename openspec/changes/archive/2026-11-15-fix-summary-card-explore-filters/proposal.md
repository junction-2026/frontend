## Why

The expanded detailed-summary card on the Results page has no inner padding, so technique chips, the action links and the copy button touch the card border, and its two links read as plain text. The Explore coverage page also carries a filter bar (search, topic, country, Languages, Publishers, verified-only) that adds noise to a map-first screen.

## What Changes

- `.card.detailed-summary` gets the same inner padding as other result cards; "Explore coverage" and "Open detailed analysis page" stay `<a>` links but are styled as secondary buttons.
- The Explore per-job screen drops the whole filter bar, its state and helpers (`Filters`, `NO_FILTERS`, `options()`, `Multi`) and the matching i18n keys in all 6 locales.
- Related Coverage and the map aggregate all items (articles and fact-checks); only a map country click narrows the list.
- No shared contract change.

## Impact

- Frontend only: `src/job/results.css`, `src/explore/*`, `src/secondary/secondary.css`, `src/i18n/locales/*/explore.ts`, tests.
- Specs: `results-history-views` (ADDED), `explore-coverage` (REMOVED/MODIFIED), `i18n` (MODIFIED).
