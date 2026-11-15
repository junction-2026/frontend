## ADDED Requirements

### Requirement: Home sample statements
The Home Try row SHALL render the samples energy, breaking, editorial and springfield, in that order, each as a button whose label comes from `home.sample.<key>.label`. Activating a sample button SHALL select text mode and set the textarea to `home.sample.<key>.text`. The sample buttons SHALL stay unmarked (not inside `[data-mock]`).

#### Scenario: Four samples in order
- **WHEN** Home renders
- **THEN** the Try row contains four buttons in the order energy, breaking, editorial, springfield

#### Scenario: Springfield sample
- **WHEN** the springfield button is clicked
- **THEN** text mode is selected and the textarea holds the exact quote

### Requirement: Springfield sample text
`home.sample.springfield.text` SHALL be the verbatim English quote "In Springfield, they're eating the dogs. The people that came in, they're eating the cats. They're eating the pets of the people that live there. And this is what's happening in our country, and it's a shame." in every locale (en, fr, de, fi, ar, ru) and SHALL NOT be translated, because it is a direct quote.

#### Scenario: Text identical across locales
- **WHEN** the six home catalogs are compared
- **THEN** every `home.sample.springfield.text` equals the en value

### Requirement: Springfield sample label
`home.sample.springfield.label` SHALL be translated in every locale and SHALL attribute the text as a quote by Trump about Springfield (en: "Political rhetoric: Trump on Springfield (quote)"). The ar label SHALL contain no Latin-script letters.

#### Scenario: Arabic label script
- **WHEN** the ar springfield label is inspected
- **THEN** it contains no Latin-script letters
