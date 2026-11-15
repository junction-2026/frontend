## ADDED Requirements

### Requirement: History backdrop mounting
`HistoryView` SHALL render `<ArchiveBackground />` as the sibling directly preceding its `<section className="view">` (not inside `.view`, whose `rise` transform would capture the fixed layer) in every state (loading, loaded, empty, error). No other view SHALL render `.archive-bg`, and the requirement that `HistoryView` renders no `.ambient-bg` stays satisfied.

#### Scenario: All states
- **WHEN** `HistoryView` is rendered while loading, loaded, empty and in error
- **THEN** exactly one `.archive-bg` exists and it directly precedes `section.view`

#### Scenario: Other views
- **WHEN** `HomeView` or `ExploreView` is rendered
- **THEN** no `.archive-bg` exists
