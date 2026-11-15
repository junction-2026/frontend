## 1. Advanced options panel
- [x] 1.1 Rows, summary, status pill, Always on / Final assessment, states in `HomeView` and `analyze.css`
- [x] 1.2 Request body: never `options`, only checked selectable ids
- [x] 1.3 `home` strings in en, de, fi, fr, ru, ar
## 2. Remove Settings and the account button
- [x] 2.1 Delete `SettingsView`, `AnalyzersBlock`, `locales/*/settings.ts`; router, App and Shell edits
- [x] 2.2 Remove Settings-only CSS, `.avatar` rules and `shell.account`
## 3. Tests and checks
- [x] 3.1 HomeView, router, secondary, locales DOM, static strings, i18n tests
- [x] 3.2 `npm test`, typecheck, lint, build, `scripts/validate-openspec.sh`
