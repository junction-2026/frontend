## Why
The Results verdict card is redesigned to the premium VEIL reference (junction-2026/project#54, child frontend#76): a status pill, a compact confidence, one large headline, a one-sentence summary and up to three info cards, with the full `user_text` behind a "Read full explanation" disclosure.

## What Changes
- Verdict card layout: header row (pill at inline-start, confidence at inline-end), h2 headline, one summary sentence, 0-3 info cards, optional "Read full explanation".
- Copy: uncertain headline becomes "The result is inconclusive."; each verdict gets a pill text (uppercased by CSS); "Show full explanation" and the 280-code-point truncation are replaced by the first-sentence summary and "Read full explanation".
- New derivations from existing API members only: `src/job/summary.ts`, `src/job/verdictCards.ts` (top technique, evidence passages, fact-check / technique count).
- Tokens: new verdict border/heading/text/pill tokens, `--radius-verdict` 30px, contrast checked by a unit test.
- Actions restyled (black pill / white pill); behaviour unchanged.
- Frontend only: no shared contract change, no API change. Builds on the localized `user_text` and technique name catalog of project#45.

## Impact
Specs: results-history-views (Verdict card, Verdict component presentation, Verdict states, Verdict explanation, Initial actions; new Verdict summary, Verdict info cards), ui-design-foundation (new Verdict tokens). Code: src/job/Verdict.tsx, results.css, summary.ts, verdictCards.ts, tokens.css, results catalogs (en, fi, de, fr, ar), tests.
