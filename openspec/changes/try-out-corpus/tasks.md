## 1. Corpus
- [x] 1.1 Commit the gist verbatim as `src/data/try-out-statements.json` (1000 items; 581 not_detected, 233 uncertain, 186 detected)
- [x] 1.2 `src/home/tryCorpus.ts`: lazy loader, validator, partial Fisher-Yates draw, code-point truncation

## 2. Home
- [x] 2.1 Try row: five corpus chips, Shuffle, fallback samples
- [x] 2.2 Expectation indicator with lifecycle and verdict-token colors
- [x] 2.3 Catalog keys in six locales
- [x] 2.4 CSS: wrapping row, 24px targets, indicator colors

## 3. Tests and checks
- [x] 3.1 `tryCorpus.test.ts` and `HomeView.test.tsx` cases
- [x] 3.2 lint, test, build, `scripts/validate-openspec.sh`
