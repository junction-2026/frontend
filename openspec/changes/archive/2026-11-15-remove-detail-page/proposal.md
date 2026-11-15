## Why
The separate `/jobs/:id/detail` page repeats the detailed region of `/jobs/:id` (same metrics bar and JobView) and adds only a "Final assessment" section the verdict card already shows. The "Open detailed analysis page" link leads to it. Parent: junction-2026/project#90.

## What Changes
- Remove the `detail` route, `DetailView` and the "Open detailed analysis page" link from `.card.detailed-summary`.
- Redirect old `/jobs/<id>/detail[/]` URLs (query kept) to `/jobs/<id>` with `history.replaceState` on load, `navigate()` and `popstate`.
- Remove the `results.open_detail` and `results.detail.{back,label,title,lede,final}` keys from en, fr, ar, de, fi, ru, and the CSS only `DetailView` used.
- Update the results-history-views, job-result-view and ui-design-foundation specs.

## Impact
Frontend only (UI and route). No shared-spec change; pin shared-specs@bd681f5668c056b0cfa7b45a5e413233aec386bc (none needed). The nginx/link-preview behaviour for `/jobs/{id}/detail` is backend-side and untouched.
