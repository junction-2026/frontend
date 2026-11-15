## Why
Integrators should be able to try the public analysis API from the docs page itself, without a terminal. Parent: junction-2026/project#106, child junction-2026/frontend#233.

## What Changes
- New `Playground` section on `/docs/api` directly above `Try it with curl`: a Create / Get operation switch, an editable request body, an id input, a Send button and a response panel (status, elapsed ms, syntax-highlighted pretty JSON, copy button, 429 retry hint).
- Requests go to the same origin with `credentials: 'omit'` and no Authorization header; nothing is requested on render.
- New `apiDocs.playground.*` strings in en, de, fr, ar, fi, ru.
- Modifies the requirement `API docs page needs no backend`: still no request on render; requests only when the user presses Send.

## Impact
Frontend only: `src/views/ApiDocsView.tsx`, `src/views/apiDocs/*`, `src/styles/api-docs.css`, `src/i18n/locales/*/apiDocs.ts`, tests. No shared-spec change: request and response shapes come from `public-analysis-api` at shared-specs@c9e7f5e559aed64f085d7621a131b8e19bd36b58 (change: none). No backend change. Automatic polling is out of scope.
