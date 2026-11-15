## 1. API reader
- [x] 1.1 `readAnalyses`: `countries` (MapCountry), outlet null / url "" tolerated; reader tests
## 2. Panel
- [x] 2.1 Outlet line only when non-null; no empty `source.url`; "Also associated with"; tests (multi-country, pasted text, unknown basis)
## 3. Wording
- [x] 3.1 pmap.lede/map_title/map_note/empty/notice/tooltip_count rewritten in en, fr, ar, de, fi, ru; staticStrings and completeness tests
## 4. Checks
- [x] 4.1 `npm test`, `npm run lint`, `npx tsc -b`, `scripts/validate-openspec.sh`
