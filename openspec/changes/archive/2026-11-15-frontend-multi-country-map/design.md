## Decisions
- **MapCountry reader**: `countries` entries need an upper-case two-letter-or-more `country_code`; `basis` keeps only the known values `outlet` and `content` (unknown ones ignored, an entry with none left is kept, since the code and name are still valid). Entries without a code are dropped. The top-level `country_code`/`country` members stay.
- **Other countries**: the panel lists `countries` minus the panel's `country_code`, named by `formatCountryName(code, server country || code)` as plain text in `<bdi>`.
- **Counts**: the subtitle uses the response's top-level `analyses` and the number of `items`; `items[].analyses` is only used per country (tooltip, shading).
- **Wording**: "N analyses associated with <country>"; the notice states a country is where an analysis is associated, never origin, author, target or a rating.
