## Decisions

- **Fonts via @fontsource**: no hand-managed woff2 files; the packages ship the OFL licence and `font-display: swap`. Newsreader uses the variable `opsz` build (family `Newsreader Variable`, weights 200–800, normal + italic), which covers 500/600.
- **Router**: ~40 lines on `history.pushState` + a `popstate`/custom event; no dependency. Routes are a small ordered table of regexes. `Link` is a real `<a href>` that intercepts plain left clicks only.
- **Events client resync**: `job.snapshot` is always applied (its `seq` is the job's last seq, so it may equal the last seen one after a reconnect); every other event is dropped when `seq <= last`.
- **Result type**: `{ok:true,data} | {ok:false,error}`; one `request()` helper does fetch, JSON parsing and envelope mapping so each endpoint function is a one-liner.
- **JobView** stays the (existing) job result view and is mounted by the Results stub at `/jobs/:id`; the leaf task replaces it.
