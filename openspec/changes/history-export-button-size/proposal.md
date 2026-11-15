## Why
The History toolbar is a flex row with default `align-items: stretch`, so the Export CSV button stretches to the title+lede height and its pill radius renders an oval.

## What Changes
- Scope `align-self: flex-start` to `.toolbar > .btn-secondary` in `src/history/history.css`.
- Add a regression test. No shared contract change; global `.btn-secondary` untouched.
