## Why
Shared change `manipulation-risk-score` (shared-specs@3949bec3d32a399427d239e3147239fa1e716cfe, junction-2026/project#64) adds `Job.risk`, one transparent Manipulation Risk Score with band, dimensions, techniques, drivers and caveats. The Results screen (`/jobs/:id`) shows each analyzer separately and has nothing that combines them.

## What Changes
- New Risk Score section at the top of the Results screen, above the verdict card, rendered from `Job.risk`: percentage headline, band chip, summary, info tooltip, dimension bars, detected techniques, drivers and a collapsible caveats region.
- `RiskScore` types in `src/api/types.ts`; tolerant reader `src/job/risk.ts`; component `src/job/RiskScore.tsx` + `riskScore.css`; band colour tokens.
- `risk.*` keys in the `results` namespace for en, fr, ar, de, fi, ru.
- Jobs with `risk` null or missing show nothing new. Raw per-analyzer output below is unchanged.

## Impact
Frontend only; reads the shared capability, changes no shared contract. Built against fixtures (no backend dependency).
