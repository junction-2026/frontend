## Why
The German Home title reads "Sehen Sie hinter die Erzählung." The copy should use "Narrativ" instead, as part of junction-2026/project#50 (child frontend#66).

## What Changes
- German catalog key `home.title` (`src/i18n/locales/de/home.ts`) becomes "Sehen Sie hinter das Narrativ.".
- The i18n test asserts the new German Home title.
- Other locales, other German copy, layout and styling are unchanged.

## Impact
Specs: i18n (one added requirement). No shared contract change: this is frontend UI copy only (shared_change_id "").
