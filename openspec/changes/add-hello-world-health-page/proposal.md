## Why

The frontend repository has no application. Parent feature junction-2026/project#5 needs a React app that shows "Hello, World!" only when the backend health check passes, shipped as a container image.

## What Changes

- Scaffold a React + TypeScript + Vite app whose page calls `GET /healthz` once on load and renders loading, success or error states.
- Proxy `/healthz` to the backend (`BACKEND_URL`) from the Vite dev/preview server and from nginx, so the browser stays same-origin and the backend needs no CORS.
- Add a multi-stage Dockerfile (node:22-alpine build, nginx:alpine runtime), `.dockerignore`, nginx template, Vitest tests, ESLint and README docs.

No shared-spec change: this consumes the existing backend-local `GET /healthz` (200 `{"status":"ok"}`). Shared spec snapshot: shared-specs@8d3a6d7cfeef2ae2fc100d6bbd9b5adee795837b.

## Capabilities

### New Capabilities
- `health-check-ui`: page behaviour driven by the backend health check.
- `frontend-runtime`: dev proxy, container image, nginx and developer tooling/docs.

### Modified Capabilities

None.

## Impact

New files across the frontend repo (package.json, vite/ts/eslint config, src/**, Dockerfile, nginx/, README). No CI workflow changes.
