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
The Dockerfile SHALL be multi-stage: `node:22-alpine` runs `npm ci && npm run build`; `nginx:alpine` copies `dist/` to `/usr/share/nginx/html` and `nginx/default.conf.template` to `/etc/nginx/templates/default.conf.template` so the stock entrypoint substitutes `${BACKEND_URL}`.

#### Scenario: Image build
- **WHEN** `docker build .` runs
- **THEN** an nginx image containing the built bundle is produced

### Requirement: nginx behaviour
nginx SHALL listen on port 80 (`EXPOSE 80`). `location = /healthz` SHALL proxy to `${BACKEND_URL}/healthz` and `location /api/` SHALL proxy to `${BACKEND_URL}/api/`, each with `proxy_connect_timeout` and `proxy_read_timeout` of 5s. `location /` SHALL serve static files with `try_files $uri /index.html`. The image SHALL set `ENV BACKEND_URL=http://host.docker.internal:8080` as its default.

#### Scenario: Proxy at runtime
- **WHEN** the container runs with `-e BACKEND_URL=<backend>`
- **THEN** `GET /healthz` and `GET /api/v1/jobs/{id}` on port 80 are forwarded to the backend

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
The README SHALL document the install, dev, build, test and lint commands, the BACKEND_URL defaults (dev `http://localhost:8080`; container `http://host.docker.internal:8080` with `--add-host=host.docker.internal:host-gateway` on Linux), container port 80, an example docker build/run, the same-origin proxy design (no backend CORS needed) including the WebSocket proxy for `/api/v1/jobs/{id}/events`, and the routes of the app.

#### Scenario: Reader finds the run instructions
- **WHEN** a developer opens the README
- **THEN** every item above is documented

### Requirement: Event stream proxy
nginx SHALL add `location ~ ^/api/v1/jobs/[^/]+/events$` that proxies the WebSocket to `${BACKEND_URL}` with `proxy_http_version 1.1`, `Upgrade` and `Connection: upgrade` headers and `proxy_read_timeout 120s`, while the other `/api/` routes keep their 5s timeouts.

#### Scenario: Event stream at runtime
- **WHEN** a WebSocket is opened to `/api/v1/jobs/{id}/events` on port 80
- **THEN** it is upgraded and stays open for up to 120 s without traffic
