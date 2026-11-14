# Mock areas

Every UI area that is **not** connected to the backend is wrapped in `<Mock>` (`src/ui/MockBadge.tsx`): a dashed
outline in the `--mock` colour, a small uppercase `MOCK` badge and the tooltip "Mock data – not connected to the
backend". Real data is never wrapped in it. Each screen task appends its rows here.

| Route | Element | Why it is mock |
| --- | --- | --- |
| all (top bar) | Language selector "English ▾" | No language setting or i18n exists in the backend or the app |
