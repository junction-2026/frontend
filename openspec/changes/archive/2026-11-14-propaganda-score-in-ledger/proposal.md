## Why
The ledger shows only the propaganda_detection label; the model score is dropped (junction-2026/project#36).

## What Changes
- The settled propaganda_detection ledger row shows the score as confidence in the label.
- No shared contract change (shared-specs 3e3570c, analysis-job-events already carries `label` and `score`).
