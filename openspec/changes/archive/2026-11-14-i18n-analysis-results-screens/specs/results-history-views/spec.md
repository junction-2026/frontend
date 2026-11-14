## ADDED Requirements
### Requirement: Results and Detail copy from the results catalog
All fixed text of `/jobs/:id` and `/jobs/:id/detail` (meta row, verdict headings and bodies, confidence line and tooltip, state cards, actions, Detail heading, back link and final assessment) and of `/states` SHALL come from the `results` catalog in the active locale for en, fr, ar, de and fi. The English text quoted in the Results and Detail requirements of this capability is the `en` catalog value.

#### Scenario: Another locale
- **WHEN** the locale is `de` and the verdict is `detected`
- **THEN** the Results heading reads "Ja, Propaganda erkannt.", the Detail label reads "Manipulation erkannt", and `user_text` is shown unchanged

#### Scenario: Language switch
- **WHEN** the user switches the language while Results is open
- **THEN** the page re-renders in the new language without a reload

### Requirement: Results enum labels and API strings
The verdict label on Detail SHALL map the verdict enum to `results.verdict.label.*`; an unknown verdict keeps reading as uncertain. The finalization skip reason SHALL map to a catalog key, any other reason reads "No final assessment was made." in the locale. API-provided strings (`user_text`, the scrape error `message` and `code`, the finalization error `code`) SHALL be shown unchanged and SHALL NOT be passed through `t()`. History verdict labels stay as they are in this change.

#### Scenario: Scrape failure
- **WHEN** the locale is `de` and the job failed with a scrape error whose `message` is English
- **THEN** the pill reads "Abruf fehlgeschlagen" and the headline is the API `message` unchanged

### Requirement: Results numbers, dates and durations
The confidence SHALL be shown as a whole percent formatted with the active locale ("86%" in en, "86 %" with a non-breaking space in fr); the job duration SHALL use the locale's number formatter with the unit text from the catalog; counts on `/states` use the same formatter.

#### Scenario: French percentage
- **WHEN** the locale is `fr` and the confidence is 0.86
- **THEN** the line reads "86 % de confiance" with a non-breaking space before `%`

#### Scenario: German duration
- **WHEN** the locale is `de` and the job took 3200 ms
- **THEN** the meta row shows "Dauer 3,2 s"

### Requirement: Results layout in right-to-left languages
Results, Detail and States SHALL remain usable with `dir=rtl` (Arabic): the verdict, the detailed region, the highlighted text and the "why" region lay out without physical left or right.

#### Scenario: Arabic
- **WHEN** the locale is `ar`
- **THEN** the document direction is `rtl` and the Results verdict heading is Arabic
