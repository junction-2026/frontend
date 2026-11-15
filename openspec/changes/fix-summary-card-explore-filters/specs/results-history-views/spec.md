## ADDED Requirements

### Requirement: Detailed summary card presentation
The `.card.detailed-summary` in the expanded detailed region SHALL have inner padding of at least 1rem block and 1.15rem inline, in LTR and RTL, so its content never touches the border. "Explore coverage" and "Open detailed analysis page" SHALL stay anchor links with unchanged labels and hrefs, styled as secondary buttons scoped to `.detailed-summary`. The copy icon button SHALL keep its aria-label, title and behaviour and stay at the inline end.

#### Scenario: Card padding
- **WHEN** the detailed region is expanded
- **THEN** `.card.detailed-summary` has non-zero padding on all four sides and its chips, links and copy button lie inside it, with `dir` ltr or rtl

#### Scenario: Links keep their meaning
- **WHEN** the detailed region is expanded for job `j 1`
- **THEN** "Explore coverage" is an `<a>` with href `/explore?job=j%201` and "Open detailed analysis page" is an `<a>` with href `/jobs/j%201/detail`

#### Scenario: Button styling
- **WHEN** the links are rendered
- **THEN** each has a 1px border, a background, horizontal padding, a minimum height of 44px and a pill radius, and under 640px the two links MAY wrap to full width

#### Scenario: Button states
- **WHEN** a link has keyboard focus, is hovered or is pressed
- **THEN** it shows a focus ring of at least 2px with at least 3:1 contrast, a distinct hover background and a distinct active background, transitions last at most 150ms and none run under `prefers-reduced-motion`
