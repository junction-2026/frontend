## MODIFIED Requirements

### Requirement: Live view state
The live view at `/jobs/:id/live` SHALL subscribe to job events, build state from `job.snapshot` and later events, and unsubscribe on unmount. The quote banner SHALL show `input.content` (or the scrape URL while `input` is null) as plain text, the job id and the client-side elapsed time. The banner SHALL NOT show a cluster label or data-retention claim in any locale and SHALL render its footer row only when it has content.

#### Scenario: Scrape job before input
- **WHEN** the snapshot has `input: null` and `scrape.url: https://x.org/a`
- **THEN** the banner shows `https://x.org/a`

#### Scenario: Content is text
- **WHEN** the content is `<img src=x onerror=alert(1)>`
- **THEN** it is shown literally and no element is created from it

#### Scenario: No cluster or retention labels
- **WHEN** the live view renders for any job in any supported locale
- **THEN** no cluster text (e.g. `Cluster: eu-west-alpha-2`) and no retention text (e.g. `Zero-retention ephemeral pipeline`) is present and the banner contains no empty footer row

