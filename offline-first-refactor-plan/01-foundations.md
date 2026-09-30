# Phase 1 — Foundations

[Global tracker](main.md) · **Status: Not started** · **Estimate: 5 points** · **Depends on: none** · **Ships in: the offline-first release (the test harness and CI wiring may merge to `develop` early)**

## Goal

Build the test harness every later phase relies on. Add the pieces that do not depend on the new engine:

- the permission rules, including D12, and UI gating;
- a stable query client;
- a fetch-all-pages helper;
- the offline state of online-only actions (D6).

Nothing in this phase touches the old offline engine: phase 6 deletes it, and it gets no interim patches (D9, D13).

**Closes:** T1, T2, U1, U7, A1 (the rules and gating; `enqueue` enforces them in phase 3) and P7 (the helper; phase 5 uses it).

## Scope

- In: extension tests and CI wiring; a fake browser, IndexedDB and API; permission helpers and gating; `QueryClient`; the fetch-all-pages helper; online-only actions while offline.
- Out: everything under `src/lib/offline/` (phases 3–6) and the backend (phase 2).

## Tasks

### 1.1 Test infrastructure

- [ ] Add `fake-indexeddb` to the extension's `devDependencies`, a `"test": "bun test"` script to `apps/extension/package.json`, and a `test` target to `apps/extension/Makefile` (listed in its `help`).
- [ ] Root `Makefile`: add `@$(MAKE) -C "$(EXTENSION)" test` to `test`, and update the `make help` text and the root `AGENTS.md` command list ("backend, client, website, and dashboard tests").
- [ ] `.github/workflows/publish-chrome.yml`: run the extension tests after `make typecheck`.
- [ ] `test/helpers/fake-browser.ts` mocks `#imports`:
  - `storage.local` and `storage.session` with asynchronous `get`/`set`/`remove` (one macrotask each, to expose races) and `onChanged` listeners;
  - `alarms` (`create`, `get`, `getAll`, `clear`) with `scheduledTime`;
  - `runtime` (`id`, `getURL`, `getManifest`, `onStartup`, `onInstalled`);
  - `tabs.query` and `tabs.sendMessage`.
- [ ] `test/helpers/offline-db.ts` imports `fake-indexeddb/auto`, and deletes and reopens the extension database between tests.
- [ ] `test/helpers/fake-api.ts` is an Axios adapter backed by an in-memory server that follows the **new** reader API from [phase 2](02-backend-sync-contract.md):
  - required client IDs and replays;
  - required `baseUpdatedAt`, with 409 `STALE_WRITE` and `current`;
  - partial updates;
  - error codes and statuses;
  - alias `nameAr`/`nameEn`;
  - the D12 ownership rule;
  - version rules and auto-close;
  - the replacement chain rewrite;
  - lookups "in use";
  - `updatedAt` bumps;
  - paginated lists with `total`;
  - `Accept-Language` filtering;
  - the protocol endpoint.
- [ ] `fake-api.ts` also injects failures per request: network error, a hang that never resolves, 5xx, 429 with `Retry-After`, 401 and 426. An **old API** switch (protocol 404) exists only to test the protocol guard.
- [ ] Self-tests for the harness: non-UUID IDs get 422, a stale base gets 409, `updatedAt` moves on every write, and storage calls interleave.

### 1.2 Client state

- [ ] **U1:** in `entrypoints/popup/App.tsx`, create the `QueryClient` once (`useState(() => new QueryClient())`), so locale and font changes keep the cache and running mutations.

### 1.3 Permission rules and gating (A1, D12)

- [ ] Add `src/lib/auth/permissions.ts`, pure functions that mirror the backend after phase 2. Phase 3's `enqueue` uses them too. Each cites the backend rule in a comment.
  - `canEditKeyword(user, keyword)` and `canDeleteKeyword`: moderator or the keyword's creator.
  - `canCreateAlias(user)` and `canCreateVersion(user)`: any signed-in non-guest.
  - `canEditAlias(user, alias, parentKeyword)`, `canEditVersion(user, version, parentKeyword)` and the matching deletes: moderator, **the alias's or version's own creator**, or the parent keyword's creator (D12).
  - `canEditReplacement(user, replacement)` and its delete: moderator or creator.
  - `canManageLookups(user)` and `canSetVersionRange(user)`: moderator.
- [ ] Gate the UI through the helpers, and localize every new string (`bun run i18n:parse`):
  - Coloring cards open edit forms only when allowed; otherwise they show a tooltip ("Only the creator or a moderator can change this").
  - Alias and version **add** buttons stay available to readers.
  - Replacing cards follow the same rule.
  - Delete buttons follow the delete rules.
- [ ] `useCanMutateKeywords` and `useCanMutateReplacements` keep their meaning ("may create"). Document that edits go through the per-row helpers.
- [ ] Rows created locally carry `createdById` from the projection (phase 3), so readers can edit their own unsynced rows.

### 1.4 Fetch-all-pages helper (P7)

- [ ] Add `src/utils/fetch-all-pages.ts`. It requests pages of 500 until `total` is reached or a page is empty, and passes the abort signal and a per-request timeout through.
- [ ] Phase 5's pulls use it. Nothing in the old engine is changed to use it.

### 1.5 Online-only actions while offline (D6, U7)

- [ ] While offline, disable novel add, edit and delete, **Add slug**, the chapter-bias editor and website selector editing. Each gets a tooltip saying it needs a connection.
- [ ] These actions use online-only generated hooks, so offline they must never start a paused mutation with an endless spinner.

## Tests

| # | Test | Expected |
| --- | --- | --- |
| 1 | Permission helpers: another reader's keyword; an alias the reader created under someone else's keyword; someone else's alias under the reader's own keyword; a third reader; a moderator | Matches the D12 rule table, one assertion per rule |
| 2 | Reader opens someone else's keyword card | Read-only; no edit form |
| 3 | Reader opens their own alias under someone else's keyword | Edit form opens |
| 4 | `App` re-renders on a locale change | The same `QueryClient` instance |
| 5 | `fetchAllPages` with 1,234 rows; with an empty page; aborted; timing out | 3 requests; stops; rejects on abort; rejects on timeout |
| 6 | Offline novel form, slug and bias actions | Disabled with a tooltip; no paused mutation |
| 7 | Harness self-tests (1.1) | Pass |

Manual:

- Sign in as a reader and as a moderator.
- Check the gating on your own rows, other readers' rows, your aliases on other readers' keywords, and other readers' aliases on your keywords. The backend enforces the same rule only once phase 2 is merged, so test against the feature branches together.

## Exit criteria

- [ ] `bun run test` passes in `apps/extension`, and runs from root `make test` and in the publish workflow.
- [ ] `bun run typecheck` passes in all five submodules.
- [ ] Every permission rule has a test.
- [ ] `git diff` shows no change under `apps/extension/src/lib/offline/`.

## Docs and instructions

- `docs/extension.md`: replace the `bun test test/sync-engine.test.ts` line with `bun run test`; describe per-row edit permissions and the actions disabled offline.
- `apps/extension/AGENTS.md`:
  - the test command;
  - "gate edits through `lib/auth/permissions.ts`";
  - "downloads and pulls fetch every page (`fetchAllPages`)".
- Root `AGENTS.md` and `docs/development.md`: `make test` now includes the extension.
- Analytics: no new events.

## Risks

| Risk | Mitigation |
| --- | --- |
| Gating hides actions that moderators need | It uses `user:moderate` from the stored permissions, and `useAuthInit` refreshes the user on open |
| The UI allows alias edits (D12) that an unmerged backend refuses | Phases 1 and 2 ship together (D13); on the branches, test them together |

## Verification log

| Date | Check | Result | Evidence |
| --- | --- | --- | --- |
| | | | |
