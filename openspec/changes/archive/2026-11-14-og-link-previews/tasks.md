## 1. Renderer
- [x] 1.1 `nginx/og.js`: generic card, job card, escaping, truncation, head injection (njs-compatible)
- [x] 1.2 `nginx/og-handler.js`: index cache, subrequest with 2 s timeout, fallback to the plain SPA shell

## 2. Wiring
- [x] 2.1 `nginx/default.conf.template`: js_import/js_var, HTML locations, `/og/` cache header, `@plain`
- [x] 2.2 `Dockerfile`: `PUBLIC_ORIGIN`, load_module, copy njs files
- [x] 2.3 `index.html`: default card block with markers

## 3. Images
- [x] 3.1 `scripts/og-images.py` and `public/og/*.png`

## 4. Tests and docs
- [x] 4.1 `nginx/og.test.ts` (renderer cases, index.html defaults, PNG IHDR and size)
- [x] 4.2 `scripts/og-smoke.sh` and `scripts/og-stub-backend.mjs`
- [x] 4.3 README: PUBLIC_ORIGIN, behaviour, card types, smoke script
