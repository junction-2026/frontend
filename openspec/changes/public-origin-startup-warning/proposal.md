## Why
Production ran with the image default `PUBLIC_ORIGIN=http://localhost`, so every og:url and og:image pointed at `http://localhost` and Discord previews showed a broken image. Nothing reported the misconfiguration.

## What Changes
- A startup hook `docker/40-check-public-origin.sh`, installed in `/docker-entrypoint.d/`, warns on stderr when `PUBLIC_ORIGIN` is unset, empty, not an absolute http(s) origin or a loopback host. It always exits 0.
- frontend-runtime and link-preview-cards say production must set the real public origin; spec examples use `https://veil.example`.
- `scripts/og-smoke.sh` fetches every og:image URL and checks the warning appears only with a bad origin; a vitest test covers the script.
- README documents the variable, the warning and a `curl -A Discordbot` check.

No shared spec change. Card output (`nginx/og.js`, `og-handler.js`, `default.conf.template`) is unchanged.
