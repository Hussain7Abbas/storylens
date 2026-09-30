# Phase 7 — Conflict and issue resolution UX

[Global tracker](main.md) · **Status: In review (implemented 2026-09-30)** · **Estimate: 5 points** · **Depends on: 6** · **Ships in: the offline-first release (branch `feature/offline-v2`)**

## Goal

Every change that could not be synced automatically is visible, explained in plain language, and resolvable in one or two clicks. Nothing needs attention silently, and nothing is discarded without the reader's decision.

**Closes:** R5, and the user-facing parts of C1, C2, C3 and A2.

## Tasks

### 7.1 Sync status page

- [x] Add a popup route `sync` (`popup/routers.tsx`), reached from the navbar popover, row warning badges and conflict toasts. It uses the existing routing (`useRoutes`), with navbar **Back** returning to the origin.
- [x] Sections:
  1. **Needs attention:** `conflict` and `rejected` mutations of the current account, grouped by novel, then entity.
  2. **Made while signed in as {user}:** other accounts' mutations.
  3. **Waiting to sync** (collapsed): pending, waiting and sending, with each item's last error and next attempt time.
- [x] Each item shows the entity type and its readable name (keyword name, alias name, version chapter range, replacement `from → to`, lookup name) in the UI language, and the novel.

### 7.2 Issue cards and actions

Each action calls the phase 3 `applyResolution` or `discardMutation` and then `syncKick`.

| Kind | Explanation (localized) | Actions |
| --- | --- | --- |
| `stale` | "Changed on Story Lens since your edit" | Per field: **Keep mine** or **Use theirs**, as a table of field, yours, theirs and original. Bulk **Keep all mine** and **Use all theirs**. **Apply** |
| `deleted` | "Deleted on Story Lens after your change" (covers dashboard merges) | **Discard** (default), **Create again** |
| `duplicate` | The server's message, for example "Keyword name already exists for this novel" | **Edit** (opens the prefilled form; saving replaces the change), **Discard**, and for keywords **Show existing** (opens the coloring tab searched to that name) |
| `parent-missing` | "Its keyword (or category or nature) no longer exists" | **Discard**, with the text shown and **Copy** |
| `rule` | The server's message, for example "startingChapter must be greater than the current latest version" | **Edit**, **Discard** |
| `permission` | "Only the creator or a moderator can change this" | **Discard** |
| Other account | "Made while signed in as {user}" | **Sign in** (opens the website profile page), **Discard** |

- [x] **Discard** confirms first. When dependants exist (for example aliases created under a discarded keyword), the dialog lists them and discards them together.
- [x] **Create again** turns an update of a deleted row into a create under a new ID, using the viewed values. For aliases and versions it needs an existing parent, and otherwise offers only **Discard**. — **Done (2026-09-30):** an alias or version needs its keyword on the device or in an unsent create; otherwise it is refused with `PARENT_NOT_FOUND` (tested).
- [x] Field labels reuse the form labels. Values are formatted: category and nature names instead of IDs, `ch.X–Y` for ranges, matching type labels, and image thumbnails. — **Done (2026-09-30):** category and nature names, `ch.N` chapters, matching labels and a thumbnail of the server's image (`ValueCell`).

### 7.3 Notification

- [ ] When a run ends with new `conflict` or `rejected` mutations, the popup (if open) shows a toast with **Review**. The badge is red while anything needs attention (phase 4). — **Won't do (owner decision, 2026-09-30):** no toast with **Review**; **Sync now** shows a summary toast and the navbar turns red.
- [x] Entity badges from phase 6 link to their issue card. — **Done (2026-09-30):** "Needs attention" badges open the Sync status page.

### 7.4 Accessibility and localization

- [x] Keyboard: every action is reachable; focus moves to the next card after a resolution; dialogs trap focus. Mantine defaults plus checks. — **Done (2026-09-30):** cards are focusable (`data-issue-card`) and focus moves to the card that took the resolved one's place; dialogs are Mantine's.
- [x] Screen readers: cards are labelled with the kind and entity name; comparison tables use table semantics.
- [x] Arabic and RTL: mirrored layout; values keep their own direction (`dir="auto"`).
- [x] Add every string to English and Arabic with `bun run i18n:parse`.

### 7.5 Analytics

- [x] `sync_issue_resolved` with `kind` (`stale`, `deleted`, `duplicate`, `parent-missing`, `rule`, `permission`, `other-account`) and `resolution` (`keep_mine`, `use_theirs`, `merge`, `edit`, `discard`, `recreate`, `sign_in`). Track it once, when the resolution is applied.
- [x] Update the catalog in `apps/extension/AGENTS.md` in the same pull request; `sync_conflict_detected` already exists from phase 4.

## Tests

| # | Test | Expected |
| --- | --- | --- |
| 1 | Resolution logic (pure, on top of phase 3's `applyResolution`): keep mine, use theirs, mixed fields, all theirs | Patch, base and status as in the [resolution table](architecture.md#resolution-actions); an empty patch removes the mutation |
| 2 | Discard with dependants | Parent and dependants removed together; the view returns to the server state |
| 3 | Create again for a deleted keyword with pending alias updates | New create with a new ID; alias updates offered for discard (their parent is gone) |
| 4 | Duplicate, then Edit, rename and save | Mutation patch replaced; `pending`; sent on the next run |
| 5 | Other-account item, then Sign in as that account | Items move out of the section and sync |

Manual:

1. Two browser profiles on the same account edit the same keyword description offline, then sync. The second profile shows a `stale` card; try both choices.
2. A moderator merges a keyword into another in the dashboard while a reader has a pending edit. A `deleted` card appears; try Discard and Create again.
3. Two devices create the same keyword name. A `duplicate` card appears; rename it.
4. A reader loses ownership on the server (change `createdById` locally). A `permission` card appears.
5. Everything above in Arabic, with the keyboard only.

## Exit criteria

- [x] Every conflict and rejection kind the runner can produce has a card and at least one action that removes it from Needs attention. — **Done (2026-09-30):** every kind has a card with **Discard**, plus its kind-specific actions.
- [x] Automated tests pass; typecheck passes in all five submodules; the analytics catalog matches `rg "trackEvent\(|trackAnalyticsEvent\(" src`.

## Docs

- `docs/extension.md`: describe the Sync status page, the issue kinds and what each action does.

## Implementation notes (2026-09-30)

- **Edit** for `duplicate` and `rule` edits the refused field inline on the card (the UI-language name, a replacement's `from`, or a version's start chapter) and resends, instead of opening the prefilled form (owner accepted as the better UX). A duplicate keyword offers **Show existing**, which selects the novel and opens the coloring tab searched to the name (`store/show-existing.ts`).
- **Sign in** opens the website login page (not the profile page).
- Tests 3, 4 and 5 are automated in `test/offline/sync/resolution.test.ts`.

## Verification log

| Date | Check | Result | Evidence |
| --- | --- | --- | --- |
| 2026-09-30 | Resolution logic: field choices, empty patch removal (test 1) | Pass | `test/offline/store/outbox.test.ts` › resolves conflicts field by field |
| 2026-09-30 | Discard with dependants (test 2) | Pass | same test |
| 2026-09-30 | Tests 3–5 | Pass | `test/offline/sync/resolution.test.ts` |
| 2026-09-30 | Manual list (two profiles, dashboard merge, keyboard-only, Arabic) | Not run | Needs browsers |
| 2026-09-30 | Analytics catalog matches `rg "trackEvent\(|trackAnalyticsEvent\(" src` | Pass | `apps/extension/AGENTS.md` |
