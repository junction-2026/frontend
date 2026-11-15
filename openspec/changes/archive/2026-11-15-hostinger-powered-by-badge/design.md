## Decisions
- Brand name via `{brand}` placeholder and `rich()` with `<bdi>` for every locale, so Latin "Hostinger" keeps its direction in `ar`. The name is a code constant, so no letter-bearing JSX literal exists.
- Hidden below 961px with `display: none` (also removes it from the accessibility tree); the base rule is `display: none` and the media query switches it on, matching the shell's `max-width: 960px` breakpoint.
- Emblem height 18px with `width: auto`, `object-fit: contain`; clear space around it is `0.35rem`-ish padding plus a 0.5rem (8px) gap, at least 25% of 18px (4.5px).
- The asset colour (#673DE6) was approved by the project owner; see docs/third-party-assets.md.
