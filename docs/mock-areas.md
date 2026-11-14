# Mock areas

Every UI area that is **not** connected to the backend is wrapped in `<Mock>` (`src/ui/MockBadge.tsx`): a dashed
outline in the `--mock` colour, a small uppercase `MOCK` badge and the tooltip "Mock data – not connected to the
backend". Real data is never wrapped in it. Each screen task appends its rows here.

| Route | Element | Why it is mock |
| --- | --- | --- |
| all (top bar) | Language selector "English ▾" | No language setting or i18n exists in the backend or the app |
| /explore | Filters (search, regions, languages, publishers, verified chip) | No exploration or coverage data in the backend |
| /explore | Coverage map card (publisher counts, zoom controls, tooltip, legend) | No geographic coverage data in the backend |
| /explore/region | Selected-region map, statistics and region details (articles, wire items) | No region or publisher data in the backend |
| /ask | Context bar, thread with canned answers, suggestions, composer ("No backend for Ask VEIL") | No Ask endpoint; sending only appends a local bubble and sends no request |
| /states | Whole page ("Example states") and the disabled "Retry Wire Retrieval" button | Static showcase; real states render on results, analyzing and history |
| /settings | Tabs and the "Interface & analysis language" block with its toggles | No user settings or i18n in the backend; toggles are non-functional |
