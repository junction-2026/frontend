## Why
The job result view shows nothing of the `wikipedia` analyzer. Shared change `wikipedia-cross-language` (junction-2026/project#47, shared-specs@5981c9fdec37dc8664689f5ff2595ae797da618a, capability `wikipedia-lookup-result`) lets a reader compare what two language editions of Wikipedia say about a claim. This is the client side (child issue junction-2026/frontend#82).

## What Changes
- New read-only "Wikipedia lookup" section at the end of the job view (`src/job/WikipediaLookup.tsx`): per claim, each WikiLookup's passage verbatim and separate, with language, title, link, coverage label, and the `cross_language` state (agree, discrepancy with quoted differing values, gap).
- Types `WikipediaLookup`, `ClaimLookup`, `WikiLookup`, `CrossLanguageDifference`, `CompareValue` in `src/api/types.ts`.
- `results.wiki.*` catalog keys in en, de, fr, fi, ar.
- Component tests.
- No shared contract change: the pinned shared change is consumed as is.

## Impact
Specs: job-result-view, backend-api-client (ADDED requirements only). Files: `src/job/JobView.tsx`, `src/job/job.css`, `src/api/types.ts`, `src/i18n/locales/*/results.ts`.
