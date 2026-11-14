## MODIFIED Requirements

### Requirement: Ask screen
`/ask` SHALL render the chat layout (context bar, thread, suggestions, composer) with an `<h1>` starting "Ask Stiriri". The context bar, the thread (including canned answers), the suggestions and the composer SHALL each be wrapped in `Mock` labelled "No backend for Ask Stiriri". Sending a non-blank message SHALL append a user bubble to the thread locally and clear the input; clicking a suggestion SHALL fill the input. The screen SHALL NOT send any network request.

#### Scenario: Send appends a local bubble
- **WHEN** the user types "my question" and submits
- **THEN** a user bubble "my question" appears in the marked thread, the input is empty and no fetch call was made by the screen

#### Scenario: Blank message
- **WHEN** the user submits a blank input
- **THEN** no bubble is added

#### Scenario: Brand kept in every locale
- **WHEN** the locale is `de`, `fr`, `fi` or `ar`
- **THEN** the Ask `<h1>` and mock label contain "Stiriri" verbatim (inflected only by grammar, e.g. fi "Ask Stiririllä")
