## MODIFIED Requirements

### Requirement: Multi-stage Dockerfile
The Dockerfile SHALL be multi-stage: `node:22-alpine` runs `npm ci && npm run build`; `nginx:alpine` copies `dist/` to `/usr/share/nginx/html`, `nginx/default.conf.template` to `/etc/nginx/templates/default.conf.template` so the stock entrypoint substitutes `${BACKEND_URL}` and `${PUBLIC_ORIGIN}`, and `nginx/og.js` and `nginx/og-handler.js` to `/etc/nginx/njs/`. The image SHALL load `ngx_http_js_module.so` (shipped with nginx:alpine) in the main nginx context and SHALL set `ENV PUBLIC_ORIGIN=http://localhost`. The built `dist/` SHALL include `og/*.png` copied from `public/og/`.

#### Scenario: Image build
- **WHEN** `docker build .` runs
- **THEN** an nginx image containing the built bundle, the njs files and `/usr/share/nginx/html/og/*.png` is produced

#### Scenario: Module loaded
- **WHEN** the container starts
- **THEN** nginx starts with the njs module loaded and `/etc/nginx/conf.d/default.conf` rendered with the `BACKEND_URL` and `PUBLIC_ORIGIN` values

### Requirement: nginx behaviour
nginx SHALL listen on port 80 (`EXPOSE 80`). `location = /healthz` SHALL proxy to `${BACKEND_URL}/healthz` and `location /api/` SHALL proxy to `${BACKEND_URL}/api/`, each with `proxy_connect_timeout` and `proxy_read_timeout` of 5s. Static files SHALL be served as files. HTML routes (`location = /`, `location = /index.html` and the fallback of `location /` when no file matches, a `try_files $uri @spa` named location) SHALL be answered by an njs `js_content` handler that returns the built `index.html` with the link-preview card block inserted (capability link-preview-cards). `location /og/` SHALL serve the card images with `Cache-Control: public, max-age=86400`; HTML responses SHALL send `Cache-Control: no-cache`. The handler SHALL read `/usr/share/nginx/html/index.html` once per worker and cache it, and SHALL get a job via `r.subrequest('/api/v1/jobs/<id>')` through the `/api/` proxy. If the handler itself fails, the request SHALL be served the plain `index.html` by an internal `@plain` location. The image SHALL set `ENV BACKEND_URL=http://host.docker.internal:8080` as its default.

#### Scenario: Proxy at runtime
- **WHEN** the container runs with `-e BACKEND_URL=<backend>`
- **THEN** `GET /healthz` and `GET /api/v1/jobs/{id}` on port 80 are forwarded to the backend

#### Scenario: SPA shell with card
- **WHEN** `GET /history` or `GET /jobs/{id}` is requested with any User-Agent
- **THEN** the response is 200 `text/html`, `Cache-Control: no-cache`, with the same body and asset references as `dist/index.html` except for the replaced card block

#### Scenario: Assets unchanged
- **WHEN** `GET /assets/<hashed file>` is requested
- **THEN** the file is served as before and `GET /og/site.png` is `image/png` with `Cache-Control: public, max-age=86400`
