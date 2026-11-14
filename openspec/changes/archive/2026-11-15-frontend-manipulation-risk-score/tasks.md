## 1. Types and reader
- [x] 1.1 `RiskScore` types in `src/api/types.ts`; `src/job/risk.ts` tolerant reader + tests
## 2. Section
- [x] 2.1 `RiskScore.tsx` + `riskScore.css` + band tokens; placed above the verdict in `ResultsView`
## 3. i18n
- [x] 3.1 `risk.*` keys in the results namespace for en, fr, ar, de, fi, ru
## 4. Tests
- [x] 4.1 Component tests: scored (3 dimensions), without amplification, dampened, unavailable, risk null, unknown band/caveat, tooltip keyboard access, caveat collapse, locale tooltip wording, token contrast
## 5. Checks
- [x] 5.1 `npm test`, `npm run lint`, `npx tsc -b`, `scripts/validate-openspec.sh`
