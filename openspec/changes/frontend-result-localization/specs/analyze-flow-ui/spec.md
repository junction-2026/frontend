## MODIFIED Requirements

### Requirement: Active Worker Ledger rows
The `Active Worker Ledger` SHALL list one row per PlanEntry in plan order. A row title SHALL be the catalog title of the Activity `key`, or before the analyzer started the catalog name of its id; the Activity `text` or PlanEntry `name` for a key or id the catalog lacks. The detail SHALL be the Activity detail localized from `params`, or for a settled row the availability note, or the preview counts when a preview exists, all as plain text. The duration SHALL come from `duration_ms`.

#### Scenario: Title before and after start
- **WHEN** a plan entry `news_search` has not started and then `analyzer.started` carries the Activity key `news_search`
- **THEN** its row title is first the catalog name of `news_search` and then the catalog title of the key

#### Scenario: Detail from params
- **WHEN** the locale is `de` and the Activity is `news_search` with `params.languages: ["de", "en"]`
- **THEN** the detail is the German phrase naming Deutsch and Englisch, not the English API detail

### Requirement: Analyzing enum labels and API strings
Job status in the banner pill and analyzer status in a ledger pill SHALL map the enum value to a catalog key; an unknown value SHALL render as the raw value. Activity `text` and `detail` SHALL be localized from `key` and `params` and kept as sent only for a key the catalog lacks. Other API strings (unknown analyzer names, error `code` and `message`, the preview `label` and source language) SHALL be shown unchanged, not passed through `t()`. The submitted content SHALL be in `<bdi dir="auto">`.

#### Scenario: Unknown status
- **WHEN** the job status is `weird_status`
- **THEN** the banner pill shows `weird_status`

#### Scenario: Known activity key
- **WHEN** an activity with key `translation` arrives in English while the locale is `de`
- **THEN** the ledger row shows the German catalog title

#### Scenario: API text
- **WHEN** an activity with key `bot_detection` and text "Bot detection" arrives
- **THEN** the ledger row shows that text unchanged
