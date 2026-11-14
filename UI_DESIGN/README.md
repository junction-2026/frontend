# UI_DESIGN: Figma design reference (not part of the app)

A static HTML/CSS/JS export of the Figma design, kept here so coding agents can see how the UI should look
(Figma itself can't be pointed at). It is **not** built, linted, served or deployed:

- nothing in `src/`, `vite.config.ts` or the build reads it;
- `.dockerignore` excludes it from the image build context;
- `js/app.js` only simulates interactions (no network calls).

**Temporary:** delete this folder once the frontend implements the design.

## Viewing it

The page uses root-relative paths (`/css/styles.css`, `/js/app.js`), so serve this folder as the web root:

```sh
cd UI_DESIGN && python3 -m http.server 8000   # then open http://localhost:8000
```

## Porting notes

- `index.html` loads Google Fonts from `fonts.googleapis.com` / `fonts.gstatic.com`. That's fine for viewing the
  reference, but **the app must not load third-party fonts at runtime**: it would send every visitor's IP address to
  Google on a tool that handles sensitive content. Self-host the fonts (e.g. bundled font files) when porting.
- Treat the HTML/CSS as a visual reference: rebuild the components in React rather than copying the markup.
