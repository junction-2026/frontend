## Context

The backend exposes `GET /healthz` with no CORS. The browser must therefore call a relative `/healthz` on its own origin.

## Decisions

- **Same-origin proxy** (Vite proxy in dev/preview, nginx in the container) instead of CORS on the backend or a build-time backend URL: one image works against any backend via the runtime `BACKEND_URL`.
- **`checkHealth` never throws** and returns `{ok:true}|{ok:false,message}`; the component only maps the result to markup.
- **No React StrictMode** so the dev server also sends the health check exactly once.
- **Timeout** via `AbortController` aborting after `HEALTH_TIMEOUT_MS` (5000); a flag distinguishes timeout from other aborts.
- **nginx template** relies on the stock `nginx:alpine` entrypoint, which runs envsubst only on defined environment variables, so nginx's own `$uri` is untouched.
