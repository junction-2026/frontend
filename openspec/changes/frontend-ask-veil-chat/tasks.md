## 1. API
- [x] 1.1 `ChatMessage`/`ChatReply`/`ChatRequest` types, `postJobChat` with 125 s timeout, new codes in `errors.ts`
## 2. UI
- [x] 2.1 Route `/jobs/:id/ask`, legacy `/ask` pick state, `navFor('ask')` stays `analyze`
- [x] 2.2 `src/ask/*` chat (context bar, thread, composer, suggestions, errors, history) and `AskView`
- [x] 2.3 Ask VEIL links on Results and States
## 3. Runtime, copy, docs
- [x] 3.1 nginx chat location
- [x] 3.2 `ask` catalogs for en, de, fr, fi, ar, ru
- [x] 3.3 `docs/mock-areas.md`
## 4. Tests
- [x] 4.1 router, client, AskView (success, follow-up, 409, 503 + retry, 429, timeout, plain text, running/failed jobs), link hrefs, locales DOM
- [x] 4.2 `npm test`, `npm run lint`, `npm run build`, `scripts/validate-openspec.sh`
