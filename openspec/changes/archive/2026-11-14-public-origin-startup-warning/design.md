## Decisions
- Hook in `/docker-entrypoint.d/`: the stock nginx:alpine entrypoint runs executable `*.sh` files there after template rendering and before nginx starts; no custom entrypoint is needed.
- Warn, never fail: local development with the default origin keeps working; a failing hook would stop the container.
- POSIX `sh` with `grep -E` for the origin shape and `case` for loopback hosts, so it runs under busybox ash (image) and dash/bash (vitest).
- No hardcoded production domain anywhere; examples use `https://veil.example`.
