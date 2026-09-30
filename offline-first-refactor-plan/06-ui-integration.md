# Phase 6 — UI integration

[Global tracker](main.md) · **Status: In review (implemented 2026-09-30; browser checks open)** · **Estimate: 8 points** · **Depends on: 3, 4, 5** · **Ships in: the offline-first release (branch `feature/offline-v2`)**

## Goal

Every screen reads local views and writes through `enqueue`, whether online or offline. Screens update when the background changes data, show honest sync state, and send only what the reader changed. The legacy engine is deleted at the end of this phase.

**Closes:** W1 (UI side), W2, W4, W5 (UI side), W6 (form messages), W7, U2 (popup side), U3, U5 (removal dialog), U8; A1 (UI surfaces `enqueue` refusals); the remaining callers of the old engine. **Inventory:** the extension's alias-name fallbacks, the old session format and `decodeStoredText`.

## Tasks

### 6.1 Reactivity

- [x] Add an app-level `useOfflineInvalidation()` in `popup/App.tsx`. It subscribes to Dexie's global `storagemutated` event and invalidates the `["offline", …]` query keys of the tables that changed. Local reads keep TanStack Query with `networkMode: "always"`.
- [ ] **Verify** that Dexie 4 delivers `storagemutated` from the background worker to an open popup and to the launcher iframe (BroadcastChannel). If a context misses it, the runner broadcasts an `offlineChanged` runtime message after each outcome and pull, and the hook listens for it too. Record the result in the verification log. — **Open (2026-09-30):** not verified in a browser. The hook listens to `storagemutated` and, as the fallback, checks `syncMeta.changeCounter` every 3 s (instead of a runtime `offlineChanged` message).
- [x] Replace the 5-second polling in `usePendingSyncCount`/`usePendingEntityIds` with the invalidation above (U2).

### 6.2 Reads (`src/lib/offline/hooks.ts` stays the public UI module)

- [x] Split the internals into `hooks/reads.ts`, `hooks/mutations.ts` and `hooks/status.ts`, re-exported from `hooks.ts`, so imports do not churn.
- [x] Views back these hooks:
  - `useNovelKeywords`, `useOfflineKeywords`, `useOfflineKeywordAliases` and `useOfflineReplacements` use `getNovelView`;
  - `useOfflineKeywordCategories` and `useOfflineKeywordNatures` use `getLookupsView`;
  - `useCachedNovelsList` uses `getCatalogueView`;
  - `useDownloadedNovelIds` and `useDownloadedNovelsList` use `novelSync` pins.
- [x] Delete the online-only list queries (`hooks/use-novel-keywords.ts:17-41`, `replacing-cards.tsx:45-71`); one source of truth (W2).
- [x] With no snapshot for the novel: online, call `requestNovelRefresh` and show loading; offline, show a localized empty state ("Not available offline. Download this novel while online to use it offline.").
- [x] Row badges come from `EntitySyncState` instead of `isDirty` and entity-ID sets (U3): a cloud icon for pending, a warning icon for needs attention (links to the phase 7 page).

### 6.3 Writes

- [x] Reimplement `useOfflineKeywordMutations`, `…AliasMutations`, `…VersionMutations`, `…ReplacementMutations`, `useOfflineCategoryMutations` and `useOfflineNatureMutations` (names kept) on `enqueue`, followed by `sendMessage("syncKick", { reason: "enqueue" })` and `refreshContentScript()`.
- [x] No network calls remain in these hooks (W1). Delete `runBackgroundSync`, `reportQueuedSyncFailure`, `withBackgroundSync` and `store/sync-status.ts`.
- [x] Map `PermissionDenied` and `ValidationFailed` codes to localized messages in the forms. Nothing is written on refusal.
- [x] Deleting a locally created row that has unsent children asks for confirmation listing them. The data comes from `enqueue`'s dry run. — **Done (2026-09-30):** the keyword delete confirmation shows `UnsentDependants` (from `planDelete`) with the count of unsent changes it discards.

### 6.4 Forms send changes, not snapshots

- [x] Add a pure `src/lib/offline/form-changes.ts`:
  - `keywordFormChanges(initial, values)` returns `{ keyword?, baseVersion? }`;
  - `aliasFormChanges`, `versionFormChanges`, `replacementFormChanges` and `lookupFormChanges`.
  - Each returns `changes` plus `seen` (the initial values of the changed fields).
- [x] The forms pass `seen` and `seenUpdatedAt` (the row's `updatedAt` when the form opened) to the hooks.
- [x] The keyword form writes the keyword mutation only when a name or the matching type changed, and the base-version mutation only when the description, category, nature or image changed (W4).
- [x] Cleared description and image fields become `null` in `changes` (W5).

### 6.5 Flows

- [x] **Extraction view** (`popup.extract/extraction-view.tsx`):
  - rows save through `enqueue` one at a time;
  - an alias or version row whose suggested parent was saved moments ago uses the returned `entityId` immediately (W3);
  - parents resolve over the view.
- [x] **Selection view and `parent-keyword-select`**: the view through `useNovelKeywords`.
- [x] **Alias names** (phase 2 removes `name`):
  - Alias forms edit the UI language's `nameAr`/`nameEn` through `nameFields`, like keyword forms.
  - Display uses `nameIn`, and page matching uses both columns.
  - Delete `aliasNames`, `aliasNameColumns` and the `name` fallbacks in `src/utils/translation.ts` and `resolve-keyword-version.ts`.
- [x] **Settings lookups**: moderators only; deleting a category or nature in use is refused with the validation message.
- [x] **Downloads** (`popup.home/home.tsx`):
  - download and remove go through the phase 5 messages;
  - `{ blocked: n }` opens a dialog with **Sync now**, **Discard changes and remove** and **Cancel**;
  - a `removedOnServer` novel shows a banner offering to remove the download.
- [x] **Novel context, novel form, slugs and biases**: online-only calls followed by `requestNovelRefresh` or a catalogue refresh (phase 5.6); `getBiasesByNovelId` reads the novel view.
- [x] **Popup auto-sync**: `usePopupAutoSync` sends `syncKick({ reason: "popup-open", pull: "stale" })`, with no forced retries (U4).

### 6.6 Sync status in the navbar

- [x] The Sync button is always visible (U8). Its icon shows synced, pending (count), sending, offline, or needs attention (red).
- [x] Clicking it opens a popover with:
  - "Last synced {time}";
  - pending and sending counts;
  - when offline: "Changes are saved on this device and sync when you are back online";
  - a "Having trouble reaching Story Lens" warning after repeated failures;
  - **Sign in again** when `authRequired`, **Update required** when `upgradeRequired`, and "Sync paused until Story Lens updates" when `apiOutdated`;
  - a **Needs attention (n)** link to phase 7;
  - **Sync now**, which calls `syncNow` and shows the summary as a toast.
- [x] Analytics: `sync_manual_requested` (no parameters) when **Sync now** is pressed. Add it to the catalog in the same pull request.

### 6.7 Platform checks

- [ ] **Firefox:** confirm that the launcher iframe (`popup.html` embedded in a site) opens the same IndexedDB as the toolbar popup. Write in the iframe, read in the toolbar popup, and compare `mutations` counts. If it is partitioned, add a `viewProxy` and `enqueueProxy` message pair handled by the background, and use it whenever `window.parent !== window` on Firefox. — **Open (2026-09-30):** not verified (needs Firefox).
- [x] **Database unavailable** (`offlineUnavailable`): show a banner ("Offline storage is unavailable in this browser profile; changes need a connection"), read lists online and disable offline-only actions. — **Done (2026-09-30):** lists and page data read the API (`fetchNovelBundle`, `fetchLookups`, `fetchNovels`), and `enqueue` refuses edits with `StorageUnavailable` ("changes need a connection"); tested in `pull.test.ts`.

### 6.8 Remove the legacy engine

- [x] Delete `sync-engine.ts`, `sync-storage.ts`, `background-sync.ts`, `download.ts` (moved to the runner), `store/sync-status.ts`, the `isDirty` writers and `clean*` helpers, the `triggerFullSync` message and `test/sync-engine.test.ts`, whose scenarios now live in the phase 4 and 5 suites.
- [x] Nothing of the old engine stays (D13). The only code that touches 3.2.x storage is phase 3's one-time `upgrade-cleanup.ts`.
- [x] Run the pattern scans; every hit must match its allowed list in [findings](findings.md#pattern-scan-to-repeat-after-each-phase).

### 6.9 Remove the extension's compatibility shims (D13)

- [x] `lib/auth/auth-store.ts`: delete `LEGACY_ACCESS` and `legacyAccess`. A stored session that fails to parse but has a token reloads the user from `/api/user/auth/me` before `useAuthInit` creates a guest. Otherwise an old stored session would silently turn a signed-in reader into a guest.
- [x] `lib/desktop-client/novel-context-prompt.ts`: delete `decodeStoredText` and its calls, because stored text is raw after phase 2 (D11).
- [x] Run the compatibility-shim scan in [findings](findings.md#pattern-scan-to-repeat-after-each-phase); every hit is fixed or listed as kept in the [inventory](main.md#compatibility-cleanup-inventory-d13).

### 6.10 Localization

- [ ] Add every new string (English and Arabic) with `bun run i18n:parse`, and check RTL layout of the popover, dialog and banners in Arabic. — **Open (2026-09-30):** strings added; RTL not checked in a browser.

## Tests

| # | Test | Expected |
| --- | --- | --- |
| 1 | `keywordFormChanges`: no change / name only / description only / cleared description / name and category | Nothing / keyword only / base version only / `description: null` / both |
| 2 | The other `*FormChanges` helpers | Only changed fields, with `seen` |
| 3 | Status derivation (counts and runner state → icon, text, actions) | Every state in 6.6 |
| 4 | Enqueue from the popup, run in the background (two Dexie instances plus the `storagemutated` hook) | The popup's query is invalidated and shows the confirmed row |
| 5 | Extraction: save a new keyword row, then immediately an alias row under it | Alias mutation `dependsOn` the new keyword; both sent in order |
| 6 | Stored session in the old `role` format with a valid token | User reloaded from `/api/user/auth/me`; no guest created |
| 7 | Alias form in the Arabic UI: create, then rename | Only `nameAr` is written; display and page matching use the new name |

Manual (Chrome and Firefox, toolbar popup and launcher popup):

1. Online: add a keyword and close the popup at once. It syncs within a minute, and after a pull it is still there (W1).
2. Offline: add, edit and delete keywords, aliases, versions and replacements. Badges appear, highlights update at once, and after reconnecting everything syncs.
3. Open the same novel in two tabs and edit in one. The other tab's popup list updates without reopening.
4. Remove a download with pending changes. The dialog appears, and each option does what it says.
5. Clear a description and save. It is cleared on the server.
6. Arabic UI: the popover, dialog, banner and empty state read correctly in RTL.

## Exit criteria

- [ ] All automated tests pass; typecheck passes in all five submodules; `bun run check` (Biome) is clean. — **Open (2026-09-30):** new and changed files are clean; the extension has pre-existing Biome findings (for example `!important` in `content.css`, `useTemplate` in `keyword-tooltip.ts`) that were left alone.
- [x] The pattern scans match their final allowed lists.
- [ ] The manual list is done in Chrome and Firefox and recorded below. — **Open (2026-09-30):** not done.

## Docs and instructions

- `apps/extension/AGENTS.md` "API and offline data": UI code never calls write endpoints for syncable entities; forms send changes with `seen` and `seenUpdatedAt`; lists read views; snapshot writes happen only in the runner. Update the "Count all unresolved operations…" paragraph to the new status model.
- `docs/extension.md` "Account and synchronization": the navbar status, the removal dialog and the offline empty states.

## Risks

| Risk | Mitigation |
| --- | --- |
| `storagemutated` does not cross into the worker or iframe | Runtime-message fallback (6.1); verified per browser |
| Hook rewrites break screens that depend on the old return shapes | Names and return shapes are kept; typecheck plus the manual list per screen |
| Firefox partitions the launcher iframe | Proxy messages (6.7), decided by the verification |

## Implementation notes (2026-09-30)

- Hook names and return shapes were kept, except the write inputs: create takes field values (plus an optional queued `image`), update takes `{ id, changes, seen, seenUpdatedAt }` (from `form-changes.ts`), delete takes the ID. `useOfflineKeywordAliases` now also takes the novel ID.
- Row badges: every card (keywords, aliases, versions, replacements, categories, natures) shows its view `EntitySyncState` through `components/sync-badge.tsx`; "Needs attention" opens the Sync status page.
- Delete refusals (for example a category in use, a base version) now show a toast (`c726009`): delete buttons have no error area.
- The category and nature forms show the specific refusal message (`offlineErrorMessage`).
- Selection view and parent select read `useNovelKeywords` (the view); `src/hooks/use-novel-keywords.ts` was removed and callers import from `@/lib/offline/hooks`.
- The Sign-in-again link opens the website login page; Update required calls `runtime.requestUpdateCheck`.
- Also removed: `src/utils/upload-image-file.ts` (images are queued), `test/sync-engine.test.ts`, and the client app's own `decodeStoredText` (`apps/client/src/crawl/merge.ts`).
- Tests 4 and 6 are automated in `test/ui/components.test.tsx` (test 4 uses two Dexie instances in one process, so it proves the invalidation hook, not delivery from a real service worker). Test 5's dependency part is covered by `outbox.test.ts` and the immediate parent link by the extraction view saving with the returned `entityId`.

## Verification log

| Date | Check | Result | Evidence |
| --- | --- | --- | --- |
| 2026-09-30 | Form change sets, status derivation (tests 1–3) | Pass | `test/offline/unit/pure.test.ts` |
| 2026-09-30 | Alias names per language; display and matching | Pass | `test/translation.test.ts` |
| 2026-09-30 | Extension typecheck and build | Pass | `bun run typecheck`, `bun run build` |
| 2026-09-30 | Pattern scans (final allowed lists) | Match | `findings.md` scans |
| 2026-09-30 | Cross-context invalidation, Firefox iframe, manual list, RTL | Not run | Need a browser |
| 2026-09-30 | Tests 4 and 6; storage-unavailable mode | Pass | `test/ui/components.test.tsx`, `test/offline/sync/pull.test.ts` |
