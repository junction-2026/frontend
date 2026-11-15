# frontend

React + TypeScript + Vite app that implements the Figma design and talks to the analysis backend.
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
| `/states` | States (mock edge cases) |

Areas not connected to the backend carry a visible `MOCK` badge and are listed in `docs/mock-areas.md`.
Inter is bundled via `@fontsource-variable/inter`; nothing is loaded from Google.

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
  -e PUBLIC_ORIGIN=http://localhost:8081 \
  --add-host=host.docker.internal:host-gateway \
  frontend
# PUBLIC_ORIGIN: the origin users and crawlers reach the site at (local value shown; in production see "Link previews")
# open http://localhost:8081
```

`--add-host=host.docker.internal:host-gateway` is needed on Linux so the container can reach a backend on the host.

## Link previews (Open Graph / Twitter)

Crawlers do not run the SPA, so the nginx container (njs module of `nginx:alpine`) answers HTML routes with the built
`index.html` plus a card block in `<head>` (`nginx/og.js`, `nginx/og-handler.js`). The same document is served to every
user agent; only the `<!-- og:start -->…<!-- og:end -->` block differs. `index.html` carries the generic card for
`vite dev`/`preview`; the images are `public/og/*.png` (1200x630, regenerate with `python3 scripts/og-images.py` after `npm ci`).

`PUBLIC_ORIGIN` **must be set in production** to the real public origin: `scheme://host[:port]`, no path (a single trailing
slash is stripped), e.g. `docker run -e PUBLIC_ORIGIN=https://veil.example …`. It prefixes every `og:url` and `og:image`
URL, and crawlers such as Discord, Slack and Twitter fetch the preview image from it; with the default `http://localhost`
the preview images are broken. The image default is for local use only. At startup `docker/40-check-public-origin.sh`
(run by the nginx entrypoint) prints one line to the container log, and still starts nginx, when the value is unset,
empty, not an absolute `http(s)` origin, has a path, or is a loopback host (`localhost`, `127.0.0.1`, `[::1]`, `0.0.0.0`):

```text
WARNING: PUBLIC_ORIGIN="http://localhost" is unset, not an absolute http(s) origin or a loopback host. og:url and og:image use this value, so crawlers (Discord, Slack, Twitter) cannot fetch the link-preview images. Set PUBLIC_ORIGIN to the public scheme://host[:port], e.g. https://veil.example
```

Check a deployment with a job id Discord has not seen yet (Discord caches previews), then fetch the image URL:

```sh
curl -s -A Discordbot https://veil.example/jobs/<fresh-id> | grep og:image
curl -sI <og:image url> | head -3   # expect HTTP 200 and content-type: image/png
```

| Route | Card |
| --- | --- |
| `/`, `/ask`, `/history`, unknown paths, malformed job ids | Generic site card (`og/site.png`) |
| `/jobs/{id}`, `/jobs/{id}/detail`, `/jobs/{id}/live`, finished job | Verdict card: `VEIL verdict: <label>`, verdict heading plus `user_text` (max 200 characters, escaped), `og/verdict-*.png` |
| same, not done or finalization pending/running | "VEIL analysis in progress" (`og/pending.png`) |
| same, failed, cancelled, finalization failed/skipped or no result | "VEIL analysis unavailable" (`og/unavailable.png`) |
| same, backend 404, other error, invalid JSON or no answer within 2 s | Generic site card |

The status is always 200. Cards never contain the input, its source, scrape URLs, analyzer results or confidence.
The job is read with an internal subrequest through the `/api/` proxy.

Container smoke test (needs docker, not part of CI): `scripts/og-smoke.sh` builds the image, starts it with a stub
backend (`scripts/og-stub-backend.mjs`) and checks the tags with `curl -A Twitterbot`, fetches every `og:image`/`twitter:image` URL (200 `image/png`) and
checks that a container without `PUBLIC_ORIGIN` logs the startup warning and the configured one does not.

## Favicon

`public/favicon.svg` is the master (a monochrome "V", `#111111` on `#fafaf9`). `favicon.ico` (16/32/48), `apple-touch-icon.png`,
`icon-192.png`, `icon-512.png` are rendered from it: after `npm ci`, run `python3 scripts/favicon.py` (Pillow only) and commit
the result. `index.html` links them outside the `og:start`/`og:end` block, so the njs head injection keeps them;
`site.webmanifest` is served as `application/manifest+json` by a `location` in `nginx/default.conf.template`.
