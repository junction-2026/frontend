## 1. Implementation

- [x] 1.1 Add `ask.focus.select_all` to the en, de, fr, fi, ru, ar `ask` catalogs
- [x] 1.2 Render the Select all checkbox in `ResultPane` (checked / indeterminate / disabled / absent rules)
- [x] 1.3 Default the selection once per `JobChat` mount and add the select-all action
- [x] 1.4 Style the control with existing tokens, `:focus-visible` ring, wrapping header

## 2. Tests

- [x] 2.1 Update tests that assumed an empty initial selection
- [x] 2.2 Add tests: default (N <= 20 and > 20), deselect all, select all from partial and empty, 409 disabled, absent, default applied once, ar label

## 3. Validation

- [x] 3.1 `npm test`, `npx tsc -b`, `npm run lint`, `scripts/validate-openspec.sh`
