## ADDED Requirements

### Requirement: German home title
When the active locale is `de`, the Home page title SHALL render the text from the catalog key `home.title`, which SHALL be "Sehen Sie hinter das Narrativ.". The `home.title` values of all other locales SHALL be unchanged.

#### Scenario: German Home title
- **WHEN** the locale is switched to de on the Home page
- **THEN** the page title reads "Sehen Sie hinter das Narrativ."

#### Scenario: Other locales unchanged
- **WHEN** the `home.title` catalog values of en, fr, ar and fi are compared with the previous revision
- **THEN** they are byte-for-byte identical
