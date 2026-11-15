## Decisions
- The marker is a `button` (focusable) reusing the `confidence-info` wrapper and `confidence-tip` tooltip styling and the same hover/focus/Escape handling as the confidence info button; no new tooltip component.
- `score` is P(bot_or_generated); the percentage is only part of the tooltip/aria text and is never shown as confidence in `human`.
- The reader validates strictly (status, scope, label, finite score 0..1) and returns null otherwise, so every invalid shape renders nothing and raises no error (shared "Text scope is not an account verdict").
