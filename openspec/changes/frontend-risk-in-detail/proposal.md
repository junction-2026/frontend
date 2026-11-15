## Why
The Manipulation Risk Score card sits above the verdict on `/jobs/:id` and pushes the verdict down. The score is detail-level evidence: it belongs in the detailed analysis, with the percentage and band in the metrics bar in place of the Mock Risk cell. Parent: junction-2026/project#70.

## What Changes
- The Results stack no longer renders a risk section; the verdict card is its first item.
- The shared `DetailedAnalysis` metrics bar shows the real risk (percentage + band chip, or `—`) in the Risk cell, no longer wrapped in `Mock`.
- A compact risk overview (summary, info tooltip, slim dimension meters, detected techniques, drivers, caveats) is rendered by the shared JobView body directly after the "Propaganda Techniques Detected" card and before the LLM-assessed group, on `/jobs/:id/detail` and in the detailed region of `/jobs/:id`.
- Technique and driver lists show 3 entries with a "Show all (N)" toggle; caveats are collapsed by default.
- New `results.risk.show_all` / `results.risk.show_less` keys in en, fr, ar, de, fi, ru; unused `results.metrics.high_risk` removed.

## Impact
Frontend only. Reads `Job.risk` per shared capability `manipulation-risk-score` (shared-specs@18e157ddd9d020aeb9af984d337bf47f5c970659); no shared contract change.
