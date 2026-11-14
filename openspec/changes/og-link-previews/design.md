## Decisions
- **Same index.html for every user agent.** No UA sniffing: the tags are injected for everyone, so crawlers and browsers get the same document.
- **njs limits (0.9.x in nginx:alpine).** njs supports only a default export/import, no `for...of`, no default parameters. `nginx/og.js` therefore exposes its functions on one `export default` object; vitest imports that object. The handler lives in `nginx/og-handler.js` (`import fs from 'fs'` is njs-only and must not load in vitest).
- **Subrequest through `/api/`.** `r.subrequest('/api/v1/jobs/<id>')` reuses the existing proxy location, so no `resolver` is needed. njs has no subrequest timeout option, so the handler races the request against a 2 s `setTimeout`.
- **Module loading.** The Dockerfile prepends `load_module modules/ngx_http_js_module.so;` to the stock `/etc/nginx/nginx.conf` (module is in the nginx:alpine image) instead of shipping a copy of that file.
- **Origin.** `PUBLIC_ORIGIN` reaches njs through `js_var $og_origin "${PUBLIC_ORIGIN}"`; the stock entrypoint envsubst renders the template. A trailing slash is stripped in `og.js`.
- **Shared-spec boundary.** Card rules are UI/runtime behaviour of this repository, so they live in the local capability `link-preview-cards`, not in shared specs. Crawlers see only fields of the existing Get job response (tolerant reader).
- **Images.** Generated with Pillow from the design tokens and the bundled Plus Jakarta Sans; generator committed. A test asserts size and dimensions.
