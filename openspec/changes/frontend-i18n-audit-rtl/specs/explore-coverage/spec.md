## ADDED Requirements

### Requirement: Explore fully localized and isolated
Every static string, placeholder, aria-label, title, tooltip, empty and error state of Explore SHALL come from the catalogs in en, fr, ar, de and fi. Country names SHALL come from `formatCountryName`, counts and plurals from Intl. Article titles, publishers, snippets, claims, topics, provider dates and API codes are source material: they SHALL stay verbatim and be wrapped in `<bdi>`. The filters (text, topic, country, languages, publishers, verified) SHALL be kept across a locale switch.

#### Scenario: Explore in Arabic
- **WHEN** Explore with a loaded job is rendered in ar
- **THEN** html has dir rtl, labels and notices are Arabic, article titles and publisher names are inside `bdi`, and country names are Arabic

#### Scenario: Locale switch keeps filters
- **WHEN** the country filter is Finland and the search text is "grid", then the locale becomes fr
- **THEN** the same country and text stay selected, the list is unchanged and the country option reads "Finlande"
