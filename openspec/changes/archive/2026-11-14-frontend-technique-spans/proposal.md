## Why

Shared change `technique-spans` (shared-specs@1f10ab06e5650d7567062a9add69a68cd24b07d2, capability `technique-classifier-result`) adds `detected[].spans`: UTF-16 ranges into `Job.input.content`. The frontend has only the health page, so nothing shows these phrases to users. Parent feature: junction-2026/project#17, child issue junction-2026/frontend#5.

## What Changes

- `?job=<id>` renders a job result view: fetch `GET /api/v1/jobs/{id}`, poll every 2 s until the job is terminal, show `Job.input.content` as plain text with the `techniques` run's spans highlighted, plus a technique list.
- Pure, tested segmentation and span validation; React text nodes only (no HTML or Markdown interpretation).
- Without `?job` the health page is unchanged.
- Same-origin `/api` proxy in the Vite dev/preview server and in nginx, so the browser can reach `/api/v1` without CORS.

No shared-spec change: this consumes `technique-classifier-result` and `analysis-jobs-api` as pinned.

## Capabilities

### New Capabilities
- `job-result-view`: routing, polling, highlighting and accessibility of the job result view.

### Modified Capabilities
- `frontend-runtime`: `/api` proxy added next to `/healthz`.

## Impact

`src/App.tsx` (routing switch), new `src/job/*`, `vite.config.ts`, `nginx/default.conf.template`.
