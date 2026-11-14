## Why
The Settings page shows a mocked "Interface & analysis language" block with a fake select and a dead switch. Real locale switching lives elsewhere; the mock misleads.

## What Changes
- Remove the language block and its local `Switch` from `SettingsView`.
- Remove its nine keys from the en, de, fr, fi, ar settings catalogs and the unused `.select-fake` CSS rule.
- Update Settings tests.

## Impact
Frontend only; no shared contract change.
