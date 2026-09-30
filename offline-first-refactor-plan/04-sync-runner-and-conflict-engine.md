# Phase 4 — Sync runner and conflict engine

[Global tracker](main.md) · **Status: Not started** · **Estimate: 8 points** · **Depends on: 2, 3 (the phase 1 fake API implements phase 2's contract)** · **Ships in: the offline-first release (branch `feature/offline-v2`)**

## Goal

A single background runner sends the outbox reliably:

- in order per entity, after dependencies;
- idempotently, and resumable after the worker dies;
- with error classification, backoff and automatic merges;
- with honest conflict states;
- scoped to the signed-in account.

Pulling is phase 5; this phase leaves a `pullDueUnits()` hook that does nothing.

**Closes:** Q2, Q3, W1 (sending side), W3, M1, M2, R1, R3, R4, C1, C2, C3 (codes mapped to conflict kinds), C4, A2, A3, S2, U4 (retry part).

## Module layout (`apps/extension/src/lib/offline/sync/`)

| File | Kind | Responsibility |
| --- | --- | --- |
| `runner.ts` | Background | Lock, deadline, rerun flag, lease recovery, push loop, the pull hook, status, badge, retry alarm |
| `scheduler.ts` | Pure | `pickNext(mutations, { userId, now })` |
| `transport.ts` | Network | **The only module that calls write endpoints**; builds bodies; 20 s timeout per request |
| `classify.ts` | Pure | `(mutation, result or error) → Outcome` |
| `outcome.ts` | Dexie | Applies an outcome to the outbox and snapshot in one transaction; rebases later mutations |
| `protocol.ts` | Network | `GET /api/user/sync/protocol`, cached for an hour in `syncMeta`. A 404 or a version below 2 means the API is too old: the runner stops with `apiOutdated` and sends nothing |
| `status.ts` | Dexie | Derives `SyncStatus`; badge text and color |

## Tasks

### 4.1 Scheduler (pure)

- [ ] `pickNext` implements the [runner rules](architecture.md#one-run). It walks mutations by `seq`:
  - It skips other accounts.
  - It skips any entity that has an earlier mutation which cannot be sent now (in flight, waiting, conflicting, rejected or blocked).
  - It skips mutations whose `dependsOn` include an entity with an unconfirmed create in any status.
  - It returns the first remaining `pending` mutation whose `nextAttemptAt ≤ now`.
- [ ] `nextWakeAt(mutations, now)` returns the earliest `nextAttemptAt` of a mutation that could be sent, for the retry alarm.
- [ ] `manual: true` treats waiting mutations as due (**Sync now**) but never touches `conflict` or `rejected` ones.

### 4.2 Transport

- [ ] Build the bodies from the [transport table](architecture.md#transport):
  - Creates carry `id`, and keyword creates also carry `versionId`.
  - Updates, replacements included, carry only the patched fields plus `baseUpdatedAt` (both required by phase 2).
  - Alias names are sent as `nameAr`/`nameEn`.
  - Cleared fields are `null` in the patch and are sent as `null`.
- [ ] Every call passes `{ timeout: 20_000 }` and an `AbortSignal` tied to the run deadline.
- [ ] Return a discriminated result: `{ ok: true, data }` or `{ ok: false, status?, code?, body?, network?: "offline" | "timeout" | "unknown", retryAfterMs? }`. `isAxiosError` and `ECONNABORTED` are handled here only.

### 4.3 Classification (pure)

- [ ] `classify(mutation, result)` returns `success`, `alreadyDone`, `stale(current)`, `conflict(kind, server?)`, `rejected(kind, message)`, `transient(network | server, retryAfterMs?)`, `auth` or `upgrade`, following the [outcomes table](architecture.md#outcomes):

  | Response | Outcome |
  | --- | --- |
  | 2xx | `success` |
  | 404 on a delete | `alreadyDone` |
  | 404 on an update | `conflict(deleted)` |
  | 404 on a create, or code `PARENT_NOT_FOUND` | `conflict(parent-missing)` |
  | 409 `STALE_WRITE` | `stale(current)` |
  | 409 with `UNIQUE_VIOLATION`, `*_NAME_TAKEN` or `REPLACEMENT_EXISTS` | `conflict(duplicate)` |
  | 409 `ID_CONFLICT` | `rejected(rule)`, with a "create again" hint |
  | Other 400, or 422 (a request the client should never build: logged as a bug) | `rejected(rule)` |
  | 403 | `rejected(permission)` |
  | 401 | `auth` |
  | 426 | `upgrade` |
  | 429 and 5xx | `transient(server)` |
  | No response or timeout | `transient(network)` |

### 4.4 Outcome application

One transaction per outcome, over `mutations`, the snapshot tables and `syncMeta`:

- [ ] **success:**
  - Upsert the returned rows (`snapshot.upsertRows`) and remove the mutation.
  - Keyword creates write the keyword without embedded children, then its versions and aliases (fixes P11).
  - Version creates then read the parent's versions (`GET /keyword-versions?query[keywordId]=…`, every page) and upsert them, because the server closed the previous version.
  - Replacement writes mark the novel due for a pull (the chain rewrite), which phase 5 acts on.
- [ ] **Rebase later mutations:** for each later `pending` mutation of the same entity whose `base` values all equal the response's values, set `baseUpdatedAt` to the response's `updatedAt`. This avoids a pointless 409.
- [ ] **alreadyDone:** remove the row and its cascaded children, and remove the mutation.
- [ ] **stale(current):**
  1. Upsert `current`, then compute `merge(base, patch, current)`.
  2. No conflicting fields and nothing left: remove the mutation (it was a lost-response replay).
  3. No conflicting fields and a remaining patch: store the reduced patch, `base = current`'s values, `baseUpdatedAt = current.updatedAt`, `pending`, due now.
  4. Conflicting fields: `conflict(stale)` with the field list, and the patch unchanged, so the view still shows the reader's values.
  5. Allow at most 3 automatic merges per mutation per run. After that the mutation waits for backoff, so two clients cannot ping-pong.
- [ ] **conflict / rejected:** store the kind, the server row when known and `lastError`. `conflict(deleted)` removes the snapshot row.
- [ ] **transient:** `attempts + 1`; `nextAttemptAt` from the [backoff formula](architecture.md#outcomes) or `Retry-After`; `lastError`. Stop the loop on `network`. Stop after 3 consecutive `server` failures in one run.
- [ ] **auth / upgrade:** return the mutation to `pending` without counting an attempt. Set the runner state (`authRequired` / `upgradeRequired`) and stop. On `upgrade`, the existing `client-compat.ts` handler already asks the store for an update.
- [ ] Every outcome increments `syncMeta.changeCounter`.

### 4.5 Runner

- [ ] `runSync({ reason, manual, pull })` follows the [run algorithm](architecture.md#one-run):
  - `navigator.locks.request("storylens-sync", { ifAvailable: true })`. When the lock is taken, record `rerun` and return.
  - Recover leases: `inflight` rows whose `leaseUntil` has passed go back to `pending`, with no attempt counted.
  - Read the signed-in user; stop with `authRequired` when there is none.
  - Check the protocol version; stop with `apiOutdated` when it is missing or older than 2.
  - Push loop until a deadline of about 4 minutes, checking the stored user before each pick so an account switch stops the loop.
  - `pullDueUnits()` (phase 5).
  - Status and badge; the retry alarm; rerun if requested.
- [ ] Leasing (`inflight`, `leaseUntil = now + 90 s`), sending, and applying the outcome are separate steps. The worker can be killed between any two without losing or duplicating work.
- [ ] A per-run summary (`sent`, `merged`, `conflicts`, `rejected`, `transientFailures`, `pulledUnits`, `durationMs`) is logged without payloads and returned to **Sync now**.

### 4.6 Background wiring

- [ ] Messages in `entrypoints/background/messaging.ts`:
  - `syncKick({ reason, pull })` returns immediately, after updating the badge;
  - `syncNow()` returns `SyncRunSummary` and the status;
  - `getSyncStatus()` returns `SyncStatus`.
- [ ] Remove `triggerFullSync` and `runSyncCycle` once phase 6 switches the callers (both live on the same branch).
- [ ] Alarms:
  - `storylens-periodic-sync` every 5 minutes, created only when missing (kept from phase 1; keep the name, or a renamed alarm would leave the old one firing);
  - `storylens-sync-retry` as a one-shot at `max(now + 30 s, nextWakeAt)`, cleared when nothing is waiting.
- [ ] Listeners that call `runSync`:
  - `runtime.onStartup` and `runtime.onInstalled` (after the 3.2.x cleanup);
  - the worker `online` event;
  - `storage.onChanged` for `storylens-auth`, which resumes from `authRequired`, holds the previous account's mutations and sends the new account's.
- [ ] Badge from `status.ts`:
  - the count of the current account's unresolved mutations;
  - orange while pending, red when anything needs attention, grey `!` when offline with nothing pending;
  - `99+` cap.

### 4.7 Analytics

- [ ] `sync_conflict_detected` with `kind` (`stale`, `deleted`, `duplicate`, `parent-missing`, `rule`, `permission`), sent from the background through `trackAnalyticsEvent()` when a mutation enters `conflict` or `rejected`. It carries no IDs or content.
- [ ] Add the event to the catalog in `apps/extension/AGENTS.md` in the same pull request.

## Tests

Integration tests use `fake-indexeddb`, `fake-browser`, `fake-api` with phase 2 behaviour on (unless noted), and a fake lock manager implementing `navigator.locks.request` with `ifAvailable`.

| # | Scenario | Expected |
| --- | --- | --- |
| 1 | Offline: create keyword K, alias A, version V and edit K's base version; then run online | 3 POSTs (the base-version edit is folded into K's create), server rows use the client IDs, outbox empty, view equals server (replaces R-3, R-12) |
| 2 | POST reaches the server but the response is lost (network error after the server stored it) | Next run replays; the server returns the row; one row on the server (C4) |
| 3 | PUT applied but the response is lost | Replay gets 409; the merge finds every field equal; the mutation is removed |
| 4 | Worker "killed" after leasing (the run is abandoned) | Next run after the lease expires sends it; no duplicate |
| 5 | Remote edit of another field before sending | 409, automatic merge, re-send; the server has both changes; no conflict (C1) |
| 6 | Remote edit of the same field | `conflict(stale)` with the field; the view shows the reader's value; later mutations of that entity wait; **other entities are still sent** |
| 7 | Remote delete, local update | `conflict(deleted)`; snapshot row removed (C2) |
| 8 | Local delete, remote update | Delete succeeds |
| 9 | Delete of an already deleted row | Success (replaces R-4) |
| 10 | Duplicate keyword name created on another device | 409 `KEYWORD_NAME_TAKEN` → `conflict(duplicate)` |
| 11 | Parent keyword deleted remotely, local alias create | `conflict(parent-missing)` |
| 12 | Ownership changed on the server (403) | `rejected(permission)`; others continue |
| 13 | 401 in the middle of a run | Runner `authRequired`; no attempts counted; after an auth change event, the remaining mutations are sent (A3) |
| 14 | 426 | Runner `upgradeRequired`; no attempts counted |
| 15 | 503 three times, then 200; a 429 with `Retry-After: 120` | Delays grow within the jitter bounds; `Retry-After` is honoured; no exhaustion (R1, R3) |
| 16 | Network drops in the middle of the loop | Loop stops at the first network failure; retry alarm set to `nextAttemptAt` |
| 17 | Keyword create fails transiently | Its alias and version creates are not attempted and keep `attempts = 0` (R4) |
| 18 | Two updates of one entity; the first is waiting | The second is not sent first |
| 19 | Mutations from account A while B is signed in | Never sent or applied; B's mutations are sent; switching back to A sends A's (A2) |
| 20 | Old API (protocol 404, as during store review) | Runner state `apiOutdated`; nothing sent; mutations untouched; once the fake API reports version 2, the next run sends everything |
| 21 | Second update enqueued while the first is in flight | Sent with the rebased `baseUpdatedAt`; no 409 |
| 22 | Five `syncKick` at once | One run holds the lock, exactly one rerun, no duplicate sends (Q3) |
| 23 | Enqueue from a second Dexie instance during a run | Sent by the rerun or the next loop step; never lost (replaces R-2) |
| 24 | **Sync now** with waiting mutations | Sent immediately; the summary lists what was sent and what needs attention; rejected ones are not retried |
| 25 | 500 mutations, slow fake API | The run stops at the deadline; the next run continues; order is kept |
| 26 | Alarms | Periodic alarm created once; retry alarm matches `nextWakeAt`; cleared when idle |
| 27 | Scheduler property test (random outboxes) | Never picks another account's mutation, a mutation behind an unresolved earlier one of the same entity, or one with an unconfirmed dependency |

## Exit criteria

- [ ] Every test above passes, and the old `test/sync-engine.test.ts` scenarios are expressed against the runner.
- [ ] Pattern scan: write endpoints are called only from `sync/transport.ts` (UI callers remain until phase 6 on the branch; list them in the verification log).
- [ ] Typecheck passes in all five submodules; analytics catalog updated.

## Risks

| Risk | Mitigation |
| --- | --- |
| `navigator.locks` missing in some context | It exists in Chrome service workers and pages (69+) and in Firefox (96+). If it is missing, fall back to a Dexie lease row in `syncMeta` (`runnerLeaseUntil`), because only the background runs the runner |
| The worker is killed in the middle of a long run | Leases, idempotent replays, the deadline and the rerun flag; test 4 |
| Automatic merges loop against another active client | At most 3 merges per mutation per run, then backoff |
| The new extension meets the old API during store review | The protocol guard pauses sync; reading and local edits keep working (test 20) |

## Verification log

| Date | Check | Result | Evidence |
| --- | --- | --- | --- |
| | | | |
