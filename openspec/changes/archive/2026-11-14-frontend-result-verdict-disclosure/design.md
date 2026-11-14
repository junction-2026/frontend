## Decisions

- **Own verdict copy.** Results has its own heading/body map keyed by `verdictOf(...)`; `VERDICT_UI` stays untouched so History labels and tones do not change.
- **State card vs. verdict.** A single `resultOf(job)` decides: a completed finalization with a result on a job that is not failed or cancelled renders the `<section data-verdict>`; everything else renders the existing neutral card (pill + h2 headline), never a verdict background or confidence.
- **Disclosure.** Local `useState` in the Results view; the region is mounted only when open (collapsed content is not rendered). The button keeps focus because it is never unmounted. Animations are CSS keyframes of 300 ms, switched off under `prefers-reduced-motion`.
- **Reuse.** `DetailedAnalysis` (metrics bar + JobView) is shared by `/jobs/:id/detail` and the Results region, so the Detail page renders as before.
- **Contrast.** Heading and body use `--ink` / `--ink-2` on the three pastel backgrounds (above 9:1).
- **Inter.** The heading uses `font-family: Inter, var(--font)`; no font package is added, so without a locally installed Inter the existing Plus Jakarta Sans is used.
- **Removed banner requirements.** The "Verdict banner colour" and "Verdict banner accessibility" requirements describe the banner this change replaces, so they are removed rather than left contradicting the new verdict component.
