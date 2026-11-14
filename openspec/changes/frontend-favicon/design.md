## Decisions
- Master is `public/favicon.svg` (rounded square, polygon "V"). `scripts/favicon.py` parses its polygon and rasterises with Pillow at 8x supersampling (no SVG rasteriser is installed in CI/dev); rasters use a full-bleed square so they are opaque.
- ICO images are rendered natively at 16/32/48 rather than downscaled from one image, for crisp 16 px.
- The V spans 11..53 of 64 units, inside the central 80% safe zone (6.4..57.6).
- nginx:alpine `mime.types` has no `.webmanifest`; `location = /site.webmanifest { default_type application/manifest+json; }` fixes it without touching other rules. Icons need no override (`ico`, `svg`, `png` are mapped); `try_files $uri @spa` already serves existing files statically.
