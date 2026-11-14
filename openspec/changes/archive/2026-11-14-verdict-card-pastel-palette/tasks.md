## 1. Tokens
- [x] 1.1 Replace the verdict-* colour tokens in tokens.css and add `--fw-extrabold: 800`.

## 2. Card CSS
- [x] 2.1 `.verdict` border 2px; pill border 1px and weight 600; `.verdict h2` weight `var(--fw-extrabold)`.
- [x] 2.2 `.verdict-dot` glow and pulse keyframes; `animation: none` under reduced motion.

## 3. Tests
- [x] 3.1 verdictTokens.test.ts: exact values, contrast on bg and pill-bg, 2px border, h2 weight 800 and the 600 ceiling elsewhere, dot duration, reduced-motion rule.
- [x] 3.2 ResultsView.test.tsx: data-verdict follows the verdict at confidence 0.05 and 0.95; cards and copy unchanged.

## 4. Verify
- [x] 4.1 npm test, lint, typecheck, build, scripts/validate-openspec.sh.
