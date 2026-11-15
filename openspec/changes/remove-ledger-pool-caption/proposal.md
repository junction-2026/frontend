## Why
The "Synchronous consensus pool" caption in the analysis ledger header is a mock element with no backend counterpart.

## What Changes
- Remove the caption (and its Mock wrapper, i18n keys `pool`/`mock.pool`, CSS rule) from the ledger header.
- Remove its row from `docs/mock-areas.md`.

## Impact
Frontend only; no shared contract change.
