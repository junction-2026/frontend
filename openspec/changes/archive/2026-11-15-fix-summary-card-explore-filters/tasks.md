## 1. Results card

- [x] 1.1 Pad `.card.detailed-summary` (1rem 1.15rem) and style its two links as secondary buttons in `src/job/results.css`, scoped to `.detailed-summary`
- [x] 1.2 Keep the links as `<a>` with unchanged labels/hrefs; verify with the existing ResultsView test

## 2. Explore

- [x] 2.1 Remove the filter bar, `Multi`, filter state, `Filters`, `NO_FILTERS`, `options()` and reduce `filterItems` to country narrowing
- [x] 2.2 Map and Related Coverage use all items; Related counts use the article noun
- [x] 2.3 Remove unused `.filters`/`.field`/`.verified-chip`/`.multi` CSS
- [x] 2.4 Remove the filter i18n keys from en, de, fi, fr, ru, ar

## 3. Tests and validation

- [x] 3.1 Update filters, Explore, locale-switch and propaganda-map tests
- [x] 3.2 `npm run lint`, `npx tsc -b`, `npm test`, `scripts/validate-openspec.sh`
