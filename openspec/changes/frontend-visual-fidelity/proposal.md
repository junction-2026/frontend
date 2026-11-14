## Why
Visual fidelity correction (junction-2026/project#61, child #90): the UI used Plus Jakarta Sans and a serif family, warm greys, a gradient page background, heavy weights and a heavy progress ring. The reference design uses Inter only, neutral surfaces and a light ring.

## What Changes
- Inter (variable, normal and italic) replaces Plus Jakarta Sans and Newsreader as the only text family.
- Neutral surface, line, ink, muted and progress tokens; solid page background; weight tokens with a ceiling of 600.
- Quote and excerpt text uses Inter italic instead of the serif.
- Analyzing view: 56px light progress ring and one centered 780px column.
- No shared contract change, no behaviour, copy, route or progress-logic change. The Home composer, advanced options and Public switch are untouched.

## Impact
Specs: ui-design-foundation, analyze-flow-ui. Typography-only edits in job-result-view, results-history-views and secondary-screens stylesheets; their behaviour requirements are unchanged.
