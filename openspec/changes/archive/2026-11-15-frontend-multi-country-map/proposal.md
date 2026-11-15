## Why
Shared change `ai-country-association` (shared-specs@24b7969236d03059dd6447481c27afd541fcac7e, junction-2026/project#75) lets every analysis, including pasted text and unknown outlets, be associated with one or more countries. A map analysis now has `countries[]` (MapCountry with `basis`), a nullable `outlet` and possibly an empty `source.url`, and counts per country can add up to more than the top-level `analyses`. The Explore map still describes a country as "the country of the page's outlet", which is no longer true.

## What Changes
- `readAnalyses` (`src/api/mapTypes.ts`) reads `countries` (MapCountry `{country_code, country, basis}`), ignoring unknown `basis` values and dropping invalid entries; `outlet` stays null and `source.url` stays `""` without throwing.
- Panel items show the outlet line only for a non-null outlet, never render an empty `source.url`, and list "Also associated with: <names>" for the other countries.
- Tooltip, lede, map title/note, empty state and the notice use "associated country" wording in en, fr, ar, de, fi, ru.
- The subtitle keeps using the top-level `analyses`; items are never summed.

## Impact
Frontend only. Reads shared capability `propaganda-map-api`; no shared change.
