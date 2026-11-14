## 1. Catalog (i18n)
- [x] 1.1 `locales/{en,fr,ar,de,fi}/techniques.ts`: name and definition for all 21 ids, `why_span` and `why_no_span` templates
- [x] 1.2 `results`/`analysis` keys: strength, machine-translated and unavailable labels, analyzer names, availability notes, activity titles and details

## 2. Client
- [x] 2.1 `getJobLocalization` and `JobLocalization`/`LocalizedText` types (tolerant)
- [x] 2.2 `src/job/localize.tsx`: need rule, per-(job, language) cache, provider, `useLocalizedText` with label, toggle and note

## 3. Views
- [x] 3.1 Technique name/definition/why from the catalog in JobView, Results tags, Detail; LLM group by label; strength badge
- [x] 3.2 Verdict and Detail `user_text` localized; LLM explanations localized; highlight why
- [x] 3.3 Original evidence in `bdi`/`dir=auto` (job text and title, quotes, anchors, excerpt, analyzing banner)
- [x] 3.4 Analyzer names, availability notes and activity titles/details from the catalog (Coverage, AnalyzingView)

## 4. Tests
- [x] 4.1 Catalog completeness; one French fixture in en, fr, ar, de, fi (names, no French leakage, bdi, verdict/confidence/strength equal)
- [x] 4.2 Language switch: one request per new language, no job refetch, open section kept
- [x] 4.3 Fallbacks: unknown id, unavailable, unknown status, 409/400/network error, result without plain_language
- [x] 4.4 Update existing tests for catalog names, notes and bdi
