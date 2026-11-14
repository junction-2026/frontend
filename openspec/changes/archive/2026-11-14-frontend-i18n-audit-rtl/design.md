## Decisions
- A key missing in every locale (a programming error) renders "…" and warns in development; the spec forbids returning the key. Missing and empty are treated alike, so an empty catalog value falls back to `en`.
- The warning is deduplicated per `locale:key` and gated on `import.meta.env.DEV`, so production is silent and tests do not flood the console.
- The completeness test compares *base keys* (a plural suffix `_zero|_one|_two|_few|_many|_other` is stripped) so Arabic may carry six forms and en two; every plural group must contain `_other`. Placeholders of each form are compared with the en form of the same category, else with en `_other`.
- The test discovers namespaces with the same `import.meta.glob` as the runtime, so a namespace added by another task is covered without editing the test. A locale directory missing a namespace file fails it.
- Hardcoded-string enforcement is a vitest test that parses the owned `.tsx` files with the TypeScript compiler API (already a devDependency) and reports JSX text and string-valued `placeholder|title|aria-label|alt|aria-description|label` attributes that contain letters. No new dependency.
- Interpolated values that are source text (claims, topics, codes, percentages) are isolated with `<bdi>` through a small `rich(text, nodes)` helper that splits the translated string on `{name}` placeholders; the sentence itself stays translated.
- Language switching already keeps state because the provider changes only context; a test pins it.
