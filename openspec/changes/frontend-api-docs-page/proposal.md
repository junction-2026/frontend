## Why
Judges and integrators should call the public analysis API in one minute. The API exists (shared capability `public-analysis-api`) but nothing in the web app says how to use it. Parent: junction-2026/project#103, child junction-2026/frontend#225.

## What Changes
- New public, login-free page `/docs/api` (route `api-docs`, view `ApiDocsView`): base URL from `window.location.origin`, no-auth statement, three request bodies, one curl create and one curl get with copy buttons, PublicAnalysis response fields, an example completed response and the error list.
- A grey `Integrate API` link-button in the top bar directly after the History nav item.
- New i18n namespace `apiDocs` and key `shell.integrate_api` in en, de, fr, ar, fi, ru.
- No OpenAPI is generated. `/` stays Home; Analyze/Explore stay the default product.

## Impact
Frontend only: `src/router.tsx`, `src/App.tsx`, `src/ui/Shell.tsx`, `src/styles/shell.css`, `src/styles/api-docs.css`, `src/views/ApiDocsView.tsx`, locale catalogs, tests. No shared-spec change; request and response shapes come from `public-analysis-api` at shared-specs@c9e7f5e559aed64f085d7621a131b8e19bd36b58 (change: none).
