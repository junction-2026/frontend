## ADDED Requirements

### Requirement: Public visibility switch
The Home composer SHALL show a switch (`role="switch"`, visible label, keyboard operable, `aria-checked` reflecting its state, associated with its description through `aria-describedby`) that is on by default in both Text and Social Link modes. Switching it off SHALL make the request body carry `"public": false`; leaving it on SHALL omit the `public` member. After a 201 the app navigates to `/jobs/{id}/live` for public and non-public jobs alike.

#### Scenario: Default on
- **WHEN** Home is shown
- **THEN** the switch labelled "Public" has `aria-checked="true"` and a text submission sends `{"input":{"content":"hello"}}`

#### Scenario: Switched off
- **WHEN** the user turns the switch off (by click or by Space while focused) and submits text or a link
- **THEN** the body contains `"public": false` next to `input` or `scrape`

### Requirement: Visibility hint copy
A short description under the switch SHALL state that non-public jobs are not shown in History but anyone with the link can open them. The copy SHALL NOT call such jobs private or secret.

#### Scenario: Hint present
- **WHEN** Home is shown in any supported locale
- **THEN** the description is visible and referenced by the switch's `aria-describedby`

### Requirement: Visibility switch is not persisted
The switch state SHALL reset to public after a successful submission and on every fresh visit to Home, and SHALL NOT be stored.

#### Scenario: Fresh visit
- **WHEN** the user turns the switch off and later opens Home again
- **THEN** the switch is on
