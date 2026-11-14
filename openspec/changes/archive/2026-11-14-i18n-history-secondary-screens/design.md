## Decisions
- Catalog keys are namespaced `history.*`, `explore.*` (also Region and the world map), `ask.*`, `settings.*`; the foundation discovers the files, no registry edit.
- `dayLabel(iso, now, locale, t)` and `relativeTime(iso, now, locale, t)` stay pure: locale and translator are arguments, views pass `useLocale()` / `useT()`.
- Counts use plural keys (`_one`/`_other`, Arabic also `_two`/`_few`) selected by the foundation's `Intl.PluralRules`.
- Verdict tag labels are `history.verdict.*` so the results capability's `VERDICT_UI` stays untouched (owned by another change).
- API error messages are stored as the error object and mapped by `errorMessage` at render, so they follow a language switch.
- Directional arrows in catalog text are written per locale (Arabic uses ←); no CSS mirroring of text.
