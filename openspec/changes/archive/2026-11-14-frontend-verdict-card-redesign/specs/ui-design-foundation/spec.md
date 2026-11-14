## ADDED Requirements

### Requirement: Verdict tokens
`src/styles/tokens.css` SHALL define per verdict state a background, border, heading, text, pill background and pill text token (`--verdict-<state>-bg|border|heading|text|pill-bg|pill-text`) and `--radius-verdict` of 30px. Heading, text and pill text SHALL reach at least 4.5:1 contrast on their background, and a unit test computes this from the token values.

#### Scenario: Contrast
- **WHEN** the test reads the token values for the three states
- **THEN** heading, text and pill text each reach at least 4.5:1 on their background

#### Scenario: Detected values
- **WHEN** the verdict state is detected
- **THEN** bg is #E5F9EC, border #A4EFC5, heading #103F30, text #437562, pill bg #D3F0DF and pill text #276A4C

#### Scenario: Uncertain values
- **WHEN** the verdict state is uncertain
- **THEN** bg is #FFF1DC, border #F5D59E, heading #4A2F00, text #80602A, pill bg #FBE3BC and pill text #7A4A00

#### Scenario: Not detected values
- **WHEN** the verdict state is not_detected
- **THEN** bg is #E8F2FF, border #B9D5FA, heading #0F2D55, text #47678F, pill bg #D5E6FD and pill text #1E4F8C
