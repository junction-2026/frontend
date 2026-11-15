## MODIFIED Requirements
### Requirement: Ledger header
The ledger header SHALL be a light grey band containing only the ledger title (h3 with icon). It SHALL NOT render a pool label or any Mock-marked element. The `analysis` namespace in every locale SHALL NOT define the keys `pool` or `mock.pool`, and locale key sets stay identical. The `.ledger-head` layout (flex band, padding, bottom border) is otherwise unchanged.

#### Scenario: Header band
- **WHEN** the ledger is shown
- **THEN** its header has the light band, the title, no "Synchronous consensus pool" text and no `[data-mock]` descendant
