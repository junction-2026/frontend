## 1. Startup check
- [x] 1.1 Add `docker/40-check-public-origin.sh` (0755, POSIX sh) and copy it to `/docker-entrypoint.d/` in the Dockerfile
- [x] 1.2 Update the Dockerfile comment on `ENV PUBLIC_ORIGIN`

## 2. Tests
- [x] 2.1 `nginx/public-origin-check.test.ts` runs the script for each value and asserts exit 0 and warning presence
- [x] 2.2 `scripts/og-smoke.sh` fetches every og:image/twitter:image URL and checks the warning on a second container

## 3. Docs and specs
- [x] 3.1 README Link previews and Docker sections
- [x] 3.2 Delta specs for frontend-runtime and link-preview-cards
- [x] 3.3 Run `scripts/validate-openspec.sh`
