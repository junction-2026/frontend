## Why
The History page is a plain list; a subtle backdrop of softly rendered archived documents gives it a visual identity (archive) without touching its content. Parent: junction-2026/project#87.

## What Changes
- New decorative `ArchiveBackground` layer (`src/ui/ArchiveBackground.tsx`, `src/styles/archive-bg.css`): paper sheets, folders, a file stack and an archive box in the pastel palette under a white readability veil, optional slow transform-only drift.
- `HistoryView` mounts it as the sibling directly before `section.view`.
- Tests: stylesheet, component and mounting tests.

## Impact
Frontend only. No shared-spec, API, i18n, dependency or existing-style change. Shared spec pin: shared-specs@bd681f5668c056b0cfa7b45a5e413233aec386bc (no change). Follows the patterns of `ambient-background` and `explore-veil`.
