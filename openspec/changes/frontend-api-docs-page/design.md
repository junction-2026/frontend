## Decisions
- The button is a sibling of the three tab links inside the primary `<nav>`, so it follows History in DOM and, via flex, in visual order (mirrored in RTL). A dedicated class overrides the tab look: neutral grey (`--line-strong` on `--ink-2` text), never the active-tab (`--surface`) or accent (`--ink`) style.
- Prose comes from the `apiDocs` catalog. Untranslatable fragments (JSON, curl, paths, member names) are rendered by one `Code` component or as inline `<code dir="ltr">` through `rich()` placeholders, so catalogs keep the same placeholders in every locale.
- The page never calls the backend; the base URL is read from `window.location.origin` at render time.
