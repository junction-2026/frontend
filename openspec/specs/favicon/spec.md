# favicon Specification

## Purpose
Defines the VEIL favicon set (SVG, ICO, PNG icons and web manifest), how index.html links it and how nginx serves it, so browser tabs and home screens show the VEIL mark.

## Requirements

### Requirement: Favicon assets
`public/` SHALL contain `favicon.svg` (a vector with a viewBox, no external references or scripts), `favicon.ico` (an ICO container holding 16x16, 32x32 and 48x48 images), `apple-touch-icon.png` (180x180 PNG), `icon-192.png` (192x192 PNG) and `icon-512.png` (512x512 PNG). Each PNG SHALL be at most 100 KB and `favicon.svg` at most 4 KB.

#### Scenario: Files and dimensions
- **WHEN** the files in `public/` are inspected
- **THEN** the ICO header lists 16, 32 and 48 px entries, each PNG IHDR matches its file name and the size limits hold

### Requirement: Favicon design
The mark SHALL be a monochrome stylised "V" in `--accent` #111111 on a `--bg` #fafaf9 background (a full-bleed square, or a rounded square for the SVG), use no other colours except anti-aliasing blends of the two, and stay recognisable at 16x16. The PNG and ICO images SHALL be rendered from the same source SVG. `apple-touch-icon.png` and `icon-512.png` SHALL be opaque, with the mark inside the central 80% safe zone.

#### Scenario: Opaque icons
- **WHEN** `apple-touch-icon.png` and `icon-512.png` are read
- **THEN** their colour type has no alpha channel

### Requirement: Reproducible rasters
The script that renders the rasters and the master `favicon.svg` SHALL be committed, and the README SHALL state how to regenerate the rasters.

#### Scenario: Regeneration
- **WHEN** `python3 scripts/favicon.py` is run after `npm ci`
- **THEN** the ICO and PNG files are rewritten from `public/favicon.svg`

### Requirement: Icon links
The `<head>` of `index.html` SHALL contain `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`, `<link rel="icon" href="/favicon.ico" sizes="any">`, `<link rel="apple-touch-icon" href="/apple-touch-icon.png">` and `<link rel="manifest" href="/site.webmanifest">`, all with root-relative hrefs and all outside the `<!-- og:start -->`..`<!-- og:end -->` block, so the njs head injection keeps them on every HTML route.

#### Scenario: Survives injection
- **WHEN** `injectHead(index, renderHead(genericCard(origin)))` is evaluated
- **THEN** the output still contains all four link tags

### Requirement: Web manifest
`public/site.webmanifest` SHALL be valid JSON with name "VEIL / Intelligence", short_name "VEIL", icons entries for `/icon-192.png` (192x192, image/png) and `/icon-512.png` (512x512, image/png), theme_color "#111111", background_color "#fafaf9" and display "browser".

#### Scenario: Icons resolve
- **WHEN** the manifest is parsed
- **THEN** each icon src exists in `public/` with the declared size

### Requirement: Static serving
nginx SHALL serve the icon files and the manifest from the site root as static files with status 200 and content types image/x-icon (or image/vnd.microsoft.icon), image/svg+xml, image/png and application/manifest+json (or application/json). They SHALL NOT fall through to the SPA/njs HTML handler. Existing location rules, including `/og/` caching, SHALL be unchanged.

#### Scenario: Not HTML
- **WHEN** `/favicon.ico` or `/site.webmanifest` is requested
- **THEN** the answer is 200 with a non-HTML content type

### Requirement: Smoke checks
`scripts/og-smoke.sh` SHALL request `/favicon.ico`, `/favicon.svg`, `/apple-touch-icon.png`, `/icon-192.png`, `/icon-512.png` and `/site.webmanifest` and fail unless each returns HTTP 200 with a non-text/html Content-Type.

#### Scenario: Container smoke
- **WHEN** `scripts/og-smoke.sh` runs against the built image
- **THEN** every icon path and the manifest answer 200 with a non-HTML content type

### Requirement: Existing behaviour unchanged
The `public/og` image set, the og card tests, the document title "VEIL / Intelligence" and the backend proxies SHALL be unaffected.

#### Scenario: Og tests
- **WHEN** the test suite runs
- **THEN** the existing og tests pass unchanged
