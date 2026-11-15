# Mock areas

Every UI area that is **not** connected to the backend is wrapped in `<Mock>` (`src/ui/MockBadge.tsx`): a dashed
outline in the `--mock` colour, a small uppercase `MOCK` badge and the tooltip "Mock data – not connected to the
backend". Real data is never wrapped in it. Each screen task appends its rows here.

| Route | Element | Why it is mock |
| --- | --- | --- |
| /explore/region | Selected-region map (Finland), statistics and region details (articles, wire items) | No region or publisher data in the backend |
| /states | Whole page ("Example states") and the disabled "Retry Wire Retrieval" button | Static showcase; real states render on results, analyzing and history |
