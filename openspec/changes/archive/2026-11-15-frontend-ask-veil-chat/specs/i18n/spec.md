## MODIFIED Requirements

### Requirement: Brand name in catalogs
Every string in the en, de, fr, fi, ar and ru catalogs that names the product SHALL use "VEIL" (all caps, Latin script) unchanged (never translated or transliterated), grammatically inflected where the language requires it; in ru an inflection SHALL be a hyphenated ending (for example "VEIL-а"). The French common noun "veille" is not the brand and is unchanged.

#### Scenario: Inflection
- **WHEN** the fi catalog says "ask VEIL" or "VEIL's"
- **THEN** the strings read "Kysy VEILiltä" and "VEILin", the de string reads "VEIL fragen" and the fr string reads "Demander à VEIL"

#### Scenario: Russian brand
- **WHEN** the ru catalog names the product
- **THEN** the name is "VEIL" in Latin caps (the ru `results.ask` reads "Спросить VEIL") and no catalog string contains a Cyrillic transliteration of it
