# design-reference Specification

## Purpose
Defines the Figma design reference kept in `UI_DESIGN/`: a static, non-served export that coding agents read to see the intended UI, and the rules that keep it out of the shipped app.

## Requirements

### Requirement: Non-served design reference
`UI_DESIGN/` SHALL contain only the static design export (HTML, CSS, JS and its README), and nothing in `src/`, `vite.config.ts`, the Dockerfile or the nginx configuration SHALL read, bundle or serve it. `.dockerignore` SHALL list `UI_DESIGN`.

#### Scenario: Image build ignores the reference
- **WHEN** the frontend image is built
- **THEN** `UI_DESIGN` is not part of the Docker build context and the served `dist/` contains none of its files

### Requirement: No generated artifacts
`UI_DESIGN/` SHALL NOT contain build output (minified bundles, hashed asset files or built HTML of another app).

#### Scenario: Only source files
- **WHEN** the repository is checked out
- **THEN** `UI_DESIGN/` holds hand-readable HTML, CSS and JS files and a README, and no `assets/*-<hash>.js` style bundles

### Requirement: Viewing and porting documentation
`UI_DESIGN/README.md` SHALL state that the folder is a temporary, non-served reference to be deleted once the frontend implements the design, how to view it (serve the folder as the web root), and that the application SHALL NOT load third-party fonts at runtime (fonts are self-hosted when the design is ported).

#### Scenario: Agent reads the reference
- **WHEN** an agent opens `UI_DESIGN/README.md`
- **THEN** it learns the folder's purpose, how to serve it locally and that Google Fonts links must not be carried into the app
