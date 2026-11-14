## 1. Locale
- [x] 1.1 Declare `ru` in `src/i18n/locales.ts`

## 2. Catalogs
- [x] 2.1 `locales/ru/<ns>.ts` for every namespace of en, every key, same placeholders
- [x] 2.2 `_one/_few/_many/_other` for every en plural group
- [x] 2.3 Techniques: 21 ids with name and definition from the backend glossary ru entries, `why_span` and `why_no_span`
- [x] 2.4 Brand "VEIL" unchanged in Latin caps

## 3. Tests
- [x] 3.1 completeness.test.ts, locales.dom.test.tsx, history/format.test.ts, secondary.test.tsx, localization.test.tsx include ru
- [x] 3.2 i18n.test.tsx: selector label, html lang/dir, detection, stored ru wins, ru plurals, ru formatters, brand
- [x] 3.3 `language=ru` localization request

## 4. Layout check
- [x] 4.1 Shell nav, Home, History and Results at 360px and 1280px without horizontal overflow (checked in a browser); ru strings shortened where needed
