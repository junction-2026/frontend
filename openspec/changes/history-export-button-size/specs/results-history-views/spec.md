## ADDED Requirements

### Requirement: History export button sizing
The History toolbar Export button SHALL keep its intrinsic `.btn-secondary` size and SHALL be aligned to the block-start of the toolbar row, never stretched to the title and lede height. The fix SHALL be scoped to the History toolbar and SHALL NOT change global `.btn-secondary` styles.

#### Scenario: Export button is not stretched
- **WHEN** the History toolbar renders the Export button next to the title and lede
- **THEN** the button has `align-self: flex-start` and keeps its padding-driven height

#### Scenario: Exporting state
- **WHEN** an export is in progress (disabled, aria-busy)
- **THEN** the button keeps the same compact size and alignment

#### Scenario: Regression coverage
- **WHEN** the `.toolbar > .btn-secondary` rule loses `align-self: flex-start`
- **THEN** the HistoryView regression test fails

#### Scenario: Direction, wrapping and state
- **WHEN** the toolbar renders in LTR or RTL, wraps at 390 px or fewer, or the button is exporting (disabled, aria-busy)
- **THEN** the button keeps its natural size and block-start alignment
