## Why

Coding agents need to see the Figma design while they build the UI, and Figma can't be pointed at directly. The design has been exported to static HTML/CSS/JS so agents can open and read it. It must not become part of the shipped app, and its third-party font loading must not leak into production.

## What Changes

- Add `UI_DESIGN/` (index.html, css/styles.css, js/app.js): a static, non-served design reference.
- Add `UI_DESIGN/README.md`: what the folder is, how to view it, and porting notes (no runtime Google Fonts in the app).
- Exclude `UI_DESIGN` from the Docker build context in `.dockerignore`.
- No change to `src/`, the build, the image or nginx. The folder is temporary and is deleted once the frontend implements the design.

No shared-spec change.

## Capabilities

### New Capabilities
- `design-reference`: rules for the non-served Figma design reference.

### Modified Capabilities

None.

## Impact

New files under `UI_DESIGN/`, one line in `.dockerignore`. No runtime, build or CI behaviour changes.
