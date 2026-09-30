# Phase 3 — Local store, outbox and projection

[Global tracker](main.md) · **Status: Not started** · **Estimate: 8 points** · **Depends on: 1** · **Ships in: the offline-first release (branch `feature/offline-v2`)**

## Goal

Replace the `storage.local` pool, temp IDs, dirty flags and the Dexie upgrade chain with the new `storylens` database described in the [architecture](architecture.md#data-model-new-database-storylens-schema-version-1):

- snapshot tables that only server data writes;
- a transactional outbox;
- a pure projection that builds every view.

This phase builds and tests those pieces and the one-time cleanup of 3.2.x storage. Phase 4 connects them to the network and phase 6 to the UI.

**Closes:** Q1, W1 (writes are durable before anything is sent), W3 (no temp IDs), M1 (client-side), M2, M3, M4, P1, P2 (the store side), P10 (projection mirrors), P11, P13 (no decoding layer; views show raw text), W6 (validation), A1 (checks in `enqueue`). **Inventory:** the old pool and the Dexie upgrade chain.

## Branching

Phases 1–9 land as reviewed pull requests on `feature/offline-v2` branches in the extension, backend, desktop client and dashboard submodules. Each branch is rebased on `develop` weekly. The branches merge and release together once phase 10's exit criteria pass (D13). The old and new engines never run in the same build.

## Module layout (`apps/extension/src/lib/offline/`)

| File | Kind | Responsibility |
| --- | --- | --- |
| `db.ts` | Dexie | The `storylens` database, schema version 1; `openOfflineDb()` with failure handling; table accessors |
| `ids.ts` | Pure | `newId()` (`crypto.randomUUID()`), `isUuid()` |
| `types.ts` | Types | `Mutation`, `SyncEntity`, `MutationStatus`, `EntitySyncState`, `NovelView`, `LookupsView` |
| `rules/validation.ts` | Pure | Server-rule mirrors used by `enqueue` |
| `rules/merge.ts` | Pure | Three-way merge (used by phase 4) |
| `projection.ts` | Pure | `projectNovel`, `projectLookups`, `projectCatalogue`, `entitySyncStates` |
| `outbox.ts` | Dexie | `enqueue`, `discardMutation`, `applyResolution`, `listMutations`, `countUnresolved` |
| `snapshot.ts` | Dexie | Snapshot writers for pulls and push outcomes: `replaceNovelSnapshot`, `replaceLookups`, `replaceCatalogue`, `upsertRows`, `removeRows` |
| `views.ts` | Dexie | `getNovelView`, `getLookupsView`, `getCatalogueView`, `getDownloadedNovels` |
| `upgrade-cleanup.ts` | Dexie | Deletes 3.2.x storage once; removed in the release after this one |

Permission rules come from phase 1's `src/lib/auth/permissions.ts`. Keep names in kebab-case, named exports only, no `any`, following the surrounding code.

## Tasks

### 3.1 Schema

- [ ] Create the `storylens` database with the single schema in the [architecture](architecture.md#data-model-new-database-storylens-schema-version-1): no version chain and no upgrade functions.
- [ ] `openOfflineDb()` catches open failures, such as a blocked IndexedDB on Firefox with site data disabled. It sets an in-memory `offlineUnavailable` flag (it cannot live in `syncMeta`, which is inside the unavailable database), and the UI shows a banner (phase 6) instead of crashing.
- [ ] `novelSync` helpers: `pinNovel`, `unpinNovel`, `listPinned`, `markPulled(novelId, error?)`, `markRemovedOnServer`, `requestRefresh`.
- [ ] `syncMeta` helpers with typed keys: `protocol`, `runner`, `lastPushAt`, `lastPullAt`, `catalogPulledAt`, `lookupsPulledAt`, `changeCounter`.

### 3.2 Rules (pure)

- [ ] `rules/validation.ts` has one function per server rule, each citing the backend rule it mirrors (after phase 2):
  - keyword names unique per novel in each language, with at least one name;
  - alias names unique per keyword in each language;
  - replacement `from` unique per novel, with no bidirectional pair;
  - version: a reader needs `currentChapter`; the start comes after the latest open version; a moderator's range does not overlap its neighbours;
  - no deleting the base or only version;
  - no deleting a category or nature used by any version or alias in the view.
- [ ] `rules/merge.ts` implements `merge(base, patch, server)` exactly as in the [architecture](architecture.md#three-way-merge). Its field equality trims text and treats `null`, `undefined` and `""` alike for optional text. There is no decoding: the API stores raw text after phase 2 (D11).

### 3.3 Projection (pure)

- [ ] `projectNovel({ snapshot, lookups, mutations, userId })` returns `NovelView` plus `Map<entityId, EntitySyncState>`. It applies the current account's mutations in `seq` order, with every rule in the [projection table](architecture.md#read-path--views):
  - keyword create with its base version (`versionId`);
  - cascades on delete;
  - alias `nameAr`/`nameEn` written directly;
  - version auto-close and the moderator-only range;
  - replacement chain rewrite and `keywordId` resolution;
  - lookup embedding;
  - `createdById` and timestamps.
- [ ] Idempotence: a create whose row already exists merges its fields; an update of a missing row is ignored and flagged `missing`; a delete of a missing row changes nothing.
- [ ] `projectLookups` applies category and nature mutations (moderators). Embedded `category`/`nature` objects in novel views always come from the projected lookups, which fixes M3.

### 3.4 Outbox

- [ ] `enqueue(input)` follows the [write path](architecture.md#write-path--enqueue) in **one** `rw` transaction over `mutations`, the novel's snapshot tables, the lookups and `syncMeta`:
  1. actor check;
  2. view of the novel;
  3. permission (`lib/auth/permissions.ts`, D12);
  4. validation;
  5. diff against `seen` (the values the form started with);
  6. coalescing table;
  7. `dependsOn`;
  8. `changeCounter + 1`.
- [ ] It returns `{ entityId, mutationId | null }`: `null` when nothing changed or a create and delete cancelled out.
- [ ] Typed inputs per entity. A create receives field values; an update receives `changes`, `seen` and `seenUpdatedAt`; a delete receives the ID. The novel and parent come from the view, never from the caller alone.
- [ ] A keyword create generates `entityId` and `versionId`. Editing that base version while the create is unsent merges into the create.
- [ ] Deleting a row created locally and never sent removes the create, and lists and removes the unsent mutations of its children (the UI confirms first; phase 6).
- [ ] `discardMutation(id, { withDependants })` and `applyResolution(id, resolution)` implement the [resolution actions](architecture.md#resolution-actions). Phase 7 builds the UI on them.
- [ ] Errors are typed (`PermissionDenied`, `ValidationFailed` with a code, `NotSignedIn`), so forms can show localized messages.

### 3.5 Snapshot writers

- [ ] `replaceNovelSnapshot(novelId, bundle)` deletes and writes the novel's keywords, aliases, versions, replacements and biases in **one** transaction. It never touches `mutations`, except that pending updates of rows that disappear become `conflict(deleted)` in the same transaction (the early detection in the architecture).
- [ ] `replaceLookups` and `replaceCatalogue` replace whole tables (pruning, P6). The catalogue keeps pinned novels that the server removed, marked `removedOnServer`.
- [ ] `upsertRows` keeps the row with the later `updatedAt`, so a late response never overwrites newer server data. Add `removeRows`.

### 3.6 One-time cleanup of 3.2.x storage (D13)

- [ ] `deleteOldStorage()` runs on `runtime.onInstalled` with reason `update`, and on every worker start while anything is left:
  - `Dexie.delete("storylens-offline")`;
  - `browser.storage.local.remove("storylens-sync-state")`.
- [ ] It never reads either. Errors are logged, and the next start retries.
- [ ] Phase 10 schedules deleting this module in the release after this one.

## Tests

Use the harness from phase 1 (`fake-indexeddb`, `fake-browser`). Put pure modules under `test/offline/unit/` and Dexie-backed ones under `test/offline/store/`.

| # | Area | Case | Expected |
| --- | --- | --- | --- |
| 1 | Projection | Every row of the projection table, one test each | View equals what the fake API returns after the same writes |
| 2 | Projection | Apply the same mutations twice | Same view as once |
| 3 | Projection | Another account's mutations | Ignored |
| 4 | Projection | Category renamed and recoloured by a pending mutation | Versions **and aliases** show the new name and color |
| 5 | Projection | Keywords `D'Artagnan` (from the server) and `O'Brien` (created offline) | Both shown as typed; the content processor's pattern matches both in page text (P13) |
| 6 | Coalescing | Every row of the coalescing table | Resulting mutations match the table |
| 7 | Coalescing | Create K, then alias A under K, then delete K (all unsent) | Outbox empty; view has neither |
| 8 | Coalescing | Update while the tail is `inflight` | New mutation appended with its own `seen` |
| 9 | Keyword create | Edit the base version before sending | Keyword create patch holds the description, category and nature; no version mutation |
| 10 | Validation | Each mirrored rule (duplicate names per language, version order, base or only version delete, lookup in use) | `ValidationFailed` with the code; nothing written |
| 11 | Permission | Reader edits another reader's keyword; edits their own alias under someone else's keyword (D12) | `PermissionDenied`; allowed |
| 12 | Diff | Submit a form without changes | `mutationId: null` |
| 13 | Merge | Each branch (deleted, equal, server-unchanged, true conflict, empty-string equality, trimmed text) | As specified |
| 14 | Concurrency | 50 enqueues split across two database instances on the same fake IndexedDB (two contexts) | 50 mutations, strictly increasing `seq`, no loss (replaces R-1 and R-2) |
| 15 | Snapshot | `replaceNovelSnapshot` while pending alias create, update and delete mutations exist | View still shows the alias created, renamed and deleted (replaces R-7, R-8, R-9) |
| 16 | Snapshot | Pending update of a row missing from the new snapshot | That mutation becomes `conflict(deleted)` |
| 17 | Snapshot | `upsertRows` with an older `updatedAt` | Ignored |
| 18 | Cleanup | Update with the 3.2.x database and pool key present | Both deleted; nothing read; the new database is empty |
| 19 | Cleanup | Deletion fails once (database blocked) | Retried on the next start; succeeds |
| 20 | Database unavailable | `indexedDB.open` throws | `offlineUnavailable` is set; views return an empty result with a reason |
| 21 | Performance | Pure projection of 2,000 keywords, 4,000 aliases and versions, and 200 mutations | Under 20 ms on a laptop (logged in the verification log) |

## Exit criteria

- [ ] All tests above pass. Pure modules have branch coverage for every rule table (report `bun test --coverage` in the verification log).
- [ ] Typecheck passes in all five submodules.
- [ ] Pattern scan: no temp IDs, no `isDirty`, and nothing reads `storylens-offline` or `storylens-sync-state` outside `upgrade-cleanup.ts`.

## Docs and instructions

Update at the branch merge (phase 10); keep a draft here in the meantime.

- `apps/extension/AGENTS.md` "API and offline data":
  - the snapshot, outbox and view terms;
  - "only `enqueue` writes the outbox, only the runner writes snapshots";
  - "IDs are client UUIDs";
  - "no Dexie upgrade functions: schema changes that need data changes get a new, explicitly planned migration".
- `docs/extension.md` "Account and synchronization".

## Risks

| Risk | Mitigation |
| --- | --- |
| Projection rules drift from server rules | Each mirror cites its backend rule; the fake API and the projection share test fixtures; the backend `AGENTS.md` asks for both sides to change together |
| One big transaction for `enqueue` slows the UI | Scope it to the novel's rows (indexed), and measure in test 21 |
| Readers lose 3.2.x downloads and unsent changes | Accepted by D13; stated in the release notes (phase 10) |

## Verification log

| Date | Check | Result | Evidence |
| --- | --- | --- | --- |
| | | | |
