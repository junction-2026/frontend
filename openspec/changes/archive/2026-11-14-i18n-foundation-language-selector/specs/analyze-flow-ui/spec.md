## MODIFIED Requirements
### Requirement: Home copy and mock marking
The support note SHALL read "Supports Bluesky, Mastodon and web pages" in English; all Home copy SHALL come from the `home` catalog in the active locale. Home SHALL NOT render a language chip ("Auto-detect (EN, FR, AR, DE, FI)"). The two feature cards ("Unbiased Dissection", "Provenance & Signals") SHALL be wrapped in `Mock`. Home SHALL NOT render a "Private by Architecture" card. The `Try:` sample buttons SHALL fill the textarea and SHALL NOT be marked.

#### Scenario: Marked and unmarked elements
- **WHEN** Home renders
- **THEN** each feature card is inside `[data-mock]`, the sample buttons, count and support note are not, the Auto-detect chip is absent, and no "Private by Architecture" text is present
