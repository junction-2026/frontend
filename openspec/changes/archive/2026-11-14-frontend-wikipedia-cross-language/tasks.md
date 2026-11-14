## 1. Types and reading
- [x] 1.1 Wikipedia result types in `src/api/types.ts` (tolerant, index signatures)
- [x] 1.2 Read the `wikipedia` run: succeeded with a `claims` array, else unavailable; pending and running render nothing

## 2. Section
- [x] 2.1 `WikipediaLookup` component rendered by `JobView`: passages, links (https `*.wikipedia.org` only), coverage labels, cross-language states
- [x] 2.2 Styling: discrepancy distinct from coverage `conflicts`, gap and agree neutral, no counts

## 3. Copy
- [x] 3.1 `results.wiki.*` keys in en, de, fr, fi, ar

## 4. Tests
- [x] 4.1 agree, agree without values, discrepancy with one empty side, gap with coverage `conflicts`, null/missing/unknown `cross_language`, markup in a passage, non-wikipedia urls not linked, unavailable runs, unknown coverage and status
- [x] 4.2 Catalog completeness test passes; lint and typecheck pass
