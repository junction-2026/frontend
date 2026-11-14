## MODIFIED Requirements

### Requirement: Single health request on mount
On mount the top bar health indicator SHALL call `fetch('/healthz', {method:'GET', headers:{Accept:'application/json'}, signal})` exactly once, with an AbortController that aborts after `HEALTH_TIMEOUT_MS` (5000 ms, defined in `src/health.ts`). The UI SHALL NOT retry automatically.

#### Scenario: One request on load
- **WHEN** the App mounts
- **THEN** fetch is called once with URL `/healthz`, method GET, an `Accept: application/json` header and an abort signal

### Requirement: Success rendering
On success the top bar SHALL show a status dot with the text "Backend online" and nothing that indicates an error. The page "Hello, World!" SHALL NOT exist.

#### Scenario: Heading shown
- **WHEN** the health check succeeds
- **THEN** the text "Backend online" is shown and no element has role alert

### Requirement: Pending rendering
While the request is pending the top bar SHALL render an element with `role="status"` and text "Checking backend…", and no error.

#### Scenario: Loading
- **WHEN** the response has not yet resolved
- **THEN** a status element reads "Checking backend…" and there is no alert

### Requirement: Failure rendering
On failure the top bar SHALL render an element with `role="alert"` and the text "Backend offline", whose `title` (tooltip) is the checkHealth message, described under "Failure messages".

#### Scenario: HTTP 503
- **WHEN** the response is 503
- **THEN** an alert "Backend offline" with a title containing "503" is shown

#### Scenario: Network error
- **WHEN** fetch rejects with a TypeError
- **THEN** an alert "Backend offline" whose title contains the error message is shown

#### Scenario: Timeout
- **WHEN** no response arrives within 5000 ms
- **THEN** the alert title contains "timed out"

#### Scenario: Non-JSON body
- **WHEN** the response body is not JSON
- **THEN** the alert title contains "unexpected response body" and the start of the body

## ADDED Requirements

### Requirement: Failure messages
The checkHealth message SHALL be: for a non-2xx response "Backend health check failed: HTTP <status> <statusText>"; for a network error "Backend health check failed: <error.message>"; for a timeout "Backend health check failed: timed out after 5000 ms"; for a non-JSON body or `status !== "ok"` "Backend health check failed: unexpected response body" followed by up to the first 200 characters of the received body.

#### Scenario: Truncated body
- **WHEN** the response body is 300 characters of non-JSON text
- **THEN** the message contains only the first 200 of them
