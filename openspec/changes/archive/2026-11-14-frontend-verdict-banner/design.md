## Decisions

- The banner is a `div.verdict-banner.<red|orange|green>` wrapping the card's `<h2>`; colours come from existing tokens `--danger`, `--orange`, `--green` (white text: 5.4:1, 4.5:1, 4.5:1). Label font size is at least 28px and bold. No glyph is added, so nothing needs `aria-hidden`.
- `VERDICT_UI` is untouched (History keeps its tone map); the banner colour is a small local map in `Verdict.tsx`.
- Non-verdict cards keep `status-pill` and the headline; they render no banner, so the card background stays neutral.
- The Detail "Final assessment" section is rendered by `DetailView` from `job.finalization`, using the same `VERDICT_UI` label and `verdictOf` fallback.
