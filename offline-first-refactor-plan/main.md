# Offline-first refactor — global tracker

**Status: Phases 1–9 implemented on the `feature/offline-v2` branches and merged to `develop` locally (2026-09-30); phase 10's browser, staging and release checks remain for the owner.** Every decision is made (D1–D14; D7 and D8 are superseded by D13). See [Implementation status](#implementation-status-2026-09-30).

## Goal

Make the extension's offline editing trustworthy in every case: popups that close mid-save, service workers killed mid-sync, long offline periods, extension updates, account switches, and edits that conflict with other devices, other readers, moderators and the dashboard.

The current offline pool cannot get there with patches. The plan replaces it with a local-first design:

- server **snapshot** tables;
- a transactional **outbox** with client-generated UUIDs;
- **views** projected from both;
- a single background **runner** with idempotent, ordered, conflict-aware sync.

Backward compatibility is **not** kept (D13). The backend, extension, desktop client and dashboard change together in one release, and older installs are made to update. Deprecated code and compatibility shims are removed rather than carried.

- [Findings](findings.md): the review, with 53 findings, reproduction evidence and file references.
- [Architecture](architecture.md): the target design, protocols, conflict policy and invariants.

## Review summary

| Severity | Count | Findings |
| --- | ---: | --- |
| Critical | 3 | Q1 lost queue writes (race), W1 online writes lost when the popup closes, M1 permanent 422 on an offline keyword's base version |
| High | 17 | Q2, W2, W3, M2, R1, R2, P1, P2, P3, P4, P13, C1, C2, A1, A2, S1, T1 |
| Medium | 24 | Q3, W4, W5, W6, M3, R3, R4, R5, P5, P6, P7, P8, P9, C3, C4, A3, S2, U1–U6, T2 |
| Low | 9 | W7, M4, P10, P11, P12, C5, S3, U7, U8 |

Thirteen scenarios were reproduced against the real modules, and all 13 behaved as predicted. The existing 45 extension tests pass anyway, because they mock the database and are not run by `make test` or CI (T1, T2). See [Evidence](findings.md#evidence).

Six root causes produce most of the bugs:

1. two write paths;
2. an unlocked read-modify-write blob;
3. temporary IDs;
4. server and local state mixed in one table;
5. no error taxonomy or conflict model;
6. queued writes not tied to an account.

## Decisions (owner input)

| # | Decision | Proposal | Needed by | Status |
| --- | --- | --- | --- | --- |
| D1 | Overlapping edits to the same field from two sources | Ask the reader per field; changes to different fields merge automatically | Phase 4 | **Decided 2026-09-30:** as proposed |
| D2 | Local delete against a remote edit | The delete wins (deletes are unconditional and idempotent) | Phase 2 | **Decided 2026-09-30:** as proposed |
| D3 | Offline images | Queue uploads (phase 8) in the same release as the engine | Phase 8 | **Decided 2026-09-30:** as proposed |
| D4 | Delta sync | Defer; decide from phase 5's pull measurements | Phase 9 | **Decided 2026-09-30:** build it now, in this release (phase 9) |
| D5 | Data kept for cached (not downloaded) novels | Keep it and refresh when used; no eviction until storage becomes a problem | Phase 5 | **Decided 2026-09-30:** as proposed |
| D6 | Online-only actions | Novel create, edit and delete, slugs, website selectors and chapter biases stay online-only and are disabled offline with an explanation | Phase 1 | **Decided 2026-09-30:** as proposed |
| D7 | Release sequencing | Staged releases (backend first, engine later) | — | **Superseded by D13:** one coordinated release |
| D8 | Machine-readable errors | Add `code` without changing statuses | — | **Superseded by D13:** every sync error carries a `code`, and statuses may change (for example, duplicates become 409) |
| D9 | Temporary patches to the old queue before the engine ships | Only if the engine is far away | — | **Decided 2026-09-30:** no patches; ship clean code only |
| D10 | Changes queued by another account | Hold them and list them under Needs attention (sign in or discard); never send them with another account's token | Phase 4 | **Decided 2026-09-30:** as proposed |
| D11 | The API HTML-escapes stored text (P13) | Fix it at the source: the API stops escaping stored text (it keeps trimming), a migration decodes existing rows, and the extension's decoders are deleted. This is safe because no app inserts this text as HTML (the extension, dashboard and website were checked). The fallback is decoding in extension views | Phase 2 | **Decided 2026-09-30:** as proposed (fix it in the server) |
| D12 | Who may edit and delete aliases and versions | Also their own creator | Phase 1 | **Decided 2026-09-30:** a reader may edit and delete aliases and versions they created, even under someone else's keyword; the keyword's creator and moderators keep their rights |
| D13 | Backward compatibility for this refactor | — | All | **Decided 2026-09-30:** not kept. Breaking API changes are allowed, and `MIN_CLIENT_VERSIONS` is raised so older extension and desktop installs get 426 and update. All apps ship in one coordinated release, and deprecated code and shims are removed (inventory below), including the alias `name` column (confirmed). Local data: see D14 |
| D14 | Offline data from 3.2 when readers update | Start fresh, with no migration code | Phase 3 | **Decided 2026-09-30:** as proposed. Readers download their novels again, and offline edits not yet sent when the update arrives are lost |

## Phase tracker

Story points are relative estimates, not dates. Status values: Not started · In progress · Blocked (reason) · In review · Done (date).

| Phase | Deliverable | Points | Depends on | Ships in | Status |
| --- | --- | ---: | --- | --- | --- |
| [1 — Foundations](01-foundations.md) | Real-database test harness and fake API; extension tests in `make test` and CI; permission rules (D12) and UI gating; stable `QueryClient`; fetch-all-pages helper; online-only actions disabled offline | 5 | — | Offline-first release | In review (2026-09-30) |
| [2 — Backend sync API](02-backend-sync-contract.md) | Required client IDs and `baseUpdatedAt`, stale-write and duplicate 409s with codes, partial updates, nullable clears, protocol version, D12 rule, alias names as `nameAr`/`nameEn`, raw stored text (D11), raised client floors, desktop client and dashboard updates | 8 | — | Offline-first release | In review (2026-09-30) |
| [3 — Local store, outbox and projection](03-local-store-outbox-and-projection.md) | Fresh database with one clean schema, transactional `enqueue` with coalescing, pure projection and rule mirrors | 8 | 1 | Offline-first release | In review (2026-09-30) |
| [4 — Sync runner and conflict engine](04-sync-runner-and-conflict-engine.md) | Background runner with lock and leases, scheduler, transport, classification, three-way merge, backoff, account scoping, protocol guard, alarms, badge | 8 | 2, 3 | Offline-first release | In review (2026-09-30) |
| [5 — Pull and cache freshness](05-pull-and-cache-freshness.md) | Atomic full pulls with pruning, stale-while-revalidate for cached novels, page data from views, tab refresh, downloads through the runner | 5 | 3, 4 | Offline-first release | In review (2026-09-30) |
| [6 — UI integration](06-ui-integration.md) | Hooks on views and `enqueue`, forms send changes, cross-context reactivity, sync status popover, alias name fields, removal of the old engine and extension shims | 8 | 3, 4, 5 | Offline-first release | In review (2026-09-30) |
| [7 — Conflict resolution UX](07-conflict-resolution-ux.md) | Sync status page, an issue card and actions per kind, notifications, analytics | 5 | 6 | Offline-first release | In review (2026-09-30) |
| [8 — Offline image uploads](08-offline-image-uploads.md) | Queued image blobs, idempotent uploads, pending previews | 3 | 6 | Offline-first release | In review (2026-09-30) |
| [9 — Delta sync](09-delta-sync.md) | Change feed written by database triggers; cursor refresh of novels, lookups and the catalogue | 5 | 2, 5 | Offline-first release | In review (2026-09-30) |
| [10 — Rollout, hardening and docs](10-rollout-hardening-and-docs.md) | Coordinated release across four apps, fresh-start and forced-update checks, end-to-end matrix, documentation | 3 | 1–9 | Offline-first release | In progress (2026-09-30: merged to `develop` locally; browser, staging and release checks open) |

Total: 58 points.

- Phases 1 and 2 can run in parallel.
- Work lands as reviewed pull requests on `feature/offline-v2` branches in the extension, backend, desktop client and dashboard submodules. They merge and release together once phase 10's exit criteria pass; there is no interim release (D13). As built: the work was committed straight to those branches (no pull requests) and, at the owner's request, merged to `develop` locally on 2026-09-30 before phase 10's browser and staging checks; it is still unreleased. See [Review handoff](#review-handoff).
- Only phase 1's test harness and CI wiring may merge to `develop` early (not done: the harness targets the new engine, so it ships with it), because they change nothing for readers.
- The order of deploys within the release is in [phase 10](10-rollout-hardening-and-docs.md#release-order).

## Compatibility cleanup inventory (D13)

`make deprecations` reports **0** formal `@deprecated` markers, so the cleanup targets the informal shims kept for old clients or old local data. Every hit of the review's search is classified here.

| Item | Where | Action | Phase |
| --- | --- | --- | --- |
| Old offline pool and sync engine: `storylens-sync-state`, temp IDs, `isDirty`, `withTranslatedName` (payloads queued before names were translated), the unused `refreshDownloadedNovel`, the no-op `ensureCatalogNovelCached` | `apps/extension/src/lib/offline/*` | Delete; nothing is imported from it | 3, 6 — **Done** |
| Dexie upgrade chain, versions 1–8 of `storylens-offline` | `apps/extension/src/lib/offline/db.ts` | New database with one clean schema; delete the old database and pool key on update | 3 — **Done** |
| Alias `name` column ("old clients read only this") and the fallbacks around it (`aliasNames`, `aliasNameColumns`) | backend schema and reader and dashboard routes; `apps/dashboard/src/lib/translation.ts` and keyword forms; `apps/client/src/backend/api.ts`; extension alias forms, display and matching | Migrate to `nameAr`/`nameEn` only, like keywords; drop `name` | 2, 6 — **Done** (also the client's `aliasNamesOf` fallback) |
| Stored sessions in the old `role` format (`LEGACY_ACCESS`) | `apps/extension/src/lib/auth/auth-store.ts` | Remove. A stored session that cannot be parsed but has a token reloads the user from `/auth/me` before any guest is created | 6 — **Done** |
| HTML-escaped stored text and its decoders (`decodeStoredText`) | backend `utils/sanitize.ts`; `apps/extension/src/lib/desktop-client/novel-context-prompt.ts` | Store raw text, migrate existing rows, delete the decoders (D11) | 2, 6 — **Done** (also the desktop client's own `decodeStoredText`) |
| Kept: deprecation tooling and the client-version floor (`apps/backend/src/lib/compat/*`, `apps/extension/src/api/client-compat.ts`) | backend, extension | Keep: it is the mechanism this release uses (426) and future releases rely on | — |
| Kept: desktop pairing feature detection (`apps/client/src/types.ts:18`; `apps/extension/src/lib/desktop-client/background.ts:84`) | client, extension | Keep: a local protocol with desktop installs that update by hand; not an API shim | — |
| Kept: range bounding in `apps/backend/src/routes/admin/version-ranges.ts:35` | backend | Keep: a general range rule; only its comment mentions legacy data | — |

## Findings checklist

Tick a finding when the phase that closes it records its test or manual check in that phase's verification log.

- **Critical:**
  - [x] Q1 (3)
  - [x] W1 (3, 4, 6)
  - [x] M1 (2, 3, 4)
- **High:**
  - [x] Q2 (4)
  - [x] W2 (6)
  - [x] W3 (3, 4)
  - [x] M2 (3, 4)
  - [x] R1 (4)
  - [x] R2 (4)
  - [x] P1 (3, 5)
  - [x] P2 (3, 5)
  - [x] P3 (5)
  - [x] P4 (5)
  - [x] P13 (2, 3)
  - [x] C1 (2, 4, 7)
  - [x] C2 (4, 7)
  - [x] A1 (1, 3)
  - [x] A2 (4)
  - [x] S1 (4)
  - [x] T1 (1)
- **Medium:**
  - [x] Q3 (4)
  - [x] W4 (6)
  - [x] W5 (2, 6)
  - [x] W6 (3, 6)
  - [x] M3 (3)
  - [x] R3 (4)
  - [x] R4 (4)
  - [x] R5 (7)
  - [x] P5 (5)
  - [x] P6 (5)
  - [x] P7 (1, 5)
  - [x] P8 (5)
  - [x] P9 (5)
  - [x] C3 (2, 4, 7)
  - [x] C4 (2, 4)
  - [x] A3 (4)
  - [x] S2 (4, 5)
  - [x] U1 (1)
  - [ ] U2 (5, 6) — page side tested; popup side (Dexie `storagemutated` across contexts) needs a browser check
  - [x] U3 (6)
  - [x] U4 (4, 5)
  - [x] U5 (5, 6)
  - [x] U6 (8)
  - [x] T2 (1)
- **Low:**
  - [x] W7 (6)
  - [x] M4 (3)
  - [x] P10 (3, 5)
  - [x] P11 (3)
  - [x] P12 (5)
  - [x] C5 (2)
  - [x] S3 (5)
  - [x] U7 (1)
  - [x] U8 (6)

## How to work with this tracker

1. **Starting a phase:** set its status to In progress here and in the phase file's header, and confirm that the decisions it needs are no longer Open.
2. **During a phase:**
   - Tick tasks in the phase file as they merge into the feature branches.
   - Add rows to its verification log: date, check, result, and evidence (test names, commands, commit SHAs).
   - Put throwaway reproductions in a scratch directory, never in the repository.
3. **Repository rules** (root `AGENTS.md`):
   - Commit in the submodule first, then the umbrella pointer.
   - Run `bun run typecheck` in all five submodules after every task, and the backend tests for backend changes.
   - Update affected docs and `AGENTS.md` files in the same change.
   - Keep every `CLAUDE.md` as `@AGENTS.md`.
4. **Finishing a phase:**
   - Run its exit criteria and the [pattern scans](findings.md#pattern-scan-to-repeat-after-each-phase).
   - Tick its findings above and its inventory rows.
   - Set Done with the date.
5. **Changing the plan:** edit the affected phase and the [architecture](architecture.md) together, and record the reason in the decisions table (add a row) so later phases do not rely on stale design.

## Definition of done

- [ ] Every finding above is closed, or has a recorded decision (all but U2's popup side, which needs a browser check).
- [x] Every row of the compatibility cleanup inventory is done or kept with its reason.
- [x] The [architecture invariants](architecture.md#invariants) are enforced by tests and scans.
- [ ] The fresh-start and forced-update checks and the end-to-end matrix ([phase 10](10-rollout-hardening-and-docs.md)) pass in Chrome and Firefox.
- [ ] Docs, instructions, the analytics catalog and the changelog describe the shipped behaviour, and `docs/intro.md` no longer lists this tracker as active (docs are updated; the index entry stays until release).

## Implementation status (2026-09-30)

Commits on `feature/offline-v2`: backend `c9a30da`, `8de7ad7`; extension `57e49a1`, `df14ea8`, `c726009`, `454ce48`, `c72f22e`, `997df77`; client `ea24581`, `879e2b0`; dashboard `ab2e4f9`, `4dc1080`; umbrella `34d4614` and later. At the owner's request the four submodules and the umbrella were merged into `develop` locally (no-fast-forward merges, not pushed) before the browser, staging and release checks of phase 10. Nothing is released.

**Verified (automated):** typecheck in all five submodules; backend 77 tests with `make test-live` on a disposable database (sync contract, replays and races, stale writes, codes, D12 matrix, partial updates and clears, protocol and 426 floors, change feeds and pruning, upload replay, alias-name and raw-text migrations with fixtures, stored-text scan); extension 140 tests on `fake-indexeddb`, a fake browser and a fake API (projection, coalescing, validation, permissions, 50 concurrent enqueues from two contexts, snapshot pulls with pending changes, cleanup, runner scenarios for lost responses, dead workers, merges, conflicts, 401/426/5xx/429, network drops, dependencies, accounts, old API, reruns, deadlines, alarms; pulls, delta sync, page data, downloads, images, resolution actions and pull scenarios; component tests with happy-dom for gating, the stable query client, cross-context invalidation and storage-unavailable mode); client 33 tests and build; dashboard 48 Playwright tests; website 212. Pattern scans match their allowed lists. Projection of 2,000 keywords with 4,000 children and 200 mutations: about 1 ms in Bun. Full pull of a 2,000-keyword novel against a local backend: about 6.1 MB, 0.35 s; delta refresh with no changes: 115 bytes, 10–23 ms; change-feed triggers add about 13 µs per written row.

**Deviations from the plan (decide or accept):**

- `MIN_CLIENT_VERSIONS` is `3.2.2` for both clients: any version the release bump produces is served and every install up to 3.2.1 gets 426. Local development builds report 3.2.1 until the bump, so they are refused by a local backend on this branch.
- `HttpError` stores the code as `errorCode` (Elysia treats an error's own `code` as its type); responses still send `code`.
- Deleting a category or nature is refused when an alias uses it too (the server checked versions only).
- The moderator range-overlap mirror was not added: the reader API does not check overlap either.
- Issue cards edit and resend inline (name, `from` or start chapter) instead of opening the full prefilled form (owner accepted).
- No toast with **Review** appears when a run ends with new conflicts (7.3, owner accepted); the navbar turns red and cards read "Needs attention", which opens the Sync status page.
- The merge to `develop` happened before the phase 10 browser and staging checks (owner request); a local development build (3.2.1) gets 426 from a local `develop` backend until the release bump.
- A deduplicated upload that returns another file's ID is adopted by rewriting the users' `imageId`.
- Change-feed cursors hold back behind changes younger than a minute (late-committing transactions).
- A local-only lookup-in-use check sees only novels on the device; the server stays the authority.
- The alias migration stops (with a list) when a backfilled name collides; dev data passed, production data must be checked on staging.

**Per-phase detail:** each phase file now has its status, ticked tasks, open items marked **Open (2026-09-30)** with the reason, an *Implementation notes* section and a filled verification log. Items that will not be done by owner decision are marked **Won't do** or **Not applicable** with the reason; they stay unticked.

**Found and fixed after the first pass:** refused deletes (category in use, base version) wrote nothing and showed nothing; they now show the reason (extension `c726009`). **Create again** for an alias or version whose keyword was deleted on the server would have been rejected again; it is now refused up front (extension `997df77`).

**Not verified here (phase 10, needs a browser or staging):** Dexie `storagemutated` delivery from the worker to the popup and launcher iframe (a change-counter check covers misses), Firefox launcher-iframe storage partitioning (6.7), the manual checklists of phases 1 and 6–8, RTL layout of the new popover, dialog and Sync status page, performance budgets in a real Chrome profile, migrations on a production copy, re-running the store screenshot capture, and the release order. The new strings are machine-drafted in Arabic and need a native review.

## Review handoff

For a reviewer (for example Codex) checking this work against the plan. Everything is local: nothing is pushed or released.

**What to diff.** Each repository has `develop` = a no-fast-forward merge of `feature/offline-v2`; the merge's first parent is the pre-refactor `develop`.

| Repository | Path | Review range | Size |
| --- | --- | --- | --- |
| Backend | `apps/backend` | `git diff 0fd2528 develop` (or `develop^1..develop`) | 41 files, +2,484 −666 |
| Extension | `apps/extension` | `git diff 21f7922 develop` | 676 files, +21,162 −5,010; 576 of them are the regenerated Orval client in `src/api/generated/` (review `src/lib/offline/`, `src/lib/auth/`, `src/entrypoints/`, `src/components/` and `test/` by hand) |
| Desktop client | `apps/client` | `git diff 9ed44f2 develop` | 6 files, +84 −27 |
| Dashboard | `apps/dashboard` | `git diff 357e63a develop` | 108 files, +165 −170, mostly the regenerated client |
| Umbrella | `.` | `git diff bada1ee develop -- . ':!apps'` | this plan, `docs/`, root `Makefile`, `AGENTS.md`, changelog draft |

**Where to start.** [Architecture](architecture.md) is the design; each phase file lists its tasks with **Done**, **Open**, **Won't do** or **Not applicable** notes, an *Implementation notes* section with deviations, and a verification log. The [findings](findings.md) are ticked in the checklist above, each against the phase that closed it. The code map: backend `src/lib/sync/` and the synced routes; extension `src/lib/offline/` (`db`, `outbox`, `projection`, `snapshot`, `rules/`, `sync/`, `hooks/`) and `test/offline/`, `test/ui/`.

**How to re-run the checks.**

```bash
make typecheck                                   # all five submodules
cd apps/extension && bun run test                # 140 tests (fake IndexedDB, browser and API; happy-dom)
cd apps/backend && TEST_DATABASE_URL=postgresql://…/storylens_test make test-live   # 77 tests; disposable database only
cd apps/backend && make deprecations             # 0 dated deprecations (D13)
cd apps/client && bun test                       # 33 tests
cd apps/dashboard && bun run test                # 48 Playwright tests
```

The [pattern scans](findings.md#pattern-scan-to-repeat-after-each-phase) should match their allowed lists (last run 2026-09-30).

**Points worth a reviewer's attention.** The deliberate API break and raised client floors (D13, `MIN_CLIENT_VERSIONS` 3.2.2); the three migrations (`20260930100000_alias_names_only` stops on a name collision, `20260930100100_store_raw_text` decodes HTML entities, `20260930100200_sync_change_feed` adds triggers); the runner's lease and lock handling and `classify`; the local rule mirrors in `rules/validation.ts` against the backend rules; and the deviations listed under Implementation status.

**Not verifiable without a browser, staging or a release** (open in phases 1, 6, 7, 8 and 10): `storagemutated` delivery between the worker, popup and launcher iframe; Firefox iframe storage partitioning; RTL layout; the manual checklists; performance in a real Chrome profile; migrations on a production copy; re-running the store capture; the release order; a native Arabic review.
