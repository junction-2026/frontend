## ADDED Requirements

### Requirement: World map customization
`WorldMap` SHALL accept optional `fillFor(code)`, `renderTooltip(code)` and `focusable` props. `fillFor` returns the base fill of a country (undefined keeps the default coverage fill). `renderTooltip` returns the tooltip content shown on hover and focus. When the props are omitted, fills, tooltip and behaviour SHALL be exactly as before, including country paths that are not tab stops.

#### Scenario: Custom fill and tooltip
- **WHEN** `fillFor` returns `#123456` for `DE` and `renderTooltip` returns "Hi"
- **THEN** the `DE` path has fill `#123456` and hovering it shows a tooltip "Hi"

#### Scenario: Defaults
- **WHEN** none of the props is passed
- **THEN** no country path has a `tabindex` and the coverage tooltip is unchanged

### Requirement: Focusable map countries
With `focusable`, every interactive country SHALL have `tabIndex` 0, an `aria-label` with its name and `aria-describedby` pointing at the tooltip while it is shown, Enter and Space SHALL act as a click, and focus SHALL show the tooltip. The SVG SHALL then have `role="group"` with the same `aria-label`, because the children of an `img` are presentational.

#### Scenario: Keyboard
- **WHEN** `focusable` is set, `DE` receives focus and Enter is pressed
- **THEN** the tooltip is shown, the path has `aria-describedby` of the tooltip and `onSelect('DE')` is called
