## Context

Foundation exports `createJob`, `getJob`, `cancelJob`, `listAnalyzers` (never throw), `errorMessage`, `subscribeJobEvents` (seq dedupe, 3 reconnects, `onGiveUp`), `navigate`, `Link` and `Mock`.

## Decisions

- **State is a pure reducer** (`src/analyze/state.ts`): `applyEvent(state, event)` ignores any non-snapshot event whose `seq` is not greater than the last applied one (so a late, lower-`seq` Progress never moves the bar back) and treats `job.snapshot` as a full reset (it carries `job`, `plan`, `progress`, `previews`, `activities`). A hook (`useJobStream`) wires it to `subscribeJobEvents`, so the view stays presentational and the reducer is unit-tested without a socket.
- **Polling fallback reuses the reducer**: after `onGiveUp`, `getJob` every 2000 ms; each result is applied as a synthetic `job.snapshot` (without plan, so the ledger falls back to the job's analyzers) until `done`.
- **Ledger rows come from the plan**; the finalizer row is the plan entry with `activity_key: "finalizer"` and follows `finalization` (updated by `analysis.finalizing/finalized/finalization_failed`). Analyzers outside the plan (hidden, not selected) are never shown.
- **Replace navigation**: the router has no `replace`; the view calls `history.replaceState` and dispatches `popstate`, which the router already listens to. The router file stays untouched.
- **Mock vs. real**: copy that has no backend counterpart (language chip, feature cards, cluster, zero-retention, ledger caption) is wrapped in `Mock`; "worker load" and "~remaining" are removed.
- **Plain text only**: content, activity text/detail, notes, error messages are rendered as React text children (no `dangerouslySetInnerHTML`).
