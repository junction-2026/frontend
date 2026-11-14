## 1. Fonts, tokens, base CSS
- [x] 1.1 Add @fontsource packages; import in `src/styles/fonts.css`; no Google URLs (test)
- [x] 1.2 `src/styles/tokens.css` and `base.css` ported from `UI_DESIGN/css/styles.css`

## 2. Shell and routing
- [x] 2.1 `src/router.tsx` (routes, Link, legacy `?job=` redirect, scroll to top)
- [x] 2.2 `src/ui/Shell.tsx` (top bar, nav active state, health indicator, language selector MOCK)
- [x] 2.3 `src/ui/MockBadge.tsx` and `docs/mock-areas.md`
- [x] 2.4 Stub views `src/views/*View.tsx`; remove Hello World page

## 3. API clients
- [x] 3.1 `src/api/types.ts`, `client.ts`, `errors.ts`
- [x] 3.2 `src/api/events.ts`

## 4. Proxy and docs
- [x] 4.1 `vite.config.ts` `ws: true`; nginx events location
- [x] 4.2 README

## 5. Tests and validation
- [x] 5.1 Router, nav, health indicator, MockBadge, API client, events client, font test
- [x] 5.2 `npm run lint`, `npm test`, `npm run build`, `scripts/validate-openspec.sh`
