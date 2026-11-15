## Why
The Manipulation Risk Score card mixes type sizes and weights and uses three layouts for dimension, note and technique rows. An unavailable dimension is a long wrapped sentence repeating the dimension name, technique values sit far from their names, Main drivers repeats the summary, and the Caveats toggle is styled differently from the headings. Parent: junction-2026/project#74.

## What Changes
- One four-style type scale and one spacing rhythm for the card.
- Dimension cells share one grid in every state; an unavailable dimension shows `n/a`, an empty track and a short one-line reason (the full sentence stays for screen readers).
- Technique rows become a name | percentage | impact-badge grid with dividers and a bounded width.
- Main drivers becomes a collapsed disclosure styled like Caveats; all drivers stay reachable. Show all / Show less remains for techniques only.
- New catalog keys `risk.na`, `risk.reason_short.*`, `risk.drivers_count` in en, fr, ar, de, fi, ru.

## Impact
Frontend only (`src/job/RiskScore.tsx`, `riskScore.css`, tests, `risk.*` catalog keys). No shared-spec, API or backend change; the scoring, `Job.risk` payload and the metrics-bar `RiskMetric` chip are unchanged. Shared spec pin: shared-specs@e636db08c0f3ef36a48d3faf96829b05d9e7c1a8 (no change).
