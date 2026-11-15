## MODIFIED Requirements

### Requirement: Language switching keeps state
Changing the locale SHALL only change the context: the route, the Explore country selection, the History filter and list, and the Home input SHALL be kept, and no request SHALL be made other than data that is itself locale-specific. The language preference SHALL keep persisting in `localStorage['veil.locale']`.

#### Scenario: Filter survives a switch
- **WHEN** an Explore country is selected on the map and the locale changes from en to ar
- **THEN** the country stays selected, `html` has dir rtl, and no new request was sent
