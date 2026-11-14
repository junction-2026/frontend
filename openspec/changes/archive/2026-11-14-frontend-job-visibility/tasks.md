## 1. API types
- [x] 1.1 `public?: boolean` on both `CreateJobBody` variants and on `Job`

## 2. Composer
- [x] 2.1 Switch (role=switch, aria-checked, aria-describedby hint) in HomeView, default on, body gets `public: false` only when off
- [x] 2.2 Reset to public after a successful submission; not persisted

## 3. i18n
- [x] 3.1 `compose.ts` namespace in en, fr, ar, de, fi

## 4. Tests
- [x] 4.1 HomeView: default on, toggle, keyboard, request body for text and scrape in both states, reset on remount
- [x] 4.2 Locale completeness covers the new namespace (existing glob-based test)
