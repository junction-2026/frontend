## Decisions
- The filters are read once from `location.search` when History mounts (invalid status/language ignored) and written back with `history.replaceState`, so a filter change adds no history entry and reload restores it.
- Paging reset needs no new code: `useHistory` is keyed by (status, q, language), so a change drops the loaded pages, ignores late answers and "Load more" sends the same three values.
- Language names come from `Intl.DisplayNames` in the UI locale (`formatLanguageName`, next to `formatCountryName`); a code without a name is shown as the code.
- The control is a native `<select>` inside a visible `<label>`, so it is keyboard operable like other selects.
- The CSV `language` column is appended last so existing column positions stay the same; the raw code (or empty) is exported.
- A language filter that yields nothing shows `history.empty.language` with a "Clear filters" button; a search keeps `history.empty.search` and also gets the button. Errors use the existing alert.
