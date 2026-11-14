## MODIFIED Requirements

### Requirement: Dev and preview proxy
`vite.config.ts` SHALL set `server.proxy['/healthz']` and `server.proxy['/api']`, each `{target: process.env.BACKEND_URL ?? 'http://localhost:8080', changeOrigin: true}`, and the same proxy SHALL apply to `vite preview`.

#### Scenario: Default target
- **WHEN** `BACKEND_URL` is unset
- **THEN** `/healthz` and `/api` are proxied to `http://localhost:8080`

### Requirement: nginx behaviour
nginx SHALL listen on port 80 (`EXPOSE 80`). `location = /healthz` SHALL proxy to `${BACKEND_URL}/healthz` and `location /api/` SHALL proxy to `${BACKEND_URL}/api/`, each with `proxy_connect_timeout` and `proxy_read_timeout` of 5s. `location /` SHALL serve static files with `try_files $uri /index.html`. The image SHALL set `ENV BACKEND_URL=http://host.docker.internal:8080` as its default.

#### Scenario: Proxy at runtime
- **WHEN** the container runs with `-e BACKEND_URL=<backend>`
- **THEN** `GET /healthz` and `GET /api/v1/jobs/{id}` on port 80 are forwarded to the backend
