## 1. Remove noise-headline
- [x] 1.1 Delete `src/ui/NoiseHeadline.tsx`, `NoiseHeadline.test.tsx`, `src/styles/noise-headline.css`, `noise-headline.test.ts`
- [x] 1.2 Remove the import and `<NoiseHeadline />` line from `HomeView.tsx`
- [x] 1.3 Remove 'Decode the Noise' from `staticStrings.test.ts` and the `.noise-headline` exceptions from `fonts.test.ts` and `locales.dom.test.tsx`

## 2. Ambient values
- [x] 2.1 Card peak opacity 0.75-0.9, card blur 2px
- [x] 2.2 Glow opacity 0.8
- [x] 2.3 Veil: ellipse 50% 55%, centre `#FFFFFF99`, transparent at 75%

## 3. Tests and verification
- [x] 3.1 Update `ambient.test.ts` ranges; add the no-repeating-gradient stylesheet test
- [x] 3.2 Add the HomeView DOM test (no `.noise-headline`, `.ambient-bg` directly before `section.view`)
- [x] 3.3 `npm test`, lint, typecheck, build, `scripts/validate-openspec.sh`
- [x] 3.4 Before/after screenshots at 1280x800, 1920x1080 (and 768) plus one mid-animation frame
