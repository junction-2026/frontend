## 1. Generator
- [x] 1.1 Change the `verdict-detected` entry in `scripts/og-images.py` to accent `#c0392b` and background `#fbe5e2`.

## 2. Images
- [x] 2.1 Regenerate `public/og/verdict-detected.png` (1200x630, at most 300 KB) and leave the other card PNGs byte-identical.
- [x] 2.2 Check with Pillow that the background and accent sample pixels are red-dominant and that no pixel has green above both red and blue by more than 16.

## 3. Tests
- [x] 3.1 Add a vitest case in `nginx/og.test.ts` that reads `scripts/og-images.py` and asserts the `verdict-detected` entry uses `#c0392b` and contains neither `#1f8a4c` nor `#e4f3e8`.
