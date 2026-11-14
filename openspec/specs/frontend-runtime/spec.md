# frontend-runtime Specification

## Purpose
Defines how the frontend is run and shipped: the same-origin `/healthz` proxy in development and in the nginx container image, test and lint tooling, and the README.

## Requirements

### Requirement: Dev and preview proxy
`vite.config.ts` SHALL set `server.proxy['/healthz']` and `server.proxy['/api']`, each `{target: process.env.BACKEND_URL ?? 'http://localhost:8080', changeOrigin: true}`, with `ws: true` on `/api` so that WebSocket upgrades are proxied, and the same proxy SHALL apply to `vite preview`.

#### Scenario: Default target
- **WHEN** `BACKEND_URL` is unset
- **THEN** `/healthz` and `/api` are proxied to `http://localhost:8080`

#### Scenario: WebSocket through the dev server
- **WHEN** a browser opens `ws://localhost:5173/api/v1/jobs/{id}/events`
- **THEN** the connection is proxied to the backend

### Requirement: Multi-stage Dockerfile
The Dockerfile SHALL be multi-stage: `node:22-alpine` runs `npm ci && npm run build`; `nginx:alpine` copies `dist/` (which includes `og/*.png` from `public/og/`) to `/usr/share/nginx/html`, `nginx/default.conf.template` to `/etc/nginx/templates/default.conf.template` so the stock entrypoint substitutes `${BACKEND_URL}` and `${PUBLIC_ORIGIN}`, and the njs files to `/etc/nginx/njs/`.

#### Scenario: Image build
- **WHEN** `docker build .` runs
- **THEN** an nginx image containing the built bundle, the njs files and `/usr/share/nginx/html/og/*.png` is produced

### Requirement: nginx behaviour
nginx SHALL listen on port 80 (`EXPOSE 80`). `location = /healthz` SHALL proxy to `${BACKEND_URL}/healthz` and `location /api/` SHALL proxy to `${BACKEND_URL}/api/`, each with `proxy_connect_timeout` and `proxy_read_timeout` of 5s. Static files SHALL be served as files; every other HTML route SHALL be answered by the njs head injection (requirement "HTML head injection"). The image SHALL set `ENV BACKEND_URL=http://host.docker.internal:8080` as its default.

#### Scenario: Proxy at runtime
- **WHEN** the container runs with `-e BACKEND_URL=<backend>`
- **THEN** `GET /healthz` and `GET /api/v1/jobs/{id}` on port 80 are forwarded to the backend

#### Scenario: Assets unchanged
- **WHEN** `GET /assets/<hashed file>` is requested
- **THEN** the file is served as before

### Requirement: Docker ignore
`.dockerignore` SHALL exclude node_modules, dist, coverage, .git and .env.

#### Scenario: Context excludes build output
- **WHEN** the image is built
- **THEN** the listed paths are not sent in the build context

### Requirement: Test and lint tooling
`npm test` SHALL run `vitest run` (jsdom and @testing-library/react) and exit non-zero on failure. Tests SHALL mock fetch and cover the health indicator for success, HTTP 503, network TypeError, body `{"status":"down"}`, non-JSON body, timeout (fake timers) and pending. `npm run lint` SHALL run ESLint (typescript-eslint and react-hooks) with zero errors. `npm run build` SHALL run `tsc -b && vite build`.

#### Scenario: Commands succeed
- **WHEN** lint, test and build are run on a clean install
- **THEN** each exits 0

### Requirement: README documentation
The README SHALL document the install, dev, build, test and lint commands, the BACKEND_URL defaults (dev `http://localhost:8080`; container `http://host.docker.internal:8080` with `--add-host=host.docker.internal:host-gateway` on Linux), container port 80, an example docker build/run that sets `-e PUBLIC_ORIGIN=...` with a comment, the same-origin proxy design (no backend CORS needed) including the WebSocket proxy for `/api/v1/jobs/{id}/events`, and the routes of the app.

#### Scenario: Reader finds the run instructions
- **WHEN** a developer opens the README
- **THEN** every item above is documented

### Requirement: Event stream proxy
nginx SHALL add `location ~ ^/api/v1/jobs/[^/]+/events$` that proxies the WebSocket to `${BACKEND_URL}` with `proxy_http_version 1.1`, `Upgrade` and `Connection: upgrade` headers and `proxy_read_timeout 120s`, while the other `/api/` routes keep their 5s timeouts.

#### Scenario: Event stream at runtime
- **WHEN** a WebSocket is opened to `/api/v1/jobs/{id}/events` on port 80
- **THEN** it is upgraded and stays open for up to 120 s without traffic

### Requirement: njs module and public origin
The image SHALL load `ngx_http_js_module.so` (shipped with nginx:alpine) in the main nginx context and SHALL set `ENV PUBLIC_ORIGIN=http://localhost`, a default for local development only; the Dockerfile comment SHALL say so and that the startup check warns about it. The template SHALL pass the origin to njs with `js_var $og_origin "${PUBLIC_ORIGIN}"`.

#### Scenario: Module loaded
- **WHEN** the container starts with `-e PUBLIC_ORIGIN=https://veil.example`
- **THEN** nginx starts with the njs module loaded and cards use `https://veil.example`

#### Scenario: Default origin
- **WHEN** the container starts without `PUBLIC_ORIGIN`
- **THEN** nginx starts with the default `http://localhost` and the log contains the `WARNING: PUBLIC_ORIGIN` line

### Requirement: HTML head injection
`location = /`, `location = /index.html` and the fallback of `location /` (`try_files $uri @spa`) SHALL be answered by an njs `js_content` handler that returns the built `index.html` with the link-preview card block inserted (capability link-preview-cards), as 200 `text/html` with `Cache-Control: no-cache`. If the handler fails, an internal `@plain` location SHALL serve the plain `index.html`. `location /og/` SHALL send `Cache-Control: public, max-age=86400`.

#### Scenario: SPA shell with card
- **WHEN** `GET /history` or `GET /jobs/{id}` is requested with any User-Agent
- **THEN** the response is 200 `text/html` with `Cache-Control: no-cache` and the same body and asset references as `dist/index.html` except for the replaced card block

#### Scenario: Card image
- **WHEN** `GET /og/site.png` is requested
- **THEN** the response is `image/png` with `Cache-Control: public, max-age=86400`

### Requirement: Handler data sources
The head-injection handler SHALL read `/usr/share/nginx/html/index.html` once per worker and cache it, and SHALL get a job via `r.subrequest('/api/v1/jobs/<id>')` through the `/api/` proxy, so no `resolver` is needed. The server block SHALL set `subrequest_output_buffer_size 32m` (the default, one memory page, is smaller than a real Get job; an oversized subrequest response is an nginx error that closes the request without an HTML body and that the handler cannot catch).

#### Scenario: Job lookup
- **WHEN** `GET /jobs/{id}` is requested
- **THEN** the backend receives one `GET /api/v1/jobs/{id}` through the `/api/` location

#### Scenario: Large job
- **WHEN** the job response is larger than 64 KB (for example 5 MB with a long `input.content` and analyzer results)
- **THEN** the response is 200 with the SPA shell and the job's verdict card

### Requirement: Public origin startup check
The image SHALL contain `/docker-entrypoint.d/40-check-public-origin.sh` (mode 0755, POSIX sh, copied from `docker/40-check-public-origin.sh`), so that the stock nginx:alpine entrypoint runs it before nginx starts. The script SHALL exit 0 in all cases, SHALL NOT change `PUBLIC_ORIGIN` or the rendered template, and SHALL print nothing when the value is accepted.

#### Scenario: Default origin warns
- **WHEN** the container starts without `PUBLIC_ORIGIN` (image default `http://localhost`)
- **THEN** `docker logs` contains one line starting with `WARNING: PUBLIC_ORIGIN="http://localhost"` and nginx serves `/` with 200

#### Scenario: Valid origins are silent
- **WHEN** `PUBLIC_ORIGIN` is `https://veil.example`, `https://veil.example/` or `http://veil.example:8443`
- **THEN** the script prints nothing and exits 0

### Requirement: Public origin acceptance
The startup check SHALL accept `PUBLIC_ORIGIN` only when, after one optional trailing `/` is stripped, it matches `^https?://([^[:space:]/?#@:[]+|\[[^][:space:]/?#@]+\])(:[0-9]+)?$` (scheme http or https, a non-empty host or bracketed IPv6 literal, optional all-digit `:port`, no path, query, fragment or userinfo) and its host is not `localhost`, `127.0.0.1`, `[::1]` or `0.0.0.0` (case-insensitive).

#### Scenario: Invalid origins warn
- **WHEN** `PUBLIC_ORIGIN` is unset, empty, `localhost:8080`, `ftp://veil.example`, `https://veil.example/app`, `https://veil.example?x=1`, `http://:8080`, `https://veil.example:abc`, `http://LOCALHOST:8080`, `http://127.0.0.1:8081` or `http://[::1]`
- **THEN** the script prints the WARNING line to stderr and exits 0

#### Scenario: Test coverage of the script
- **WHEN** `npm test` runs `nginx/public-origin-check.test.ts`
- **THEN** it runs `sh docker/40-check-public-origin.sh` with each value above and asserts exit code 0 and whether the warning is on stderr

### Requirement: Public origin warning
When `PUBLIC_ORIGIN` is unset, empty or not accepted, the startup check SHALL print to stderr exactly one line starting with `WARNING: PUBLIC_ORIGIN="<value>"`. The line SHALL say that og:url and og:image use this value and that crawlers (Discord, Slack, Twitter) cannot fetch the preview images, and SHALL tell the operator to set `PUBLIC_ORIGIN` to the public `scheme://host[:port]`.

#### Scenario: Warning content
- **WHEN** `PUBLIC_ORIGIN` is `http://localhost`
- **THEN** stderr has one line naming the value, saying crawlers cannot fetch the preview images and naming `scheme://host[:port]`

### Requirement: Link-preview smoke test
`scripts/og-smoke.sh` SHALL collect every og:image and twitter:image content URL from the responses it checks. For each distinct URL it SHALL assert the `$ORIGIN/` prefix, fetch it with the prefix rewritten to `http://127.0.0.1:$PORT/`, and assert 200 and `Content-Type: image/png`; a failure prints `FAIL og:image <url>` and sets fail=1.

#### Scenario: Images fetched
- **WHEN** `scripts/og-smoke.sh` runs with `ORIGIN=https://veil.example`
- **THEN** every og:image and twitter:image URL starts with `https://veil.example/` and its local counterpart returns 200 `image/png`

### Requirement: Smoke test startup warning
`scripts/og-smoke.sh` SHALL start a second container from the same image with no `PUBLIC_ORIGIN`, wait until it answers `/`, and assert its `docker logs` contain `WARNING: PUBLIC_ORIGIN` and the main container's logs do not. Both containers SHALL be removed by the existing cleanup trap.

#### Scenario: Warning only with a bad origin
- **WHEN** the second container runs without `PUBLIC_ORIGIN`
- **THEN** its logs contain `WARNING: PUBLIC_ORIGIN` and the main container's logs do not

### Requirement: README public origin documentation
The README "Link previews" section SHALL state that `PUBLIC_ORIGIN` is required in production as `scheme://host[:port]` without a path, and why: crawlers fetch og:image and og:url from it. It SHALL show the startup WARNING text and a `curl -s -A Discordbot` check of og:image. Examples SHALL use the placeholder `https://veil.example`.

#### Scenario: Operator verifies a deployment
- **WHEN** an operator follows the README check against a fresh job id
- **THEN** og:image is on the public origin and fetching it returns 200 `image/png`

### Requirement: Chat proxy
nginx SHALL add `location ~ ^/api/v1/jobs/[^/]+/chat$` before `location /api/` that proxies to `${BACKEND_URL}` like `/api/` with `proxy_read_timeout 120s` and `proxy_send_timeout 120s`, while every other location keeps its configuration.

#### Scenario: Slow chat answer
- **WHEN** the backend answers `POST /api/v1/jobs/{id}/chat` after 70 seconds
- **THEN** nginx forwards the 200 response and the other `/api/` routes keep their 5s timeouts
