## Why
The final assessment must always run. The Advanced options panel offered a toggle that sent `options.finalize: false`; it is removed.

## What Changes
- Remove the Final assessment toggle and the `home.final_assessment` string (en, de, fr, fi, ar); keep `history.final_assessment`.
- Job requests never carry `options`; the server default (`finalize` true) applies.
- No shared contract change; `CreateJobBody.options` stays in the types.
