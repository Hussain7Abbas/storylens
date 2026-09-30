# Phase 5 — Pull and cache freshness

[Global tracker](main.md) · **Status: In review (implemented 2026-09-30)** · **Estimate: 5 points** · **Depends on: 3, 4** · **Ships in: the offline-first release (branch `feature/offline-v2`)**

## Goal

Keep the snapshot fresh without ever touching local intent. Pulls replace server data in one transaction under the runner's lock. They run for downloaded (pinned) novels on every sync, for cached novels when the page or popup uses them, and for the catalogue and lookups on a timer. Page highlights follow the view and update after a refresh.

**Closes:** P1 (pull side), P2, P3, P4, P5, P6, P7 (every page, with phase 1's helper), P8 (biases in novel pulls), P9, P10 (pull after side effects), P12, S2 (pulls on the alarm, with phase 4), S3, U2 (page side), U4 (pull side), U5 (the download-removal guard).

## Tasks

### 5.1 Pull units (`sync/pull.ts`)

- [x] `pullCatalogue()` fetches `GET /novels` in both languages (`Accept-Language` `ar` and `en`), every page, merges by ID and calls `replaceCatalogue`. It prunes deleted novels; downloaded novels missing from the result are marked `removedOnServer`.
- [x] `pullLookups()` fetches categories and natures (every page) and calls `replaceLookups`. It prunes, and it is **never** skipped because of pending lookup mutations: the projection keeps local intent (fixes P3).
- [x] `pullNovel(novelId)`:
  1. `GET /novels/:id`. A 404 means `markRemovedOnServer` (its pending updates become `conflict(deleted)`), and the pull stops.
  2. Keywords in both languages, every page.
  3. Replacements, every page.
  4. Biases (`getWebsiteNovelBiases({ novelId })`).
  5. `replaceNovelSnapshot` in **one** transaction, which also refreshes the novel's row in `novels`.
  6. `markPulled`.
- [x] Every request has a 20 s timeout and the run deadline's signal, and sets `Accept-Language` explicitly per language. Nothing reads `localStorage`, which does not exist in the worker (S3). A failed unit records `lastPullError`, keeps its old `lastPulledAt` and does not stop other units.
- [x] The per-novel category and nature requests are gone (P12); lookups are their own unit.

### 5.2 Timing (`pullDueUnits`)

- [x] Catalogue: stale after 30 minutes; pulled on runs with `reason: "popup-open"` or **Sync now**.
- [x] Lookups: stale after 10 minutes; pulled on every run, always on **Sync now**.
- [x] Pinned novels: stale after 10 minutes; pulled on every run, every pinned novel on **Sync now**.
- [x] Cached novels: pulled only when requested with `requestNovelRefresh(novelId)` and older than 10 minutes. The request is stored as `novelSync.refreshRequestedAt` and kicks the runner.
- [x] Novels marked due by push outcomes (replacement chain rewrite, `parent-missing`) are pulled in the same run.
- [x] Popup opens no longer pull everything: fresh units are skipped (U4).
- [x] Once phase 9 lands, every refresh of a unit that has a cursor is a delta pull; these timings stay the same.

### 5.3 Page data through views

- [x] Rewrite `load-novel-content-data.ts` (still background only):
  1. Find the novel by slug in the catalogue view. If it is missing and the browser is online, pull the catalogue first (under the lock, with a 10 s wait limit).
  2. With no snapshot for the novel: pull it now (online, same limit) or return `undefined` (offline).
  3. With a stale snapshot: return the view immediately and call `requestNovelRefresh` (stale-while-revalidate, fixes P4).
  4. Build `NovelContentData` from `getNovelView(novelId)`, filtering keywords with `namedIn(…, language)`. Both languages are stored, so a language switch needs no network (fixes P5).
- [x] Delete `writeNovelContentCache`, `replaceKeywordsForNovel`, `replaceReplacementsForNovel`, `replaceBiasesForNovel` and the `isDirty` and pending-delete guessing (P1, P2).
- [x] Keep `getOfflineNovelData` and `getNovelContentData` as thin wrappers over the same function.

### 5.4 Highlights after a refresh

- [x] Persist `tabNovels` (tab → detected novel) in `browser.storage.session`, so it survives worker restarts. It is session storage, cleared when the browser closes. Remove the entry on `tabs.onRemoved`.
- [x] After a pull or push outcome changes a novel (per-novel change counter in `syncMeta`), send `refreshContent` to each tab showing that novel, at most once every 2 seconds per tab. The content script ignores refreshes for a different novel (it compares slugs).

### 5.5 Downloads through the runner

- [x] Message `downloadNovel(novelId)`: `pinNovel` plus `pullNovel` under the lock. It returns `{ ok }` or `{ error }`; offline it answers `{ error: "offline" }`.
- [x] Message `removeDownload(novelId, { discardPending })`:
  - With unresolved mutations for the novel and `discardPending` not set, it answers `{ blocked: count }` (phase 6 asks the reader).
  - Otherwise it discards those mutations with their dependants, unpins, and deletes the novel's snapshot rows. The next visit caches the novel again if needed.
- [x] Remove `download.ts`'s direct writes; the popup no longer writes the snapshot.

### 5.6 Server-side changes not sent by this client

- [x] Novel context saved by `ensureNovelContext` (`lib/desktop-client/novel-context.ts`), novel create and edit, slug additions and chapter-bias saves stay online-only calls. After success they call `requestNovelRefresh(novelId)`, or a catalogue refresh, instead of writing Dexie directly. Snapshot writes stay inside the runner (architecture invariant 2).

## Tests

| # | Scenario | Expected |
| --- | --- | --- |
| 1 | Pull a novel while pending creates, updates and deletes exist for keywords, aliases, versions and replacements | Snapshot equals the server; the view still shows every local change (replaces R-7, R-8, R-9; P1) |
| 2 | Pull while another Dexie instance enqueues | Nothing lost (P2) |
| 3 | A rejected mutation on novel N and a pending category create | N, the other novels and the lookups are all pulled (replaces R-5; P3) |
| 4 | Cached novel older than 10 minutes, page load | Data returned at once from local; refresh queued; after the pull, the tab gets `refreshContent` (P4, U2) |
| 5 | Cached novel, UI language switched offline | New-language names returned without network (P5) |
| 6 | Category deleted on the server; local pending keyword create uses it | Category gone after the pull; the create later becomes `conflict(parent-missing)` (P6) |
| 7 | Novel deleted on the server | `removedOnServer`; its pending updates are `conflict(deleted)`; the download is removable (P9) |
| 8 | Replacement create that makes the server rewrite a chain | Novel marked due and pulled in the same run; snapshot matches the server (P10) |
| 9 | **Sync now** with 5 pinned novels | One lookups pull, 5 novel pulls, no per-novel lookup requests (P12) |
| 10 | Popup opened twice within a minute | No pulls the second time (U4) |
| 11 | One novel pull answers 500 | The other units are pulled; the error is recorded; `lastPulledAt` unchanged for that novel |
| 12 | Offline page load for a pinned novel | Served from the view; no network attempts |
| 13 | `downloadNovel` offline, and online | Refused, and pinned plus pulled in one run |
| 14 | `removeDownload` with pending mutations | `{ blocked: n }`; with `discardPending`, mutations and dependants discarded and rows removed |
| 15 | Worker restart, then a pull | Affected tabs still get `refreshContent` (`storage.session` map) |

## Exit criteria

- [x] Every test above passes; typecheck passes in all five submodules.
- [x] Pattern scan:
  - no snapshot writes outside `snapshot.ts`, and none of its callers outside `sync/`;
  - `writeNovelContentCache` and `replaceKeywordsForNovel` are gone;
  - no Dexie import in `src/entrypoints/content`.
- [x] A full-pull time and bytes measurement for a 2,000-keyword novel is logged below; phase 9 compares its delta refresh with it. — **Done (2026-09-30):** see the measurement row in the log.

## Risks

| Risk | Mitigation |
| --- | --- |
| Full pulls get expensive for heavy readers | [Phase 9](09-delta-sync.md) turns most refreshes into delta pulls; staleness windows, and alarm pulls limited to pinned novels, cap the rest |
| The page waits too long for a first pull | 10 s limit, then the page renders without data and refreshes when the pull finishes |
| A slug matches several catalogue novels | Keep `findNovelBySlug` behaviour; unchanged here |

## Implementation notes (2026-09-30)

- Tab refresh uses the novels touched by a run (sent outcomes and pulled units) rather than a per-novel change counter read back from `syncMeta`; `novelCounters` is still bumped for view caching. Views are not cached in memory yet (projection is fast enough, see phase 3).
- Page data waits up to 10 s for a first pull by polling `novelSync.lastPulledAt` (or `catalogPulledAt`) while a `kickSync("page")` runs under the lock; `syncKick` gained `forceCatalogue` for a slug missing from the catalogue and for the catalogue refresh after novel and slug changes.
- `removeDownload` deletes snapshot rows through `snapshot.removeNovelSnapshot` inside the sync lock, so snapshot writes stay in `snapshot.ts`.
- A downloaded novel removed on the server keeps its catalogue row until the reader removes the download.
- Tests 2, 3 and 6 are automated as listed in `test/offline/sync/resolution.test.ts` › pull scenarios.

## Verification log

| Date | Check | Result | Evidence |
| --- | --- | --- | --- |
| 2026-09-30 | Tests 1, 4, 5, 7–15 | Pass | `test/offline/sync/pull.test.ts` |
| 2026-09-30 | Every-page pulls of 1,100 keywords in two languages | Pass | `pull.test.ts` › fetch every page |
| 2026-09-30 | Pattern scan: snapshot writes, old cache writers, content-script Dexie imports | Clean (only `snapshot.ts`; old functions gone; no Dexie in `.output/chrome-mv3/content-scripts/content.js`) | `rg` scans; `bun run build` |
| 2026-09-30 | Full pull of a 2,000-keyword novel (2 languages × 4 pages of 500, novel, replacements, biases) against a local backend and Postgres | About 6.1 MB and 0.35 s in total (keyword pages 760 KB each, 30–80 ms) | `curl` against the release backend on the test database |
| 2026-09-30 | Tests 2, 3 and 6 | Pass | `test/offline/sync/resolution.test.ts` |
