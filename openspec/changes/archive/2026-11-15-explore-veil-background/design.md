## Decisions
- Two animations cannot both drive `transform` on one element, so each panel is split: the panel element runs the reveal (translate + opacity, 19s/27s/23s) and its `::before` carries the cloth gradient and the sway (9s/12s/15s). Different cycle lengths make the parting irregular.
- RTL: the parting direction is multiplied by a `--flip` custom property (1, or -1 under `[dir='rtl']`); panels sit with logical `inset-inline-*` offsets.
- The veil is a sibling before `.view` (not inside it) because `.view`'s `rise` transform would become the containing block of a fixed layer.
- No JS timers: browsers throttle CSS animation in hidden tabs on their own.
