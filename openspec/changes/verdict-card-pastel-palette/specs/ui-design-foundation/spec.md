## MODIFIED Requirements

### Requirement: Verdict tokens
`src/styles/tokens.css` SHALL define per verdict state a background, border, heading, text, pill background and pill text token (`--verdict-<state>-bg|border|heading|text|pill-bg|pill-text`) and `--radius-verdict` of 30px. Heading, text and pill text SHALL reach at least 4.5:1 contrast on the background and on the pill background, and a unit test computes this from the token values.

#### Scenario: Contrast
- **WHEN** the test reads the token values for the three states
- **THEN** heading, text and pill text each reach at least 4.5:1 on bg and on pill bg

#### Scenario: Detected values
- **WHEN** the verdict state is detected
- **THEN** bg is #FDE8E8, border #F5B8B8, heading, text and pill text #8B2525, and pill bg #FDE8E8

#### Scenario: Uncertain values
- **WHEN** the verdict state is uncertain
- **THEN** bg is #FFF1DC, border #F2D49B, heading, text and pill text #8A5A18, and pill bg #FFF1DC

#### Scenario: Not detected values
- **WHEN** the verdict state is not_detected
- **THEN** bg is #E5F7EC, border #A8E4BF, heading, text and pill text #246B45, and pill bg #E5F7EC

## ADDED Requirements

### Requirement: Verdict headline weight token
`src/styles/tokens.css` SHALL define `--fw-extrabold: 800`. It SHALL be used only by the Results verdict headline and is the sole permitted exception to any font-weight ceiling in the type scale, including a 600 ceiling.

#### Scenario: Token value
- **WHEN** the test reads tokens.css
- **THEN** `--fw-extrabold` is 800
