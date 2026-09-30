# Phase 9 — Delta sync

[Global tracker](main.md) · **Status: Not started** · **Estimate: 5 points** · **Depends on: 2, 5** · **Ships in: the offline-first release (decision D4)**

## Goal

Refresh downloaded and cached novels, the catalogue and the lookups by downloading only what changed since the last refresh, including deletions, with an exact server-ordered cursor. Phase 5's full pull stays for three cases: the first download of a novel, an expired cursor, and a weekly reconciliation.

**Why now (D4):** without it, every downloaded novel downloads all of its keywords and replacements again about every 10 minutes while the browser is open.

## Design

- **A change feed, not timestamps.** A `SyncChange` table (`seq BIGSERIAL`, `entity`, `entityId`, `novelId`, `op`, `at`) records every insert, update and delete of keywords, aliases, versions, replacements, website novel biases, novels, categories and natures. The `seq` gives an exact order, so there are no ties at the same millisecond and no clock skew.
- **Three feeds:**
  - per novel (`novelId`): the novel row, keywords, aliases, versions, replacements and biases;
  - lookups: categories and natures (`novelId` is `null`);
  - the catalogue: novel rows only.
- **Written by Postgres triggers**, added through a Prisma migration with raw SQL, not by route code. The data changes in at least eleven delete paths plus bulk updates:
  - reader routes: `keywords.ts:395`, `keyword-aliases.ts:191`, `keyword-versions.ts:253`, `replacements.ts:273`, `keyword-categories.ts:238`, `keyword-natures.ts:197`, `novels.ts:416`, `website-novel-biases.ts:85, 147`;
  - dashboard routes: `admin/keywords.ts:135, 348` (including merges), `admin/keyword-aliases.ts:118`, `admin/keyword-versions.ts:134`, `admin/novels.ts:222`;
  - database cascades: novel → keywords, replacements and biases; keyword → aliases and versions; website selector → biases;
  - bulk updates such as the replacement chain rewrite (`updateMany`).

  Row-level triggers see all of them.
- **`novelId` for aliases and versions** is read through the parent keyword. When the parent keyword is deleted in the same cascade, the children's changes may be skipped: clients remove a deleted keyword's children themselves.
- **Retention:** a cron job deletes `SyncChange` rows older than 90 days. A cursor older than the oldest kept `seq` answers 410 `CURSOR_EXPIRED`, and the client does a full pull.
- **No backfill:** every install starts with full pulls after the fresh start (D14), so the feed only needs changes from the deploy onwards.
- The feeds are part of protocol version 2 (phase 2), which this release introduces as a whole.

## Tasks

### 9.1 Backend

- [ ] Migration: the `SyncChange` table with indexes `(novelId, seq)`, `(entity, seq)` and `(seq)`, plus trigger functions for each listed table (`AFTER INSERT OR UPDATE OR DELETE … FOR EACH ROW`).
- [ ] `GET /api/user/sync/novels/:id/changes?since=<seq>&limit=1000` returns `{ novel?, keywords, aliases, versions, replacements, biases, deleted: [{ entity, id }], cursor, hasMore }`.
  - It returns the current rows for the changed IDs, with duplicate IDs collapsed, in both languages (it ignores `Accept-Language`).
  - Without `since`, it answers only the current cursor (used before a full pull).
- [ ] `GET /api/user/sync/lookups/changes?since=` and `GET /api/user/sync/catalogue/changes?since=` work the same way.
- [ ] Register the routes in `src/routes/user.ts` with `USER_ENDPOINT_DESCRIPTIONS` entries (GET defaults to guest access).
- [ ] Retention cron in `src/plugins/crons.ts`.
- [ ] Measure the trigger overhead on a bulk dashboard operation (for example a keyword merge with many aliases) and log it.

### 9.2 Extension

- [ ] `novelSync.cursor`, plus `syncMeta.lookupsCursor` and `syncMeta.catalogueCursor`.
- [ ] Full pull (phase 5) reads the current cursor **before** fetching (no `since`), fetches and replaces, then stores that cursor. Changes made during the pull are fetched again next time, which is safe because applying rows is idempotent.
- [ ] Delta pull: while `hasMore`, fetch a page and apply it in one transaction:
  - upsert rows (the later `updatedAt` wins);
  - delete removed rows and their children;
  - pending updates of deleted rows become `conflict(deleted)`;
  - a deleted novel is marked `removedOnServer`;
  - store the cursor.
- [ ] `pullDueUnits` (phase 5) uses delta pulls whenever a cursor exists. It falls back to a full pull on 410 or any unexpected response, and does a full pull of each pinned novel once a week as reconciliation.
- [ ] After a delta page changes a novel, tabs showing it get `refreshContent` (phase 5.4).

## Tests

| # | Test | Expected |
| --- | --- | --- |
| 1 | Every delete path and cascade listed above, and the chain rewrite | Each produces the expected feed rows |
| 2 | Server: update A, delete B, create C; client delta pull | Snapshot equals a full pull |
| 3 | A dashboard merge deletes a keyword with a pending local alias update | Keyword and children removed; the update is `conflict(deleted)` |
| 4 | Pagination with more than `limit` changes | Pages applied in order; final cursor equals the last `seq` |
| 5 | Cursor expired (410) | Full pull; cursor reset |
| 6 | Writes during a full pull | Seen by the next delta pull; nothing missed or duplicated |
| 7 | Category deleted; new novel added | The lookups and catalogue feeds apply them |
| 8 | Delta refresh of an unchanged 2,000-keyword novel, against phase 5's full-pull measurement | Bytes and time recorded; the delta is a small fraction of the full pull |

## Exit criteria

- [ ] All tests pass in the backend and extension; typecheck passes in all five submodules.
- [ ] Trigger overhead and the delta and full measurements are in the verification log.

## Docs

- `docs/backend.md`: the change feeds, retention and `CURSOR_EXPIRED`.
- `docs/extension.md`: how downloaded novels stay fresh (delta refresh, weekly reconciliation).

## Verification log

| Date | Check | Result | Evidence |
| --- | --- | --- | --- |
| | | | |
