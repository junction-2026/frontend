## Decisions
- Reader and rendering follow `WikipediaLookup`: null while pending or running, `undefined` (shown as "No term context available") when the run is missing, skipped, failed or lacks a `terms` array; terms without a string `term` are dropped.
- A non-object `encyclopedia` (or an object without a `quote`) reads as no_coverage; an unknown `sense` reads as `unknown`; `differs_from` entries that do not resolve to a shown quote are ignored.
- All quote text sits in `dir="auto"` elements (`<p dir="auto">` or `<bdi dir="auto">`) and is never parsed as HTML or Markdown. Encyclopedia links reuse `wikiHref` (https, `*.wikipedia.org`); news links accept `http` and `https` only.
- Differing quotes carry a `data-differs` attribute and a visible marker inside the same card, so they are reachable without leaving it. Sense labels name only the relation between the quotes.
- The final assessment is untouched: it still shows only `wikipedia_quotes` as Wikipedia quotations.
