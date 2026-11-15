## Decisions
- **Delete, not hide.** The noise layer is removed with its CSS and tests, so no dead styles or exceptions remain. Nothing replaces it ("no new decorative pattern").
- **Values only in `ambient.css`.** The ambient structure, keyframes and placement stay; only numbers change: card peak opacity 0.4-0.55 to 0.75-0.9, card blur 1.5px to 2px, glow opacity 0.65 to 0.8, veil `50% 55%` ellipse with centre `#FFFFFF99` and transparent at 75%.
- **Compositing.** Animations remain transform and opacity only. Cards keep `will-change: transform, opacity` and glows `will-change: transform` (glow opacity is static); blur is static so Chromium, Firefox and Safari composite it once.
- **Enforcement.** A test over `src/styles/*.css` rejects `repeating-*-gradient`, `mask-image`, `background-image` and `noise-shard/flicker`, so the striped look cannot return unnoticed.
