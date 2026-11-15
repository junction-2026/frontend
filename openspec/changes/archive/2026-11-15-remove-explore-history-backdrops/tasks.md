## 1. Implementation
- [x] 1.1 Remove `ExploreVeil` and `ArchiveBackground` from `ExploreView` and `HistoryView`
- [x] 1.2 Delete the components, stylesheets, tests and `src/ui/silkVeil/`
- [x] 1.3 Update the stale z-index comment in `hosting-badge.css`

## 2. Tests
- [x] 2.1 ExploreView (both modes) and HistoryView (loading, loaded, empty, error) assert no backdrop, `.ambient-bg` or `<canvas>`

## 3. Verification
- [x] 3.1 lint, typecheck, unit tests, build, `scripts/validate-openspec.sh`
