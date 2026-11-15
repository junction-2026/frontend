## 1. Implementation
- [x] 1.1 Extract `CodeBlock`, add JSON highlight helper
- [x] 1.2 `Playground` component and placement before the curl section
- [x] 1.3 CSS (no overflow at 1440/768/390, visible focus)
- [x] 1.4 `apiDocs.playground.*` in six locales

## 2. Tests and checks
- [x] 2.1 Vitest with mocked fetch (placement, create/get, errors, 429, network, non-JSON, invalid JSON, in flight, credentials, no fetch on render, Arabic)
- [x] 2.2 lint, test, build, `scripts/validate-openspec.sh`
