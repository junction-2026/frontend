## 1. Silk veil module
- [x] 1.1 `src/ui/silkVeil/shader.ts` (vertex and fragment source, palette and tuning constants)
- [x] 1.2 `src/ui/silkVeil/reveal.ts` (pure reveal scheduler)
- [x] 1.3 `src/ui/silkVeil/capability.ts` (reduced motion, low power, context creation)
- [x] 1.4 `src/ui/silkVeil/renderer.ts` (rAF loop, resize, visibility, context loss, cleanup)
## 2. Component and styles
- [x] 2.1 `ExploreVeil.tsx` canvas and fallback modes
- [x] 2.2 `explore-veil.css` rewritten: geometry, canvas, static fabric fallback; panel veil removed
## 3. Tests
- [x] 3.1 Unit tests for shader constants, reveal, capability and renderer
- [x] 3.2 Component, CSS and ExploreView mount tests
## 4. Checks
- [x] 4.1 `npm run lint`, `npm test`, `npm run build`, `scripts/validate-openspec.sh`
