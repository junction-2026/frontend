## ADDED Requirements

### Requirement: Chat proxy
nginx SHALL add `location ~ ^/api/v1/jobs/[^/]+/chat$` before `location /api/` that proxies to `${BACKEND_URL}` like `/api/` with `proxy_read_timeout 120s` and `proxy_send_timeout 120s`, while every other location keeps its configuration.

#### Scenario: Slow chat answer
- **WHEN** the backend answers `POST /api/v1/jobs/{id}/chat` after 70 seconds
- **THEN** nginx forwards the 200 response and the other `/api/` routes keep their 5s timeouts
