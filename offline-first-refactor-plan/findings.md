# Offline pool review — findings

[Global tracker](main.md) · [Target architecture](architecture.md)

Review of the extension's offline pool (the pending-operation queue, the Dexie cache and the sync engine) and the backend routes it writes to. Line numbers refer to extension `21f7922` and backend `0fd2528` (release 3.2.1) and will drift once implementation starts.

## How the current system works

- **Local data:** Dexie database `storylens-offline` (`apps/extension/src/lib/offline/db.ts`) holds the novel catalogue, downloaded novels, keywords, aliases, versions, replacements, categories, natures and website chapter biases. The same tables hold server rows, rows edited locally (`isDirty`) and rows created locally (`temp-<uuid>` IDs).
- **The pool:** one `browser.storage.local` value, `storylens-sync-state`, holds `pendingOps`, `lastSyncAt` and `downloadedNovelIds` (`sync-storage.ts`). Every change reads the whole value, edits it and writes it back.
- **Writes:** the React mutation hooks (`hooks.ts`) write the local row first. Online, the popup then calls the API itself and queues an operation only if that call fails. Offline, they queue the operation straight away.
- **Sync:** the background worker pushes queued operations on a 5-minute alarm and pushes and pulls on popup open (`triggerFullSync`) and on the navbar Sync button (`sync-engine.ts`, `background/index.ts`). A created row's server ID is written into later queued operations (`replacePendingEntityId`). After five failures an operation is `failed`, and only a manual sync retries it.
- **Refresh:** a pull deletes a novel's rows and writes the server's rows back, keeping dirty root keywords and dropping rows with a queued delete. It skips any novel with unresolved operations, and it skips every novel while a category or nature operation is unresolved.

## Root causes

Most bugs below come from six design choices. The refactor removes them instead of patching each symptom.

1. **Two write paths.** Online writes are sent from the popup and queued only after they fail. They are not durable, not ordered with queued writes, and not ID-mapped.
2. **An unlocked read-modify-write pool.** A single `storage.local` blob is shared by the popup, the launcher iframe and the background worker without atomicity.
3. **Temporary IDs.** `temp-…` IDs need mapping in every table and payload. The mapping misses rows the server creates itself (the base version) and every row created on the online path.
4. **Server state mixed with local intent in one table.** Refreshes must guess which rows to keep (`isDirty`, pending deletes). The guesses are wrong for aliases and versions. They also force refreshes to be skipped, which leads to deadlocks.
5. **No error taxonomy, no concurrency control, no conflict model.** Every error is "retry up to five times, then stop forever". Updates are blind full-field PUTs, so stale edits overwrite newer server data.
6. **Queued writes without an owner.** Nothing ties an operation to the account or the permissions that created it.

## Evidence

Throwaway reproduction tests ran in the session scratchpad against the real modules (not committed; phases 3–5 restate each scenario as a permanent test against the new engine). Dexie scenarios used the real `db.ts` on `fake-indexeddb`. The HTTP layer was replaced by an Axios adapter that mirrors the API's rules: path IDs must be UUIDs (422) and unknown rows are 404.

| # | Scenario | Observed |
| --- | --- | --- |
| R-1 | Two `addPendingOp` calls at once, as when two extraction rows are saved offline | 1 of 2 operations kept |
| R-2 | `addPendingOp` while `syncPendingOperations()` runs (13 start offsets, 0–12 ms) | The user's operation was lost at offsets 0, 1, 2, 3 and 5 ms |
| R-3 | Offline keyword create, then an edit of its base version | 5 × `PUT /keyword-versions/temp-v0` → 422; operation `failed` for good |
| R-4 | Queued alias delete; server answers 404 (already deleted) | `failed` after 5 runs instead of succeeding |
| R-5 | One exhausted category operation and two downloaded novels; `fullSync()` | 0 novels pulled, 0 GET requests |
| R-6 | Automatic push waiting on a hung request; the reader presses Sync (`fullSync(true)`) | Manual sync still pending after 300 ms (it joined the hung run); the exhausted operation was not retried |
| R-7 | Downloaded novel with a queued offline alias create; the novel is written again (`writeNovelOfflineBundle`) | The queued alias disappears locally |
| R-8 | Alias deleted offline (delete queued); novel written again | The deleted alias is back |
| R-9 | Alias renamed offline (update queued); novel written again | The name reverts to the server's |
| R-10 | Keyword created on the online path (saved with `isDirty: false`, request in flight); novel written again | The keyword row is deleted |
| R-11 | Chapter bias saved for site A while the novel has biases for A and B | B's bias is deleted locally |
| R-12 | `replaceKeywordId` after an offline keyword create is pushed | The base version keeps the ID `temp-v0` |
| R-13 | Backend Elysia 1.4.28: POST with extra body fields; PUT with a `temp-…` path ID | Extra fields silently stripped (200); temp ID rejected with 422 |
| — | Existing extension tests (`bun test` in `apps/extension`) | 45/45 pass: they mock the database, so none of the above is caught |

Mechanisms marked "Inspection" in the tables below were traced through the code but not executed.

## Findings

Severity: **Critical** means data loss or a permanently stuck state in a common flow. **High** means wrong data or a stuck state in a realistic edge case. **Medium** means wrong behavior with a workaround or limited blast radius. **Low** means inefficiency or hygiene.

### Q — Pool storage and concurrency

| ID | Severity | Finding | Where | Evidence | Fixed in |
| --- | --- | --- | --- | --- | --- |
| Q1 | Critical | The pool is one `storage.local` value changed by unlocked read-modify-write from the popup, the launcher iframe and the background worker. Concurrent writes overwrite each other: queued user edits vanish, and so can `downloadedNovelIds` changes. | `sync-storage.ts:9-114`; writers `hooks.ts:527-547`, `sync-engine.ts:117-149,169,207,230,246,277,304` | R-1, R-2 | 3 |
| Q2 | High | `syncing` is written before the request and has no lease. `getPendingOps()` hides `syncing` operations, so pending deletes, entity badges and refresh guards ignore in-flight (or interrupted) writes. | `sync-storage.ts:35-38,123-148`; `sync-engine.ts:118` | Inspection | 4 |
| Q3 | Medium | De-duplication is per JavaScript context and per function (`pendingSync`, `activeFullSync`). The popup's direct writes run outside it. `fullSync(true)` joins a running automatic push and silently drops `retryFailed`. | `sync-engine.ts:349-359,470-478` | R-6 | 4 |

### W — Write path

| ID | Severity | Finding | Where | Evidence | Fixed in |
| --- | --- | --- | --- | --- | --- |
| W1 | Critical | Online writes are sent from the popup or iframe (`runBackgroundSync`) and queued only in `catch`. Extension popups close on blur. If the page closes or navigates before the response, nothing is queued. The local temp row (`isDirty: false`) is deleted by the next refresh, and updates or deletes are silently reverted by the next pull. | `hooks.ts:227-238`, e.g. `665, 690-716, 768-800, 814-825` | R-10 + inspection | 3, 4, 6 |
| W2 | High | Two sources of truth. For novels that are not downloaded, online lists read the server (`useNovelKeywords`, replacing cards) while writes go to IndexedDB. Queued writes never appear in those lists, and page highlights read the local cache instead. | `hooks/use-novel-keywords.ts:17-41`; `replacing-cards.tsx:41-71` | Inspection | 6 |
| W3 | High | An edit made while an online create is still in flight queues an operation on the temp ID. Nothing maps it later, so it fails with 422 forever. `replacement` updates do not check `isTempId` at all. Alias and version creates under an in-flight keyword do the same, and the extraction view saves rows back to back. A late `saveKeyword(updated)` can also bring back a ghost temp row next to the server row. | `hooks.ts:768, 791-799, 1408, 695-704`; `extraction-view.tsx:327-388` | Inspection (mechanism shown by R-3/R-13) | 3, 4 |
| W4 | Medium | The keyword form always sends two writes (the keyword and its base version), and every form sends full field sets. Unchanged fields overwrite newer server values, and each save doubles the pool entries. | `coloring-form.tsx:224-242`, `541-548`, `889-900` | Inspection | 6 |
| W5 | Medium | Fields cannot be cleared. Forms send `description \|\| undefined`, hooks treat `undefined` as "keep", and the API ignores `undefined` (the version and alias PUT schemas do not accept `null` descriptions). | `coloring-form.tsx:213,236,527,543,871,890`; `hooks.ts:964,1192`; backend `keyword-versions.ts:205-211`, `keyword-aliases.ts:164-172` | Inspection | 2, 6 |
| W6 | Medium | Creating a version offline closes the previous version locally but never reverts that if the server refuses. Readers without a detected chapter create a local version at chapter 0 (a duplicate of the base version), while the server requires `currentChapter` and a start after the latest version, so the write fails with 400 forever. | `hooks.ts:1073-1115`; backend `keyword-versions.ts:94-112` | Inspection | 3, 6 |
| W7 | Low | `ensureCatalogNovelCached` reads a catalogue row and writes it back unchanged, so it does nothing. | `hooks.ts:583-588` | Inspection | 6 |

### M — Temporary ID mapping

| ID | Severity | Finding | Where | Evidence | Fixed in |
| --- | --- | --- | --- | --- | --- |
| M1 | Critical | An offline keyword create saves a temp base version, but the server creates its own base version with another ID. Only the keyword ID is mapped, so the local base version keeps `temp-…` forever. The keyword form edits the base version on every save, which queues `PUT /keyword-versions/temp-…` → 422 → `failed`. The failure then freezes the novel's refresh (P3). | `hooks.ts:669-688`; `sync-engine.ts:161-174`; `db.ts:669-717`; backend `keywords.ts:264-275` | R-3, R-12 | 2, 3, 4 |
| M2 | High | Online-path creates (every entity, including categories and natures) swap the temp row for the server row, but never map operations or rows that referenced the temp ID in the meantime. | `hooks.ts:690-716, 882-903, 1117-1138, 1338-1355, 1509-1531, 1669-1691` | Inspection | 3, 4 |
| M3 | Medium | `replaceKeywordCategoryId`/`replaceKeywordNatureId` update versions only: aliases keep temp lookup IDs, and later alias edits send them (422). `update…References` also skips aliases, so aliases show stale category and nature names and colors. | `db.ts:589-667` | Inspection | 3 |
| M4 | Low | `replacePendingEntityId` rewrites only `keywordId`, `categoryId` and `natureId`. Any new reference field (for example a queued image) would silently keep a temp ID. | `sync-storage.ts:67-86` | Inspection | 3 |

### R — Retries and errors

| ID | Severity | Finding | Where | Evidence | Fixed in |
| --- | --- | --- | --- | --- | --- |
| R1 | High | No error classification: every failure increments `retryCount`, and after 5 the operation is `failed` and no longer retried automatically. As a result a 404 on delete (already gone) counts as a failure; 401 (expired session), 426 (upgrade required), 429 and 5xx or network outages burn the budget (a 25-minute outage exhausts every operation); and 403/422 are retried pointlessly, again on every popup open (`triggerFullSync` passes `retryFailed = true`). | `sync-engine.ts:138-147, 374-386`; `background/index.ts:213-217` | R-4 | 4 |
| R2 | High | Requests have no timeout. One hung request stalls the sequential loop and, through the shared promises, every later sync until the worker dies. | `api/axios-instance.ts:26` | R-6 | 4 |
| R3 | Medium | No backoff or jitter, and `Retry-After` is ignored. Retries happen only on the alarm, a popup open or an `online` event. | `sync-engine.ts`, `background/index.ts:54-62` | Inspection | 4 |
| R4 | Medium | Dependent operations fail on their own. When a keyword create fails, its alias and version creates still run, fail with 422 (temp `keywordId`) and burn their budgets. There is no "blocked by parent" state. | `sync-engine.ts:368-397` | Inspection | 4 |
| R5 | Medium | A failed operation cannot be inspected or discarded; Sync (retry all) is the only action. Rejected operations stay forever and block refreshes (P3). | UI: `navbar.tsx:186-263` | Inspection | 7 |

### P — Pulls, refreshes and local cache integrity

| ID | Severity | Finding | Where | Evidence | Fixed in |
| --- | --- | --- | --- | --- | --- |
| P1 | High | `replaceKeywordsForNovel` keeps only dirty *root* keywords and deletes every alias and version under server keywords. Queued alias and version creates disappear, queued edits revert, and queued deletes come back: pending deletes are checked only for entity `keyword`. This happens when a novel with local edits is downloaded, and through the background content cache. | `db.ts:346-394, 444-457` | R-7, R-8, R-9 | 3, 5 |
| P2 | High | Refreshes are not atomic with local writes. "Existing" rows are read outside the transaction, so a popup write committed in between is deleted. | `db.ts:350-353, 400-406` | Inspection | 3, 5 |
| P3 | High | Refresh gating is coarse and can deadlock. Any unresolved operation skips that novel's pull, and any unresolved category or nature operation skips the lookups pull **and every novel pull**. Failed operations cannot be discarded (R5), so one rejected write freezes a novel, or every novel, for good: no remote changes, no remote deletions, no fixes. | `sync-engine.ts:487-509` | R-5 | 5 |
| P4 | High | Cached novels that are not downloaded never refresh on the page. `loadNovelContentDataForMeta` returns local data whenever any keyword or replacement is cached, so other people's edits never reach page highlights. | `load-novel-content-data.ts:61-90, 176-184` | Inspection | 5 |
| P5 | Medium | The content cache holds one language. It is fetched with the UI language only and written as the novel's whole cache. After a language switch the page finds no keywords in the new language, and never refetches when replacements exist (P4). | `load-novel-content-data.ts:117-148` | Inspection | 5 |
| P6 | Medium | Pulls only upsert the catalogue and lookups (`bulkPut`), so novels, categories and natures deleted on the server stay selectable forever. Saving with them fails with 404. | `db.ts:192-196, 577-587`; `seed-novels-catalog.ts:35`; `sync-engine.ts:345-346`; `hooks.ts:181-213` | Inspection | 5 |
| P7 | Medium | Only page 1 (500 rows) is fetched: downloads, pulls, the content cache and the slug lookup truncate large novels and catalogues silently. Pulls then delete the missing rows locally. | `download.ts:36-74`; `sync-engine.ts:423-440`; `load-novel-content-data.ts:100-138` | Inspection | 1, 5 |
| P8 | Medium | Downloaded novels never refresh their website chapter biases, which are not in the download bundle. Saving one bias replaces all of the novel's local biases. | `download.ts:76-135`; `db.ts:430-442, 794-810`; `websiteNovelBiasModal.tsx:45` | R-11 | 5 |
| P9 | Medium | A novel deleted on the server keeps its downloaded copy. `pullServerData` rebuilds it from the local row with empty server lists, and its queued operations fail forever. | `sync-engine.ts:455-467` | Inspection | 5 |
| P10 | Low | Server side effects are not mirrored locally: the replacement chain rewrite and the version auto-close. The local view drifts until a pull, which P3 may block. | backend `replacements.ts:350-380`, `keyword-versions.ts:114-120` | Inspection | 3, 5 |
| P11 | Low | Push responses store embedded `aliases`/`versions` arrays inside keyword rows (stale duplicates of the child tables). | `sync-engine.ts:176-184` | Inspection | 3 |
| P12 | Low | `pullServerData` fetches categories and natures again for every downloaded novel, on every popup open (U4). | `sync-engine.ts:441-452` | Inspection | 5 |
| P13 | High | The API HTML-escapes stored text (`sanitize` turns `<`, `>`, `"` and `'` into entities), while local rows keep the raw text and only AI prompts decode it (`decodeStoredText`). Server names with an apostrophe or quote (`D'Artagnan` is stored as `D&#x27;Artagnan`) never match page text, because terms are matched literally. A keyword created offline highlights until it syncs and is pulled back, then stops. Comparisons (duplicate checks, and any future merge) see the escaped and raw forms as different values. | backend `utils/sanitize.ts:5-12`; `lib/desktop-client/novel-context-prompt.ts:6-20`; `utils/content-processor.ts:116-135` | Inspection (traced end to end) | 2, 3 |

### C — Conflicts between devices, users and the dashboard

| ID | Severity | Finding | Where | Evidence | Fixed in |
| --- | --- | --- | --- | --- | --- |
| C1 | High | No concurrency control. Queued updates are blind full-field PUTs, so an old offline edit overwrites newer changes from another device, a moderator or the dashboard, including fields the reader never touched (W4). Nothing detects this, nothing merges, and the reader is never asked. | `sync-engine.ts:176-186, 198-209, 219-233, 253-261` | Inspection | 2, 4, 7 |
| C2 | High | Remote delete against a local update. The PUT gets 404, retries are exhausted (R1) and refresh is blocked (P3). Dashboard merges (keyword → translation, alias or version) delete the source keyword and cause the same. | backend `admin/keywords.ts:360-524` | Inspection | 4, 7 |
| C3 | Medium | Semantic conflicts at sync time look like any other error. Duplicate names, version order and "category in use" all answer 400 with only a localized message, so the client cannot offer a fix. | backend `keywords.ts:239-252`; `keyword-aliases.ts:76-81`; `replacements.ts:289-348`; `keyword-versions.ts:98-112, 240-251`; `keyword-categories.ts:229-236` | Inspection | 2, 4, 7 |
| C4 | Medium | Retried creates are not idempotent. If a POST succeeds but its response is lost (timeout, killed worker, closed popup), the retry creates a duplicate or fails forever on the unique name. | `sync-engine.ts:160-174` | Inspection | 2, 4 |
| C5 | Low | Unique-constraint races on the server (Prisma `P2002`) surface as 500, which a client must treat as transient, so it retries forever. | backend `server.ts:19-63` | Inspection | 2 |

### A — Accounts and permissions

| ID | Severity | Finding | Where | Evidence | Fixed in |
| --- | --- | --- | --- | --- | --- |
| A1 | High | The UI lets readers edit and delete entities they cannot change: `useCanMutateKeywords` only rejects guests. The server allows the creator or a moderator for keywords and replacements, and the **parent keyword's** creator for alias and version edits. Offline, such edits are accepted, fail with 403 at sync, and then block refreshes (P3). Local creates store `createdById: null`, so the UI cannot even recognise the reader's own offline rows. | `lib/auth/use-permissions.ts:8-16`; `hooks.ts:660,873,1092,1329`; backend `keywords.ts:314,391`, `keyword-aliases.ts:128,189`, `keyword-versions.ts:166,229`, `replacements.ts` PUT/DELETE | Inspection | 1, 3 |
| A2 | High | The pool is not tied to an account. Signing out or in on the website (the bridge rewrites `storylens-auth`) keeps the pool, and operations go out with the new session's token: wrong attribution, or 403 for a fresh guest. | `lib/auth/auth-service.ts:63-74`; `sync-storage.ts` | Inspection | 4 |
| A3 | Medium | A 401 on a queued write burns retries, and the reader is never asked to sign in again. | `sync-engine.ts:138-147` | Inspection | 4 |

### S — Background scheduling

| ID | Severity | Finding | Where | Evidence | Fixed in |
| --- | --- | --- | --- | --- | --- |
| S1 | High | The periodic alarm is created again on every service-worker start. `alarms.create` with an existing name replaces the alarm and restarts its 5-minute period, so while the reader browses (the worker restarts every few minutes) the alarm can keep being postponed and never fire. | `background/index.ts:113-115` | Inspection (documented `alarms.create` behavior) | 4 |
| S2 | Medium | The alarm only pushes, never pulls. The worker's `online` listener rarely fires, because the worker is usually asleep when the connection returns. There is no `runtime.onStartup` trigger. | `background/index.ts:54-62, 150-156` | Inspection | 4, 5 |
| S3 | Low | Sync code reads the locale from `localStorage`, which does not exist in the service worker, so it silently falls back to `en`. | `sync-engine.ts:321-328, 408-415`; `download.ts:77-84` | Inspection | 5 |

### U — UI state and reactivity

| ID | Severity | Finding | Where | Evidence | Fixed in |
| --- | --- | --- | --- | --- | --- |
| U1 | Medium | `App` creates a new `QueryClient` on every render. Locale and font changes drop the cache and detach running queries and mutations. | `entrypoints/popup/App.tsx:106` | Inspection | 1 |
| U2 | Medium | Changes made in another context are not observed. Pending counts poll every 5 s, and lists refresh only on local invalidation, so background sync results appear late in an open popup. Page highlights are not refreshed after a pull. | `hooks.ts:349-369`; `background/index.ts` | Inspection | 5, 6 |
| U3 | Medium | "Pending" mixes `isDirty` flags with operation entity IDs that exclude in-flight writes (Q2). `isDirty` is set to `!online` at save time, so rows saved online with a queued operation look clean and are deleted by refreshes. | `hooks.ts:665, 686, 764, 878, 977, 1098, 1207, 1333, 1403` | R-10 | 6 |
| U4 | Medium | Every popup and launcher open runs `fullSync(true)`. It retries rejected operations and pulls every downloaded novel each time, at a cost in bandwidth, server load and battery. | `use-popup-auto-sync.ts:16`; `background/index.ts:213-217` | Inspection | 4, 5 |
| U5 | Medium | Removing a download silently drops its unsynced changes. | `sync-storage.ts:101-108`; `download.ts:137-140` | Inspection | 5, 6 |
| U6 | Medium | Attaching or generating an image offline aborts the whole save, because the upload runs first and returns on failure. | `coloring-form.tsx:189-203, 505-521, 848-864` | Inspection | 8 |
| U7 | Low | Novel create, edit and delete use online-only generated hooks. Offline they pause silently and leave a spinner (TanStack's default `networkMode: "online"`). Novel delete does not clean local data or queued operations. | `popup.home/novelForm.tsx:158-197` | Inspection | 1 |
| U8 | Low | `lastSyncAt` is stored but never shown. The Sync button appears only while something is pending, so readers cannot refresh downloaded novels on demand. | `navbar.tsx:49-51, 83-90`; `sync-engine.ts:521-522` | Inspection | 6 |

### T — Tests

| ID | Severity | Finding | Where | Evidence | Fixed in |
| --- | --- | --- | --- | --- | --- |
| T1 | High | The sync tests mock the database and the storage layer, so the concurrency, refresh, mapping and conflict bugs above are invisible to them. | `test/sync-engine.test.ts:14-51` | Baseline run | 1 |
| T2 | Medium | The extension has no `test` script or Make target. Root `make test` skips the extension, and the publish workflow only typechecks, so its tests never run in CI. | `apps/extension/package.json`, `apps/extension/Makefile`, root `Makefile:168-172`, `.github/workflows/publish-chrome.yml:35` | Inspection | 1 |

## Pattern scan to repeat after each phase

Run these from `apps/extension` and classify every hit (fix, safe with the reason, or false positive with the reason). An empty result from a mistyped command is a scan failure, not a pass.

```bash
rg -n "\b(post|put|delete)(Keywords|KeywordAliases|KeywordVersions|Replacements|KeywordCategories|KeywordNatures)(ById)?\(" --glob '!src/api/generated/**' src
rg -n "isTempId|createTempId|temp-" src
rg -n "storylens-sync-state|getSyncState|addPendingOp|updatePendingOp" src
rg -n "isDirty|markKeyword.*Dirty|clear.*Dirty" src
rg -n "\.bulkPut\(|\.delete\(\)" src/lib/offline
rg -n "localStorage" src/lib/offline src/entrypoints/background
rg -n "lib/offline/(db|store)" src/entrypoints/content
rg -n -i "legacy|LEGACY_|decodeStoredText|withTranslatedName|aliasNameColumns" src
```

Baseline on 3.2.1 (checked during the review): 36 write-endpoint calls (18 in `hooks.ts`, 18 in `sync-engine.ts`), 23 temp-ID hits, 16 old-pool hits, 50 dirty-flag hits, 27 bulk writes and deletes, 3 `localStorage` reads, 0 content-script database imports. The last pattern is known to work: it matches 9 imports elsewhere in `src`.

Expected when the refactor is finished (phase 10):

| Scan | Allowed hits |
| --- | --- |
| Write endpoints | Only the sync transport module |
| Temp IDs | None (the old pool is never imported; decision D13) |
| Old pool API | Only `upgrade-cleanup.ts`, which deletes the old key without reading it (until the release after this one) |
| Dirty flags | None |
| Bulk writes and deletes | Only the snapshot writer and outbox module, each reviewed for transaction scope |
| `localStorage` | None |
| Database imports in content scripts | None (content scripts use the page's origin; they must ask the background) |
| Compatibility shims | None, except `upgrade-cleanup.ts` until the release after this one; the kept items in the [inventory](main.md#compatibility-cleanup-inventory-d13) live outside `apps/extension/src` or are named there with their reason |
