## Decisions
- **Sibling, not child.** `.view` runs the `rise` transform animation, which makes it the containing block of `position: fixed` descendants while it runs. The layer is a fragment sibling placed before the section.
- **Stacking.** Layer `z-index: 0`; `.ambient-bg + .view` gets `position: relative; z-index: 1` (a sibling selector, so the HomeView markup and classes stay as they are); the topbar keeps `z-index: 40`.
- **No overflow.** The fixed container clips its blobs (`overflow: hidden`), so blobs placed past the viewport edges never add a horizontal scrollbar. Blobs have `max-width: 90vw` so they shrink on narrow viewports.
- **Only transform animates.** Blur and opacity are static, so the compositor animates a pre-blurred layer (`will-change: transform`).
- **Palette.** lavender #C4B5FD, sky #93C5FD, mint #86EFAC, peach #FDBA9A, pink #F9A8D4; sky is used twice.
- **Reduced motion.** `animation: none`; blobs stay at their static position and opacity.
