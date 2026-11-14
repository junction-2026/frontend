## ADDED Requirements

### Requirement: Logical properties and mirrored glyphs
The stylesheets in `src/styles`, `src/history` and `src/secondary` SHALL use logical properties (`margin-inline-*`, `padding-inline-*`, `inset-inline-*`, `border-inline-*`, `text-align: start|end`) instead of physical left/right ones, and directional glyphs (chevrons, arrows, the submit arrow, the search glyph) SHALL be mirrored under `[dir=rtl]` with the `mirror-rtl` class. No colour, typography or spacing value SHALL change.

#### Scenario: Arabic shell
- **WHEN** the locale is ar
- **THEN** html has dir rtl and the navigation, buttons and expandable sections are mirrored with the same colours, type and spacing as in en
