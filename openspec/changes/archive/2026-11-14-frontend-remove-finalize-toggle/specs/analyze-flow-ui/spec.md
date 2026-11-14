## MODIFIED Requirements

### Requirement: Advanced options panel
The `Advanced options ▾` control SHALL expand a panel listing the items of `GET /api/v1/analyzers` with `selectable: true` as checkboxes (name, category, and a `disabled` hint when `enabled` is false), all checked by default. The panel SHALL NOT offer a control to turn off the final assessment. If the analyzers request fails, the panel SHALL show the error.

#### Scenario: Panel content
- **WHEN** the panel opens and the server lists a selectable, a disabled and a non-selectable analyzer
- **THEN** the first two are listed checked (the disabled one with the hint) and the non-selectable one is not listed

#### Scenario: No final assessment toggle
- **WHEN** the panel opens
- **THEN** no Final assessment control is shown

## ADDED Requirements

### Requirement: Advanced options request body
When every selectable analyzer is checked the request SHALL omit `analyzers`, otherwise it SHALL carry the checked ids. The request SHALL omit `options`, so the server default (`finalize` true) applies, and SHALL NOT send `options.finalize: false` in any mode. If the analyzers request failed, the job SHALL be sent without `analyzers`.

#### Scenario: All analyzers checked
- **WHEN** nothing was unchecked
- **THEN** the body has no `analyzers` member

#### Scenario: Subset
- **WHEN** one of three analyzers is unchecked
- **THEN** the body has `analyzers` with the two checked ids

#### Scenario: Final assessment always requested
- **WHEN** a job is submitted in text or link mode, with or without an analyzer subset
- **THEN** the body has no `options` member

#### Scenario: Analyzers list fails
- **WHEN** `GET /api/v1/analyzers` fails
- **THEN** the panel shows the error and the next submission has no `analyzers` member

## REMOVED Requirements

### Requirement: Advanced options in the request
**Reason**: The Final assessment toggle is gone, so scenario `Finalize off` no longer applies; the OpenSpec tooling cannot drop one scenario from a MODIFIED block, so the requirement is replaced by `Advanced options request body`.
**Migration**: See `Advanced options request body`.
