## 1. Fonts and tokens
- [x] 1.1 Swap font dependencies to @fontsource-variable/inter; rewrite fonts.css and fonts.test.ts
- [x] 1.2 Update tokens.css (colours, --font, weights, progress tokens); drop --serif
- [x] 1.3 Solid body background and font smoothing in base.css
- [x] 1.4 Cap weights at 600 and use var(--font) in all stylesheets

## 2. Analyzing view
- [x] 2.1 Ring markup and styles (56px, 2.5px stroke, reduced motion)
- [x] 2.2 Centered 780px column, bar, chips, ledger header

## 3. Tests and validation
- [x] 3.1 Vitest: fonts, weights, body background, muted contrast, ring idle class
- [x] 3.2 lint, test, build, scripts/validate-openspec.sh
