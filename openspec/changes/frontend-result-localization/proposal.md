## Why
A French analysis viewed with the UI in Arabic (or any other language) shows French technique names, definitions and
explanations next to localized chrome (junction-2026/project#45, child junction-2026/frontend#58). The backend
glossary follows the content language and has no Arabic, and model-written texts (finalizer `user_text`, LLM
explanations) stay in the content language. This change is the client side of shared change `job-text-localization`
(shared-specs @ 07b1fce6c316aa2ddf926ffab423dd721fb5b9b4): technique localization by stable id and the
`GET /api/v1/jobs/{id}/localization` client.

## What Changes
- New `techniques` catalog namespace (en, fr, ar, de, fi): name and definition of every technique id (18 classifier names, 3 LLM labels) and the two `why` templates; wording of en/fi/de/fr follows the backend glossary, Arabic is Modern Standard Arabic.
- Technique name, definition and `why` come from that catalog when the UI language differs from the result's `explanation_language`; otherwise `plain_language` is used, and so for an id the catalog lacks (with a development `console.warn`).
- `getJobLocalization(id, language)` and tolerant types; a per-(job, language) in-memory cache; requests only for done jobs whose text language differs from the UI language; a language switch never refetches the job or reopens the stream.
- Translated texts render as plain text with a "Machine-translated from {language}" label and a toggle to the original; unavailable, unknown-status and failed requests show the original with a localized "not available" note.
- Original evidence (content, span text, quotes, anchors, submitted text) is isolated with `<bdi dir="auto">` / `dir="auto"`.
- Detection strength, analyzer names, availability notes (by reason) and activity titles/details (by key and params) come from the catalogs instead of API strings.
- No shared contract change: the frontend only consumes `job-text-localization` and the ADDED technique-classifier-result requirement "Client localization of glossary texts".

## Impact
Specs: i18n, job-result-view, backend-api-client, analyze-flow-ui. Code: `src/job/*`, `src/views/{Results,Detail,Analyzing}View.tsx`, `src/api/{client,types}.ts`, `src/i18n/locales/*/{techniques,results,analysis}.ts`.
The Wikipedia lookup section and its strings belong to junction-2026/project#47 and are not touched. Hand-off to
`frontend-i18n-audit-rtl` (other views, RTL audit) is by file: this change does not touch `src/analyze/state.ts`.
