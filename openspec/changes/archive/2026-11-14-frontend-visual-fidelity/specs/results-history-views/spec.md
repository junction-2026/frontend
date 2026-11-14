## MODIFIED Requirements

### Requirement: Verdict headline typography
The headline SHALL use Inter, weight 600, `font-size: clamp(2rem, 1.25rem + 2.6vw, 3.25rem)`, line-height 1.08, letter-spacing -0.02em and `overflow-wrap: anywhere`, and SHALL be the most prominent element of the card.

#### Scenario: Headline size
- **WHEN** the card is rendered
- **THEN** the h2 is at least 32px and at most about 52px
