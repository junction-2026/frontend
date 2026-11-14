## 1. Job view
- [x] 1.1 `src/job/segments.ts`: span validation and segmentation (pure)
- [x] 1.2 `src/job/api.ts`: fetch job; `src/job/useJob.ts`: 2 s polling
- [x] 1.3 `src/job/JobView.tsx` + `job.css`: text, marks, technique list, notes
- [x] 1.4 `src/App.tsx`: routing switch on `?job`

## 2. Runtime
- [x] 2.1 `/api` proxy in `vite.config.ts` and `nginx/default.conf.template`

## 3. Tests
- [x] 3.1 Segmentation unit tests; JobView tests with mocked fetch (English, non-English empty spans, timeout, pre-span, markup, emoji, overlap, invalid span, 404, polling)
