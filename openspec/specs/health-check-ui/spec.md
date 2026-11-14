# health-check-ui Specification

## Purpose
Defines how the frontend page reflects the backend health check: what request it sends and what it renders while pending, on success and on each kind of failure.

## Requirements

### Requirement: Single health request on mount
On mount the App SHALL call `fetch('/healthz', {method:'GET', headers:{Accept:'application/json'}, signal})` exactly once, with an AbortController that aborts after `HEALTH_TIMEOUT_MS` (5000 ms, defined in `src/health.ts`). The UI SHALL NOT retry automatically.

#### Scenario: One request on load
- **WHEN** the App mounts
- **THEN** fetch is called once with URL `/healthz`, method GET, an `Accept: application/json` header and an abort signal

### Requirement: Success criteria
The state SHALL be success only when `response.ok` is true AND `response.status === 200` AND the parsed JSON body is an object whose member `status` equals `"ok"`. Additional members SHALL be ignored.

#### Scenario: Healthy backend
- **WHEN** the response is 200 with body `{"status":"ok","extra":1}`
- **THEN** the state is success

#### Scenario: Status not ok
- **WHEN** the response is 200 with body `{"status":"down"}`
- **THEN** the state is failure

### Requirement: Success rendering
On success the page SHALL render `<h1>Hello, World!</h1>` and nothing that indicates an error.

#### Scenario: Heading shown
- **WHEN** the health check succeeds
- **THEN** an h1 with the exact text "Hello, World!" is shown and no element has role alert

### Requirement: Pending rendering
While the request is pending the page SHALL render an element with `role="status"` and text "Loading…", and no heading or error.

#### Scenario: Loading
- **WHEN** the response has not yet resolved
- **THEN** a status element reads "Loading…" and there is no heading and no alert

### Requirement: Failure rendering
On failure the page SHALL render an element with `role="alert"` and no "Hello, World!" text. The message SHALL be: for a non-2xx response "Backend health check failed: HTTP <status> <statusText>"; for a network error "Backend health check failed: <error.message>"; for a timeout "Backend health check failed: timed out after 5000 ms"; for a non-JSON body or `status !== "ok"` "Backend health check failed: unexpected response body" followed by up to the first 200 characters of the received body.

#### Scenario: HTTP 503
- **WHEN** the response is 503
- **THEN** an alert containing "503" is shown and there is no heading

#### Scenario: Network error
- **WHEN** fetch rejects with a TypeError
- **THEN** an alert containing the error message is shown

#### Scenario: Timeout
- **WHEN** no response arrives within 5000 ms
- **THEN** an alert containing "timed out" is shown

#### Scenario: Non-JSON body
- **WHEN** the response body is not JSON
- **THEN** an alert containing "unexpected response body" and the start of the body is shown

### Requirement: checkHealth contract
The health call SHALL live in `src/health.ts` as `checkHealth(fetchImpl = fetch): Promise<{ok:true}|{ok:false,message:string}>` and SHALL never throw.

#### Scenario: Injected fetch rejects
- **WHEN** `fetchImpl` rejects
- **THEN** checkHealth resolves with `{ok:false, message}`
