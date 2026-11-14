## 1. i18n core
- [x] 1.1 `translate`: empty counts as missing, development `console.warn` once per key, never the key/undefined/empty
- [x] 1.2 `format.ts`: `formatPercent`, `pluralCategory`, `formatCountryName`; `useFormat` exposes them; `translate` uses `pluralCategory`
- [x] 1.3 `rich` helper for `<bdi>`-isolated placeholders

## 2. Static strings and RTL
- [x] 2.1 Ask mock source names and Region wire sources into catalogs (en, fr, ar, de, fi)
- [x] 2.2 `<bdi>` for URLs, outlet/model names, percentages, codes and source quotes in Home, Explore, History, Ask, Region, Shell
- [x] 2.3 Mirror directional glyphs (`.mirror-rtl` gets a box under `[dir=rtl]`); the stylesheets already used logical properties, audited and unchanged
- [x] 2.4 Country names in Explore and Region through `formatCountryName`

## 3. Tests
- [x] 3.1 Key-completeness test (all namespaces, non-empty, placeholders, plural groups)
- [x] 3.2 Missing-key fallback and warning test
- [x] 3.3 Hardcoded-string test over the owned views
- [x] 3.4 Snapshot/DOM tests of Home, Explore, History, Settings in ar (dir=rtl, no Latin-script static text except brand/URLs) and in fr, de, fi, en
- [x] 3.5 Filter and search kept across a locale switch; no extra requests
- [x] 3.6 tsc, vitest, build, `scripts/validate-openspec.sh`
