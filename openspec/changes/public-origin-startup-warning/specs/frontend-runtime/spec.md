## ADDED Requirements

### Requirement: Public origin startup check
The image SHALL contain `/docker-entrypoint.d/40-check-public-origin.sh` (mode 0755, POSIX sh, copied from `docker/40-check-public-origin.sh`), so that the stock nginx:alpine entrypoint runs it before nginx starts. The script SHALL exit 0 in all cases, SHALL NOT change `PUBLIC_ORIGIN` or the rendered template, and SHALL print nothing when the value is accepted.

#### Scenario: Default origin warns
- **WHEN** the container starts without `PUBLIC_ORIGIN` (image default `http://localhost`)
- **THEN** `docker logs` contains one line starting with `WARNING: PUBLIC_ORIGIN="http://localhost"` and nginx serves `/` with 200

#### Scenario: Valid origins are silent
- **WHEN** `PUBLIC_ORIGIN` is `https://veil.example`, `https://veil.example/` or `http://veil.example:8443`
- **THEN** the script prints nothing and exits 0

### Requirement: Public origin acceptance
The startup check SHALL accept `PUBLIC_ORIGIN` only when, after one optional trailing `/` is stripped, it matches `^https?://[^/?#[:space:]@]+$` (scheme http or https, a host, optional `:port`, no path, query, fragment or userinfo) and its host is not `localhost`, `127.0.0.1`, `[::1]` or `0.0.0.0` (case-insensitive).

#### Scenario: Invalid origins warn
- **WHEN** `PUBLIC_ORIGIN` is unset, empty, `localhost:8080`, `ftp://veil.example`, `https://veil.example/app`, `https://veil.example?x=1`, `http://LOCALHOST:8080`, `http://127.0.0.1:8081` or `http://[::1]`
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

## MODIFIED Requirements

### Requirement: njs module and public origin
The image SHALL load `ngx_http_js_module.so` (shipped with nginx:alpine) in the main nginx context and SHALL set `ENV PUBLIC_ORIGIN=http://localhost`, a default for local development only; the Dockerfile comment SHALL say so and that the startup check warns about it. The template SHALL pass the origin to njs with `js_var $og_origin "${PUBLIC_ORIGIN}"`.

#### Scenario: Module loaded
- **WHEN** the container starts with `-e PUBLIC_ORIGIN=https://veil.example`
- **THEN** nginx starts with the njs module loaded and cards use `https://veil.example`

#### Scenario: Default origin
- **WHEN** the container starts without `PUBLIC_ORIGIN`
- **THEN** nginx starts with the default `http://localhost` and the log contains the `WARNING: PUBLIC_ORIGIN` line

### Requirement: README documentation
The README SHALL document the install, dev, build, test and lint commands, the BACKEND_URL defaults (dev `http://localhost:8080`; container `http://host.docker.internal:8080` with `--add-host=host.docker.internal:host-gateway` on Linux), container port 80, an example docker build/run that sets `-e PUBLIC_ORIGIN=...` with a comment, the same-origin proxy design (no backend CORS needed) including the WebSocket proxy for `/api/v1/jobs/{id}/events`, and the routes of the app.

#### Scenario: Reader finds the run instructions
- **WHEN** a developer opens the README
- **THEN** every item above is documented
