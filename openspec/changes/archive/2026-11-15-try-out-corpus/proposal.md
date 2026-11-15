## Why
The Analyze screen offers four fixed samples. A demo needs a large, varied try-out set, with a hint of what the analysis is expected to show. Parent: junction-2026/project#89 (D1 + D2).

## What Changes
- A committed corpus `src/data/try-out-statements.json` (1000 `{statement, expectation}` items, verbatim from the gist), loaded lazily by Home.
- The Try row shows 5 random chips from it, a Shuffle button, and after a chip click a colored, localized expectation indicator.
- The four legacy samples remain as the fallback while loading or when loading or validation fails.
- New keys `home.try.shuffle`, `home.try.expectation.*` in en, fr, de, fi, ar, ru.

## Impact
Frontend only (`src/home/tryCorpus.ts`, `HomeView.tsx`, `analyze.css`, `home.ts` catalogs, tests). No shared-spec, API or backend change. Shared spec pin: shared-specs@bd681f5668c056b0cfa7b45a5e413233aec386bc (no change). Overlaps with #76 on the `analyze-flow-ui` capability; Try-row selectors only.
