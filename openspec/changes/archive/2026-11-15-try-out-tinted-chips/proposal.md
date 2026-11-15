## Why
The per-click "Expected for this demo" indicator hides the expectation until a chip is clicked and frames it as a demo guide. The expected results are LLM predictions, so they should be visible on every chip at a glance and explained once, permanently. Parent: junction-2026/project#92.

## What Changes
- Corpus chips are tinted by expected result (`data-expectation`, existing `--verdict-*` tokens), and the value is also given as text (title, visually hidden description).
- A permanent explainer paragraph `home.try.info` shows below the Try row while the corpus is active.
- REMOVED: the role=status expectation indicator, its colors and lifecycle; Home holds no selected-expectation state.
- Catalog: add `home.try.info`, `home.try.chip_expectation`; remove `home.try.expectation.prefix` and `.note` in all six locales.

## Impact
Frontend only (`HomeView.tsx`, `analyze.css` try-* rules, `home.ts` catalogs, `HomeView.test.tsx`). No shared-spec change; shared pin shared-specs@bd681f5668c056b0cfa7b45a5e413233aec386bc. The `Ledger header` requirement (owned by `remove-ledger-pool-caption`) is untouched.
