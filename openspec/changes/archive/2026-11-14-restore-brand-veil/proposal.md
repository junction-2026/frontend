## Why
The product name is restored from "Stiriri" to "VEIL" (junction-2026/project#44, child #54), re-implementing the pre-rename wording as a new forward change.

## What Changes
- Every user-visible "Stiriri" becomes "VEIL" (never translated): document title, top-bar brand, Ask screen, Results actions/verdict texts/tooltip, Settings copy, catalogs en, de, fr, fi, ar.
- localStorage key `stiriri.locale` becomes legacy; `veil.locale` is the key again, and a valid legacy value is migrated once.
- Docs, CSS comment and tests follow. French "veille médiatique" (a common noun) is unchanged.
- No shared contract change: brand text is frontend-only UI copy.

## Impact
Specs: ui-design-foundation, i18n, secondary-screens, results-history-views. Archived changes stay untouched. "Mock-only parts of the Results screen" already contains no brand name and needs no delta.
