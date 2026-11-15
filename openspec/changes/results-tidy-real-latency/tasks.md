## 1. Duration helper
- [x] 1.1 `duration(job, t, fmt)` in `src/job/text.ts`; meta row uses it
## 2. Results region
- [x] 2.1 Remove bias line, Polarity/Intensity row and Share button from `Detailed`
## 3. Metrics bar
- [x] 3.1 Real Latency (or "—") in `DetailedAnalysis`, no `Mock`
## 4. Cleanup
- [x] 4.1 Remove five i18n keys from six locales; remove unused CSS
- [x] 4.2 Update `docs/mock-areas.md`
## 5. Tests and checks
- [x] 5.1 ResultsView and Detail tests (absence of removed items, Latency cases, no Mock ancestor)
- [x] 5.2 `npm test`, lint, build, `scripts/validate-openspec.sh`
