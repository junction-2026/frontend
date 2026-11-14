## Decisions
- **Two namespaces.** `analysis` holds the live screen and the ledger; `results` holds Results, Detail, States and the shared job components. Both are discovered by file name (foundation catalog discovery), so no registry edit.
- **Enum labels** go through `enumLabel(t, prefix, value)` (`src/job/text.ts`): a catalog key `<prefix>.<value>` exists in `en` → `t(...)`, otherwise the raw value. Verdict keeps its existing rule that an unknown verdict reads as uncertain (`verdictOf`).
- **Counts use two placeholders.** `{count}` only selects the plural form (foundation), `{n}` is the same number already formatted with `formatNumber`, so a locale never prints raw digits.
- **Units live in the catalog** (`time.s` = `{v}s` in en, `{v} s` in de/fr/fi), the number inside is formatted by `formatNumber`.
- **Percent** is `formatNumber(ratio, {style:'percent'})` after rounding to whole percent, so `fr` prints "86 %" with a non-breaking space.
- **`ledgerRows`/`previewSummary`** (non-React) read the active locale through `tActive` and `formatNumber`; `AnalyzingView` re-renders on a locale change through `useT`, so the labels follow the language.
- **Errors stay raw in state** (cancel error) and `errorMessage` runs at render, so a language switch re-translates them.
- **`VERDICT_UI.label` stays** in `src/job/read.ts` because History reads it; the History child migrates it. Results and Detail use the `results.verdict.label.*` keys.
- **RTL.** `border-left`/`padding-left`/`text-align:left` become logical properties; the confidence tooltip centering flips under `[dir=rtl]`. Arrow glyphs inside strings are written per locale (the Arabic strings put the arrow on the side an RTL reader expects).
