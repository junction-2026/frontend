## Why
The `term_context` analyzer (shared change `term-context`, junction-2026/project#49) returns, per loaded or unfamiliar term, the post sentence, a verbatim Wikipedia lead quote and verbatim news snippets. The job view must show them without adding model text or a verdict.

## What Changes
- New "Term context" section in the job view after the Wikipedia lookup section: one card per TermContext (term, post sentence, encyclopedia quote with link or a no-coverage note, elsewhere snippets with links, neutral sense label, marked differing quotes).
- Tolerant reader `readTermContext` in `src/job/read.ts`; component `src/job/TermContext.tsx`; styles in `job.css` with existing tokens only.
- `results.term.*` labels in every UI locale (en, de, fr, fi, ru, ar).
- No shared contract change; built against shared-specs@5bd40738633bfa21b0e371a364003408af42e773 (`term-context`, capability `term-context-result`, analysis-jobs-api "Wikipedia quotes for clients").

## Impact
Specs: job-result-view (modifies "Wikipedia lookup section", adds Term context requirements). Code: src/job, src/i18n/locales.
