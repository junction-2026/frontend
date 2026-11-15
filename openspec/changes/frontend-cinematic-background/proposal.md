## Why
The Analyze homepage ambient layer is a set of pastel blobs only. Shared project issue junction-2026/project#78 asks for a cinematic version: four large pastel glows, softly blurred drifting social/news demo cards that occasionally run a propaganda-detection demo, and a white readability veil behind the hero and composer.

## What Changes
- `AmbientBackground` (extended in place, no parallel component) renders three layers: `.ambient-glows` (4 glows), `.ambient-cards` (6 demo cards) and `.ambient-veil`.
- New palette Lavender #DDD6FE, Powder blue #BFDBFE, Mint #D1FAE5, Peach #FFE4D6; the old five-colour blob palette is removed.
- Cards drift down in seamless 25-45s transform+opacity loops; three of them run a highlight, technique badge and glow sequence on a shared 180s cycle, one at a time; three show a neutral "No strong signals" badge.
- New `ambient` i18n namespace (en, fr, ar, de, fi, ru) with fictional demo copy; badge text reuses `techniques.<id>.name`.
- Small screens: at most 2 dimmer cards below 768px, none below 480px. Reduced motion: no animation, cards hidden, glows and veil stay.
- No shared-spec change (decorative UI, no API call), no new dependency, no Home markup or behaviour change.

## Impact
Frontend only. Pinned shared spec: shared-specs@24b7969236d03059dd6447481c27afd541fcac7e (change: none; not read or changed). Modifies the canonical `ambient-background` capability and adds an i18n requirement.
