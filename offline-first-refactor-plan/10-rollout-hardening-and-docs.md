# Phase 10 — Rollout, hardening and docs

[Global tracker](main.md) · **Status: In progress (2026-09-30): merged to develop locally; browser, staging and release checks open** · **Estimate: 3 points** · **Depends on: 1–9** · **Ships in: the offline-first release**

## Goal

Release the backend, extension, desktop client and dashboard together (D13). Prove the fresh start and the forced updates, verify the edge cases end to end in both browsers, update every document, and remove the one-time cleanup in the following release.

## Release order

There is one coordinated release and no compatibility layer, so the order of steps matters. Bump versions and publish with `make deploy` only when the owner asks for the release (root `AGENTS.md`).

| Step | What happens | Readers see |
| --- | --- | --- |
| 1. Merge | The `feature/offline-v2` branches of all four apps merge to `develop` once 10.1–10.3 pass (**done early on 2026-09-30 at the owner's request**, before the browser checks; local merges, not pushed) | — |
| 2. Back up | Take a production database backup right before the backend deploy (the alias-name and raw-text migrations are not reversible) | — |
| 3. Extension | Submitted to the Chrome Web Store. During review it runs against the **old** API: the protocol guard pauses sync and local edits are kept | Reviewers: "Sync paused until Story Lens updates" |
| 4. Desktop client | The new build is published before the backend deploys, so readers can update as soon as the floor rises | — |
| 5. Backend | Deploys itself once the store publishes the extension (the `review-version-watcher` runs `make sync`). It applies the migrations and raises `MIN_CLIENT_VERSIONS` | Old extensions get 426, check for the update and reload into it. Old desktop clients show "Download the latest Story Lens Client" |
| 6. Dashboard | Deployed right after the backend, because its alias forms need the new API | A few minutes in which dashboard alias edits fail |

The website does not change.

## Tasks

### 10.1 Before merging

- [x] Rebase every branch on `develop`. Run `make test`, `make typecheck`, and `bun run check` in the extension. — **Done (2026-09-30):** `develop` had not moved (no rebase needed); all suites and typechecks pass; Biome is clean in every changed file (pre-existing findings elsewhere remain).
- [x] Run the pattern scans; every hit must match its allowed list in [findings](findings.md#pattern-scan-to-repeat-after-each-phase). — **Done (2026-09-30):** Run on the branches on 2026-09-30 (all hits match); run again after the rebase.
- [x] Every row of the [compatibility cleanup inventory](main.md#compatibility-cleanup-inventory-d13) is done or kept with its reason. — **Done (2026-09-30):** Done on the branches: see the inventory in main.md.
- [ ] Check the performance budgets in a real Chrome profile and log them:
  - building the view of a 2,000-keyword novel takes under 50 ms in the background;
  - popup list first render takes under 150 ms;
  - `enqueue` takes under 30 ms;
  - a full pull of a 2,000-keyword novel on a normal connection takes under 3 s;
  - a delta refresh of the same novel with no changes takes under 300 ms.
- [ ] Every finding in [findings](findings.md) is closed by a test or a manual check recorded in its phase's verification log.

### 10.2 Fresh-start, forced-update and migration checks

- [ ] **Fresh start:** install 3.2.1 in a new profile, download two novels and make offline edits, then update to the release build. Confirm:
  - `storylens-offline` and `storylens-sync-state` are gone, and nothing was read from them;
  - the new database starts empty, the catalogue and lookups load on the first popup open, and pages highlight on demand;
  - the downloads list is empty and the release notes say so.
- [ ] **Old extension, new API:** 3.2.1 against the release backend gets 426 and asks the store for the update.
- [ ] **Old desktop client, new API:** shows the `CLIENT_OUTDATED` message.
- [ ] **New extension, old API** (the store-review situation):
  - sync is paused with the "until Story Lens updates" status;
  - edits stay in the outbox;
  - after switching the backend to the release build, everything syncs with no duplicates.
- [ ] **Migrations on a copy of production data** (staging):
  - The alias-name and raw-text migrations complete, or stop with a list; fix the data and run them again.
  - The change-feed triggers record writes, including a dashboard keyword merge.
  - Spot-check aliases without letters, Arabic and English aliases, and names with apostrophes and quotes.

### 10.3 End-to-end matrix (Chrome and Firefox; toolbar popup, launcher popup, extraction panel)

| # | Scenario | Pass when |
| --- | --- | --- |
| 1 | Offline: add, edit and delete keywords, aliases, versions and replacements; reconnect | Server equals the local view; outbox empty |
| 2 | Online save, then close the popup at once (throttled network) | Synced within a minute; nothing lost or duplicated |
| 3 | Stop the service worker during a sync (`chrome://serviceworker-internals`) | Resumes; no duplicates |
| 4 | Two profiles, same account, different fields of one keyword offline | Both changes on the server; no prompt |
| 5 | Two profiles, the same field | Conflict card on the second; both resolutions work |
| 6 | Dashboard moderator edits while a reader's edit is pending | Merge, or conflict for the same field |
| 7 | Dashboard merge (keyword → alias) with a pending reader edit | `deleted` card; Discard and Create again work |
| 8 | Same keyword name created on two devices | `duplicate` card; renaming works |
| 9 | Sign out on the website with pending changes; sign back in | Held under "signed in as …", then synced; never sent as the other account |
| 10 | Session revoked on the server | "Sign in again" state; resumes after signing in |
| 11 | Backend stopped for 30 minutes | No exhaustion; visible backoff; syncs after the restart |
| 12 | `MIN_CLIENT_VERSIONS` raised above the build | "Update required" state; nothing lost |
| 13 | Switch the UI language offline on a cached novel | Highlights in the new language |
| 14 | Keyword `D'Artagnan` created offline, synced and pulled | Highlights before and after the sync; stored as typed (P13, D11) |
| 15 | Reader edits an alias they added under someone else's keyword (D12) | Allowed and synced; a third reader cannot |
| 16 | Remove a download with pending changes | Dialog; each option behaves as described |
| 17 | Download a novel with more than 500 keywords | Complete |
| 18 | Novel deleted on the server while downloaded with pending edits | Banner; the edits appear as `deleted`; the download is removable |
| 19 | Another device edits a keyword on a page the reader has open | Highlights update after the next refresh (pinned: next run; cached: within 10 minutes of use) |
| 20 | Attach an image offline, then reconnect | Uploads once and links to the entry |
| 21 | Firefox launcher iframe | Sees and writes the same data as the toolbar popup (or through the proxy) |
| 22 | Another device deletes a keyword and renames a replacement in a downloaded novel | The next refresh is a delta pull (small request in the network panel), and both changes appear |

### 10.4 Rollback policy

- [ ] There is no compatibility layer, so problems are **fixed forward**:
  - An extension build older than this release gets 426 from the new backend. Republishing one would not help.
  - Rolling back only the backend is the emergency option. The new extension then sees the old protocol and pauses sync (nothing is lost; reading works). The database needs the step 2 backup, because the migrations cannot be reversed; changes made since the deploy would be lost. Use it only for a severe server fault.
- [ ] Record the backup's location and a tested restore command in the verification log before step 5.

### 10.5 After release

- [ ] Watch the backend logs for a week:
  - `STALE_WRITE`, `ID_CONFLICT`, `UNIQUE_VIOLATION`, and 409 and 422 rates on the synced routes (a steady `ID_CONFLICT` or 422 rate means a client bug);
  - `OUTDATED` lines, which should fall as installs update.
- [ ] Watch the analytics counts for `sync_conflict_detected` and the resolution mix of `sync_issue_resolved`. Many `discard` resolutions of one kind suggest a validation gap to fix before enqueue.

### 10.6 Cleanup in the next release

- [ ] Delete `upgrade-cleanup.ts`, its call sites and its tests. It only matters for installs updating straight from 3.2.x, which the raised floor makes rare.
- [ ] Nothing else is deferred: this refactor adds no dated deprecations (D13).

### 10.7 Documentation (in the merge that ships)

- [x] `docs/extension.md`:
  - rewrite "Account and synchronization" (snapshot, outbox and views, the runner, conflicts and the Sync status page, account holding, offline images, pull timing, the protocol guard);
  - update the "Main areas" offline bullet;
  - describe alias names and per-row edit permissions;
  - replace the sentence about local data being moved to the Arabic fields (that upgrade code no longer exists);
  - update the test command.
- [x] `apps/extension/AGENTS.md`:
  - rewrite "API and offline data" with the [invariants](architecture.md#invariants) as rules;
  - remove the lines about old stored `role` sessions and alias `name` fallbacks;
  - add the analytics catalog rows (`sync_manual_requested`, `sync_conflict_detected`, `sync_issue_resolved`);
  - add `test` to the commands.
- [x] `docs/backend.md` and `apps/backend/AGENTS.md`: the sync API (phase 2) and the required upload `id` (phase 8).
- [x] `docs/dashboard.md` and `docs/client.md`: alias name fields; the desktop crawler's client IDs.
- [x] `docs/compatibility.md`: this release deliberately broke compatibility and raised both floors (D13); the policy stays for later work.
- [x] `docs/changelog/<version>.md` (per `docs/changelog/README.md`), with reader-facing notes:
  - reliable offline editing, conflict handling and Sync status;
  - "download your novels again for offline use";
  - "update the desktop client".
- [x] `docs/chrome-store/README.md`: re-check the offline-save capture steps against the new UI. Update `apps/extension/CHROMEWEBSTORE.md` if the listing text mentions offline behaviour. — **Done (2026-09-30):** script and README updated; the capture itself was not re-run.
- [ ] `docs/intro.md`: mark this tracker done, or remove its link once the work is merged and documented. — **Open (2026-09-30):** the index says the work is merged to `develop` and lists the remaining owner checks; remove the link after the release.
- [x] Every `CLAUDE.md` stays `@AGENTS.md` only.

## Exit criteria (whole refactor)

- [ ] Every finding in [findings](findings.md) is closed, or recorded with a decision, in [main](main.md). — **Open (2026-09-30):** all but U2's popup side (a browser check).
- [x] Every inventory row is done or kept with its reason.
- [ ] The checks in 10.2 and the end-to-end matrix pass in Chrome and Firefox.
- [ ] Docs, instructions, the analytics catalog and the changelog match the shipped behaviour.

## Implementation notes (2026-09-30)

- Only 10.7 (documentation) was done, in the same change: `docs/extension.md`, `docs/backend.md` (Sync API), `docs/compatibility.md` (the deliberate break), `docs/dashboard.md`, `docs/client.md`, `docs/development.md`, `docs/intro.md`, `docs/changelog/v3.3.0.md` (draft; version is a placeholder), and the backend, extension, client and dashboard `AGENTS.md`. `docs/chrome-store/capture.mjs` and its README were updated for the new database (snapshot seeding, per-language names, outbox check) but the capture was not re-run; `apps/extension/CHROMEWEBSTORE.md` needs no change.
- Everything else in 10.1–10.6 needs a browser, staging or the release itself and is open.

## Verification log

| Date | Check | Result | Evidence |
| --- | --- | --- | --- |
| 2026-09-30 | Documentation (10.7) | Done except the Chrome Web Store capture docs | umbrella `34d4614` |
| 2026-09-30 | 10.1–10.6 | Not started | — |
| 2026-09-30 | Pre-merge checks (10.1): typecheck ×5, all test suites, scans | Pass | backend 77 (live), extension 140, client 33 re-run before the merge; dashboard 48 and website 212 from the earlier run (no changes since) |
| 2026-09-30 | Performance (partial, not a real Chrome profile) | Projection ~1 ms; full pull ~0.35 s; empty delta 10–23 ms (local backend) | phase 3 and phase 9 logs |
| 2026-09-30 | Merge to `develop` (owner request, before 10.2–10.3) | Done locally in the four submodules and the umbrella; not pushed | see main.md |
