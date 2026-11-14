# frontend

React + TypeScript + Vite app that ports the Figma design in `UI_DESIGN/` and talks to the analysis backend.
The top bar calls the backend `GET /healthz` once on load and shows **Backend online**, **Checking backend…** or
**Backend offline** (the failure message is the tooltip).

## Routes

Client-side History-API router (no dependency); an unknown path shows Home. `/?job=<id>` redirects to `/jobs/<id>`.

| Path | View |
| --- | --- |
| `/` | Home (Analyze) |
| `/jobs/:id/live` | Analyzing |
| `/jobs/:id` | Results |
| `/jobs/:id/detail` | Detail |
| `/history` | History |
| `/explore`, `/explore/region` | Explore, Region |
| `/ask` | Ask |
| `/settings` | Settings |
| `/states` | States (mock edge cases) |

Areas not connected to the backend carry a visible `MOCK` badge and are listed in `docs/mock-areas.md`.
Fonts (Newsreader, Plus Jakarta Sans) are bundled via `@fontsource`; nothing is loaded from Google.

## Commands

Node version: see `.nvmrc` (22).

| Command | Purpose |
| --- | --- |
| `npm install` | install dependencies |
| `npm run dev` | dev server on http://localhost:5173 |
| `npm run build` | `tsc -b && vite build` into `dist/` |
| `npm test` | Vitest (jsdom, Testing Library) |
| `npm run lint` | ESLint |

## Backend URL and same-origin proxy

The browser always calls relative paths (`/healthz`, `/api/v1/...`) on its own origin, and a proxy forwards them to
the backend, so the backend needs **no CORS**. The job event stream is a WebSocket,
`ws(s)://<host>/api/v1/jobs/{id}/events`, which the proxy upgrades too (Vite `ws: true`; nginx has a dedicated
location with `Upgrade` headers and a 120 s read timeout, other `/api/` routes keep 5 s). The proxy target is `BACKEND_URL`:

- Dev server / `vite preview`: Vite proxy, default `http://localhost:8080`.
  Example: `BACKEND_URL=http://localhost:9000 npm run dev`.
- Container: nginx, default `http://host.docker.internal:8080` (set in the image).

## Docker

The image serves the built bundle with nginx on container port **80**.

```sh
docker build -t frontend .
docker run --rm -p 8081:80 \
  -e BACKEND_URL=http://host.docker.internal:8080 \
  --add-host=host.docker.internal:host-gateway \
  frontend
# open http://localhost:8081
```

`--add-host=host.docker.internal:host-gateway` is needed on Linux so the container can reach a backend on the host.
