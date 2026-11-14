## Why
The analyzing view shows two mocked labels (cluster, retention claim) the backend never reports; they are misleading.

## What Changes
- Delete the cluster and retention elements and their locale keys (en, de, fi, fr, ar).
- Render `.quote-foot` only when it has content.
- Drop the two rows from docs/mock-areas.md.
- MODIFIED analyze-flow-ui 'Live view state'. No shared contract change.
