## ADDED Requirements

### Requirement: History view fully localized
Every static string of the History view (title, lede, mock labels, search placeholder and aria-label, filter group and buttons, status labels, empty and error states, load-more, relative times and day headings) SHALL come from the catalogs in en, fr, ar, de and fi. Job ids and the quoted excerpt SHALL be wrapped in `<bdi>`. Dates, relative times and counts SHALL use Intl in the active locale. Changing the locale SHALL keep the selected status filter and the loaded list.

#### Scenario: History in Arabic
- **WHEN** History is rendered in ar with one job
- **THEN** it has dir rtl, no static Latin-script text other than the brand and the job id, the id and the excerpt are inside `bdi`, and the status filter stays selected after a locale switch
