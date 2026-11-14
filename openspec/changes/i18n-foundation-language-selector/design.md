## Decisions
- **Own layer, no npm dependency.** A React context holds the locale; `t(key, params)` resolves `active locale → en → key`. Plurals use `Intl.PluralRules` and `key_<category>` with `key_other` as the per-locale fallback.
- **Catalog discovery** by `import.meta.glob('./locales/*/*.ts', { eager: true })`; the namespace is the file name, so the screen tasks add `locales/<lng>/<ns>.ts` without editing a registry.
- **`errorMessage` keeps its signature.** It reads a module-level active locale that the provider updates when the locale changes, so the existing callers in other screens need no edit. Without a provider the locale is `en`, so views and tests that render without `I18nProvider` keep working.
- **Provider placement:** `App` wraps `Shell` in `I18nProvider`, so App-level tests exercise the real selector.
- **Persistence:** `localStorage['veil.locale']`; storage exceptions fall back to in-memory state.
