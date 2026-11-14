# frontend

React + TypeScript + Vite app. The page calls the backend `GET /healthz` once on load and shows
**Hello, World!** only when it returns `200` with a JSON body whose `status` is `"ok"`. While waiting it shows
"Loading…"; on any failure (non-2xx, network error, 5000 ms timeout, unexpected body) it shows an error message.

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

The browser always calls the relative path `/healthz` on its own origin, and a proxy forwards it to the
backend, so the backend needs **no CORS**. The proxy target is `BACKEND_URL`:

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
