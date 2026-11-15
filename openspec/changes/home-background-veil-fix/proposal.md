## Why
The homepage shows giant striped, letter-like shapes behind the hero (`.noise-headline-text` at up to 240px, scaled 1.8x vertically and masked by `repeating-linear-gradient`, plus the `noise-shard-a/b` slices). They hide the intended look: soft pastel glows and clearly visible floating social cards. Parent: junction-2026/project#86.

## What Changes
- Remove the `noise-headline` capability: `HomeView` stops rendering `<NoiseHeadline />`; `NoiseHeadline.tsx`, `noise-headline.css` and their tests are deleted.
- Remove the 'Decode the Noise' static-strings exception and the `.noise-headline` exceptions in `fonts.test.ts` and `locales.dom.test.tsx`.
- `ambient-background`: `HomeView` renders `<AmbientBackground />` directly before `section.view` with no other decorative layer; cards become clearly visible (peak opacity 0.75-0.9, blur 2-4px); glows are more saturated (opacity 0.7-0.9); the veil is lighter and smaller so glows reach the edges.
- New rule: no stylesheet uses repeating gradients, `mask-image` or `background-image` patterns, enforced by a unit test.
- No shared-spec change (UI only), no new dependency, no change to topbar, hero, composer or copy.

## Impact
Frontend only. Pinned shared spec: shared-specs@00fc92ea48cf68a65b189995ddd4cbffe96a48b5 (no change, not read for contracts). Affects `src/views/HomeView.tsx` (one import, one JSX line), `src/styles/ambient.css` and their tests.
