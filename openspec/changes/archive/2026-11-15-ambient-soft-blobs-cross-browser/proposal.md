## Why
Homepage ambient blobs look harder-edged on macOS (Safari, Chrome) than on Windows. Softness came only from a 130px blur over a gradient with a solid 45% core.

## What Changes
- Blob gradients become 6-stop eased-alpha radial gradients reaching transparent at 100%.
- Blur drops from 130px to 60px as extra smoothing only.
- Spec requirements and tests updated; positions, sizes, opacity and animation unchanged.
