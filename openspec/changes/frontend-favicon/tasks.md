## 1. Assets
- [x] 1.1 `public/favicon.svg` and `scripts/favicon.py`; generate ICO and PNGs
- [x] 1.2 `public/site.webmanifest`
## 2. Wiring
- [x] 2.1 Icon links in `index.html` outside the og block
- [x] 2.2 nginx `.webmanifest` content type; smoke checks in `scripts/og-smoke.sh`
- [x] 2.3 README note
## 3. Tests and checks
- [x] 3.1 `nginx/favicon.test.ts`
- [x] 3.2 `npm run lint`, `npm test`, `npm run build`, `scripts/validate-openspec.sh`, container smoke of the favicon routes
