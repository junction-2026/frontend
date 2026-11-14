## Why
The product is renamed from "VEIL" to "Stiriri" (junction-2026/project#41, child #48). All user-visible copy and the persisted locale key must follow.

## What Changes
- Every user-visible "VEIL"/"Veil" becomes "Stiriri" (same casing in all locales, never translated): document title, top-bar brand, Ask screen, Results actions/verdict texts/tooltip, Settings copy, catalogs en, de, fr, fi, ar.
- localStorage key `veil.locale` becomes `stiriri.locale`; a valid legacy value is read once and migrated.
- Docs, CSS comment and tests updated. French "veille médiatique" (a common noun) is unchanged.
- No shared contract change: brand text is frontend-only UI copy.

## Impact
Specs: ui-design-foundation, i18n, secondary-screens, results-history-views. Archived changes stay untouched.
