## MODIFIED Requirements

### Requirement: Public origin
The env var `PUBLIC_ORIGIN` (scheme, host and optional port, no path; a trailing slash is stripped) SHALL prefix every og:url and image URL; it defaults to `http://localhost`. Production SHALL set the real public origin, because crawlers fetch og:image from it; a loopback or invalid value is reported by the frontend-runtime startup check. It SHALL reach njs through `js_var $og_origin` and SHALL NOT be hard-coded.

#### Scenario: Trailing slash
- **WHEN** `PUBLIC_ORIGIN` is `https://veil.example/`
- **THEN** og:image is `https://veil.example/og/site.png`

### Requirement: Generic card
The generic card SHALL have og:type `website`, og:site_name `VEIL`, og:title `VEIL / Intelligence`, one fixed product sentence of at most 200 characters as og:description and `<meta name="description">`, og:url `<PUBLIC_ORIGIN>/`, and og:image `<PUBLIC_ORIGIN>/og/site.png`. Every route without a specific card (`/`, `/ask`, `/history`, unknown paths, `/?job=<id>`) SHALL use it.

#### Scenario: Home
- **WHEN** `GET /` is requested with `-A Twitterbot` and `PUBLIC_ORIGIN=https://veil.example`
- **THEN** the response has og:type `website`, og:title `VEIL / Intelligence` and og:image `https://veil.example/og/site.png`

#### Scenario: Other routes
- **WHEN** `/history` or `/unknown` is requested
- **THEN** the generic card is returned with status 200
