## Why
The "Manipulation detected" link-preview image uses the green success palette. A detected verdict should read as a warning, so its preview image should use the red `--danger` accent.

## What Changes
- `scripts/og-images.py`: the `verdict-detected` entry uses accent `#c0392b` (`--danger`) and a light red background `#fbe5e2`, instead of the green `#1f8a4c` / `#e4f3e8`. Headline and subline are unchanged.
- Regenerate `public/og/verdict-detected.png` only. The other card images stay byte-identical.
- Requirement `Card images` (link-preview-cards) is modified to allow the red palette for the detected card.

## Impact
Frontend only; static asset and generator. No shared contract change. og:title, og:image URL, og:image:alt and in-app verdict colours are unchanged. Parallel change `public-origin-startup-warning` is not touched.
