## Why
Shared change `bot-detection-text-result` (capability `bot-detection-result`) adds a text-level `bot_detection` analyzer result. Project issue junction-2026/project#73 asks the Results verdict card to show a small, clearly scoped marker for it.

## What Changes
- New reader `botTextOf(job)` in `src/job/botText.ts` and a `TextBotDetection` type.
- Small neutral marker (`verdict-origin`) after the confidence info in `.verdict-confidence`, with an accessible tooltip.
- New i18n keys `results.origin.*` in en, de, fi, fr, ru, ar.
- No new section or card, no change to verdict, confidence, risk or technique views.

## Impact
Frontend only. Pinned shared spec: shared-specs@92a5491bf6c142f2322523c4a24e41a5b04d4946 (change `bot-detection-text-result`, read-only). UI behaviour is local; the result contract is not duplicated here.
