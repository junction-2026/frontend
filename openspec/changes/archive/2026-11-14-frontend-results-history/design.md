## Decisions

- **One polling hook** (`src/job/useJob.ts`) on the foundation `getJob`; Results and Detail both use it. It stops on `done`, a known terminal status, or any error (existing job-result-view rule).
- **Pure readers** (`src/job/read.ts`) extract techniques, LLM findings and plain-language names from a Job; Results tags, Detail metrics and the Detail list share them, so there is one place that validates run results.
- **Detail body is the old JobView**, now taking a loaded `job` instead of an id. Segmentation and span validation (`segments.ts`) are untouched.
- **Model and latency in the Results meta row are omitted** rather than mocked: the backend exposes neither, and a fake value would read as data. Detail keeps the mock's Risk and Latency cells as `Mock`.
- **Excerpts in History** are fetched through a small queue (4 in flight, one request per id for the page lifetime) because `JobSummary` carries no input.
- **No numbers for confidence or scores** anywhere (Confidence semantics); `finalization.result.confidence` and analyzer scores are never read.
