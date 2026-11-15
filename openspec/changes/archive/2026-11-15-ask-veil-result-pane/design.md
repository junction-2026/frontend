## Context
`focusItemsOf` stays the single source of keys (`kind:ref`), labels, order and the 20 limit. The result components render from filtered views of the raw job arrays (risk drivers, Wikipedia claims, term context), so refs must be computed from the raw arrays.

## Decisions
- **Context, not props.** `src/job/focusSelection.tsx` holds an optional React context (`entries` by key, selected set, `full`, `disabled`, `toggle`). `useFocusPick()` returns `pick(kind, ref)` giving `{ selected, button }` or `null` (no provider, or key not in `focusItemsOf` output, e.g. blank label). Result components call `pick` and place `button` in their section; with no provider nothing changes in their DOM.
- **Raw indexes.** `readRisk` drivers carry their raw `index`; Wikipedia claims and term-context entries use their position in the raw arrays (`indexOf` on the object read from the raw array).
- **Collapsed lists.** Risk drivers and caveats sit behind a disclosure; inside the selection context it starts open so their toggles are visible. Passages get a list under each technique in the technique list (only inside the context).
- **`ResultDetail`** is the former `Detailed` of `ResultsView`; the Ask pane renders `Verdict` + `ResultDetail` inside a `LocalizationProvider`.
- **Layout.** Two grid columns at 960px; each column is sticky with `max-block-size: 100dvh` and its own overflow, so the composer stays reachable. Logical properties only.

## Risks
Duplicate refs (equal kind and ref) get one toggle, the first occurrence, as the server treats them as one element.
