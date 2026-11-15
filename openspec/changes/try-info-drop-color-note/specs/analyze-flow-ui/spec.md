## MODIFIED Requirements
### Requirement: Explainer copy
The en `home.try.info` SHALL carry the agreed copy given in the scenario below, and the fr, de, fi, ar and ru catalogs SHALL carry faithful translations without any reference to chip color.

#### Scenario: English copy
- **WHEN** the en catalog is read
- **THEN** `home.try.info` reads exactly: "These try-out statements were collected from the web, and their expected results were predicted by the Grok LLM. Pick one and read the statement yourself first. Then check the result the LLM predicted and decide whether you agree. Next, run the analysis and see our engine's result. Did you agree with the LLM? If not, did our engine confirm your own judgement?"

#### Scenario: No locale keeps the parenthetical
- **WHEN** any locale catalog is read
- **THEN** `home.try.info` contains no "("
