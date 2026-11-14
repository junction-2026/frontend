## Decisions

- **Mock granularity**: each data block (filters, map card, stats, region panel, thread, suggestions, composer, tabs, language block) gets its own `Mock block`, so the dashed outline shows exactly what is fake. The States page is one `Mock` ("Example states") because the whole page is a static showcase.
- **Settings tabs / blocks**: the mock has tabs for Accessibility, Epistemic Framework and Data Retention but no bodies for them; they are ported as (marked) tabs only, no content is invented.
- **Analyzers block** is real and read-only: no toggle (there is no write endpoint), a status pill instead. Errors use `errorMessage()` (unknown codes show the envelope message).
- **Ask** keeps its draft and sent bubbles in component state; it never calls `fetch`. "Back to summary" links to `/history` because `/ask` carries no job id.
- **States links** are limited to `/`, `/history` and `/ask`; "View Available Verdict" goes to `/history`.
