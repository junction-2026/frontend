## Why
Hostinger provides hosting for the project (junction-2026/project#82). The app shows a small "Powered by Hostinger" credit with the Hostinger emblem on desktop screens.

## What Changes
- New `HostingerBadge` component, mounted once as the last child of `.app-shell` in `Shell`.
- New `src/styles/hosting-badge.css`: fixed bottom-right (logical properties), visible only at `min-width: 961px`, and bottom padding on `.app-shell` so content is never covered.
- New `credits` i18n namespace (`powered_by`) in en, fr, ar, de, fi, ru; the brand name is rendered through `rich()` in a `<bdi>`.
- Emblem asset `src/assets/hostinger-emblem.svg` and `docs/third-party-assets.md` (already committed on this branch; source, date and applied guidelines are recorded there).

## Impact
Local capability `hosting-badge` (new). No shared contract change (shared change id empty, shared-specs@bd681f5668c056b0cfa7b45a5e413233aec386bc). Existing breakpoints, topbar contents and the shell/settings catalogs are untouched.
