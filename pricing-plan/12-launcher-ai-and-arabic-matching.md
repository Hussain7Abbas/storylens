# Phase 12 — Background AI forms and diacritic-free Arabic matching

[Global tracker](main.md) · **Status: Done (not committed)** · **Estimate: 3 points** · **Depends on: D25, D26** · **Ships in: 3.4.0**

## Goal

Two requests the owner made during implementation (2026-10-02):

- **D25.** "For the AI keyword suggestion there is no need to display the extension main page; add a loading tab under the launcher circle and, when it completes, show the form automatically (if no popup is already open and in use)."
- **D26.** "Arabic matching should always ignore حركات and match by characters only; saving keywords strips حركات before saving."

## Tasks

### 12.1 AI form out of sight (extension, D25)

- [x] `openInBackground` in `content/page-popup-launcher.ts`: a text pick with **Use AI** on loads its form in a new hidden `PopupTab` (`background` set). The panel stays closed and the tab's card shows "{text} - Generating keyword" with a spinner right away.
- [x] `checkBackgroundTabs`/`finishBackground`: the request has started once a task or a working state arrives, and has ended once neither is working (done or failed). The tab then opens beside the launcher, but only while the panel, the chooser and the text picker are all closed. Otherwise its card keeps the check or cross and the status dot shows ready.
- [x] Showing the tab by any path (its card, the button) clears `background`, so it never opens itself later. `collectTabs` never asks a background tab to go.
- [x] If no request starts within 8 s, the form opens anyway. At the six-tab limit the form opens the usual way.
- [x] Tests: `test/ui/page-popup-launcher.test.ts` "AI form from a text pick" (6).

### 12.2 Names without diacritics (backend, D26)

- [x] `src/utils/arabic.ts` covers tanween, the short vowels, shadda, sukun, the dagger alif, Quranic marks and tatweel. The hamza and madda marks stay. `cleanKeywordName` is applied by every keyword and alias write (reader and admin) before the name checks.
- [x] Reader creates validate the cleaned names, so a name made only of marks is `NAME_REQUIRED`. Reader and admin keyword searches strip the query.
- [x] Migration `arabic_diacritics` strips stored names, skipping a name whose stripped form is already used in its novel (keywords) or keyword (aliases). The sync triggers publish the changed rows.
- [x] Tests: `test/arabic-names.test.ts` (unit and live).

### 12.3 Matching by letters (extension, D26)

- [x] `src/utils/arabic.ts` uses the same set as the backend, plus `nameKey` and `lettersPattern`.
- [x] The page matcher allows diacritics after every Arabic letter of a term and its prefixes (ال and single letters), and keeps the page's marks in the highlight. Word boundaries count marks as part of the word, and a marked prefix gets one tatweel. Replacements match the same way.
- [x] `enqueue` strips keyword and alias names like the API. Forms seed picked text stripped. Search (`fuzzyMatches`), chapter-extraction dedupe and parents, extraction-view parent lookup and image passages (`chapterMentions`) compare letters only.
- [x] Tests: `test/arabic-keyword-matching.test.ts`, `test/offline/store/outbox.test.ts`, `test/fuzzy-search.test.ts`, `test/chapter-extraction.test.ts`, `test/character-image.test.ts`.

### 12.4 Docs

- [x] `docs/extension.md`, `docs/backend.md`, `docs/dashboard.md`, `apps/extension/AGENTS.md`, `apps/backend/AGENTS.md`, `apps/dashboard/AGENTS.md`.

## Follow-ups in other phases

- Phase 10 (10.2a): the cloud keyword suggestion must keep reporting its task, so a background tab opens when it ends. A lens refusal counts as a failure, and the Use AI switch defaults to off (D20).

## Implementation notes

- Tatweel is treated as a diacritic, because it never changes the letters.
- Stacked prefixes (و + ال) were never matched and still are not.
- An offline edit queued before the migration may hit `STALE_WRITE` for a row the migration changed; the normal conflict flow resolves it.

## Verification log

| Date | Check | Result | Evidence |
| --- | --- | --- | --- |
| 2026-10-02 | Extension `bun run test` | Pass (321) | new matcher tests fail 6/10 on the old matcher |
| 2026-10-02 | Backend `bun run test` with the live test database | Pass (177) | |
| 2026-10-02 | `arabic_diacritics` on seeded rows in the test database | Pass: collisions kept, others stripped, `SyncChange` rows written, helper function dropped | |
