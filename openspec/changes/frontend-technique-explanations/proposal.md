## Why

Shared change `technique-explanations-and-llm-techniques` (shared-specs@73d6f8995f729ad027b1ccb6f79d35e43eed911d; capabilities `technique-classifier-result` Plain-language presentation and `llm-technique-result` presentation and rendering) adds `plain_language`, span `why` and a separate `llm_techniques` analyzer. The job result view shows none of it yet. Parent feature: junction-2026/project#27, child issue junction-2026/frontend#8.

## What Changes

- Technique list entries show `plain_language.name` and `definition` (fallback `display` and `explanation`).
- A span's `why` is shown in an accessible region when its highlight is focused or activated; a detection without usable spans shows `plain_language.why` under its entry.
- A separate group "Other possible issues (AI-assessed, less reliable)" lists `llm_techniques` findings; `source.title` is shown above the content and carries `field: "title"` highlights; LLM content highlights use a distinct style.
- Everything is plain text; results stored before the change render as before.

No shared-spec change: this consumes the pinned shared change.

## Capabilities

### Modified Capabilities
- `job-result-view`: technique list, plain-language why, LLM group, title.

## Impact

`src/job/JobView.tsx`, `api.ts`, `segments.ts` (optional `why` on Span), `job.css`, tests.
