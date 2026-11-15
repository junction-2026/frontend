## Why
Parent junction-2026/project#71: the Analyze (Home) view gets a decorative "Decode the Noise" headline in tall black lettering with a shredded bad-signal glitch, behind the content. Frontend only; no shared contract or API change.

## What Changes
- New `NoiseHeadline` component and `noise-headline.css` (CSS-only), mounted by `HomeView` before `AmbientBackground`.
- `Decode the Noise` added to the static-strings ALLOWED set (fixed brand phrase, not localized).
- Two existing guard tests get narrow exemptions for this decorative layer: the font-weight cap (`src/fonts.test.ts`, weight 800-900 required) and the Arabic Latin-text scan (`src/i18n/locales.dom.test.tsx`).
- Screenshots in `docs/noise-headline/`.

## Capabilities
### New Capabilities
- `noise-headline`: decorative glitched background headline on Home.
