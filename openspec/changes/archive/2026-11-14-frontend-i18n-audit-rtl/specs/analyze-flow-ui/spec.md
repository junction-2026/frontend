## ADDED Requirements

### Requirement: Home fully localized
Every static string of Home (eyebrow, title, lede, mode tabs and their label, support note, placeholders, input label, advanced options, analyzer states, character count, sample links, feature cards, error messages) SHALL come from the catalogs in en, fr, ar, de and fi. Analyzer names from the API SHALL be wrapped in `<bdi>`. The submit arrow SHALL mirror under `[dir=rtl]`. Changing the locale SHALL keep the typed input, the mode and the open panel.

#### Scenario: Home in Arabic
- **WHEN** Home is rendered in ar
- **THEN** html has lang ar and dir rtl and no static Latin-script text other than the brand "VEIL" appears

#### Scenario: Input survives a switch
- **WHEN** text is typed and the locale changes
- **THEN** the textarea keeps its value
