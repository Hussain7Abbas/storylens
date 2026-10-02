# Review handoff: lenses work in progress, Settings → AI, background AI forms, Arabic diacritics

Written for a Codex review. Nothing is committed; every change is in the working trees of `apps/backend`, `apps/dashboard`, `apps/extension` and the umbrella (`pricing-plan/`, `docs/`). The plan tracker is [`pricing-plan/main.md`](pricing-plan/main.md) (decisions D1–D26).

## What was asked

1. Implement the lenses and cloud AI plan (`pricing-plan/`). Done so far: backend phases 2–5 and dashboard phase 8; phase 1 is partly done (coin assets, dashboard `LensCoin`). Not started: website (6–7), extension (9–10) and release (11).
2. Remove the OpenRouter model env var. Add a dashboard **Settings** page with **Configs** and **AI** tabs. The AI tab has text-model and image-model dropdowns fetched from OpenRouter and saved as configs, shows each model's pricing, says how much the lens price must rise, and warns when a model would lose money (D24).
3. For the AI keyword suggestion, do not open the extension popup. Show a loading card under the launcher circle, then open the form by itself when the answer is in, unless a popup is already open and in use (D25).
4. Arabic matching always ignores diacritics (حركات), and keyword names are saved without them (D26).

## What to review

### Models from configs (D24)

| Area | Where |
| --- | --- |
| Config keys and validation (`AI_Text_Model`, `AI_Image_Model`, model ID regex) | `apps/backend/src/lib/billing/config.ts` |
| `OPENROUTER_MODEL` removed | `apps/backend/src/env.ts`, `src/lib/ai/client.ts`, `.env.example` |
| Cloud routes take models from config | `apps/backend/src/routes/ai-cloud.ts`, deprecated `src/routes/ai.ts` |
| Model catalogue (OpenRouter `/models`, 10-minute cache, image price estimate) | `apps/backend/src/lib/ai/model-catalog.ts`, `src/routes/admin/ai-models.ts`, `test/model-catalog.test.ts` |
| Pricing records no longer have model columns | migration `20261002103504_lenses` (edited in place; it was only ever applied to a disposable test database), `src/routes/admin/ai-pricing.ts` |
| Settings page and tabs | `apps/dashboard/src/pages/settings.tsx`, `src/pages/configs.tsx` (`ConfigsPanel`), `src/app.tsx` (redirects from `/configs` and `/ai-pricing`) |
| Model pickers, cost table, loss warning and confirmation | `apps/dashboard/src/components/settings/ai-settings.tsx`, `src/lib/ai-cost.ts` |

### Background AI form from a text pick (D25)

`apps/extension/src/entrypoints/content/page-popup-launcher.ts`:

| What | Line |
| --- | --- |
| `PopupTab.background` (`started`, `timer`) | type near the top |
| `openInBackground`: new hidden tab, spinner card, `active ??= tab`, 8 s no-start fallback | 1114 |
| `finishBackground`: opens only when panel, chooser and picker are closed; otherwise sets `outcome` | 1139 |
| `checkBackgroundTabs`: started by a task or a working state, ended when neither is working | 1151 |
| Chooser hook: AI on with context goes to the background, at the tab limit it falls back to `open()` | 1423 |
| `showTab` and `discardTab` clear `background`; `collectTabs` skips background tabs; `tabCard` and `renderTasks` list them | — |

Intended behavior:
- A pick with **Use AI** on closes the chooser and leaves the panel closed. A card reads "{text} - Generating keyword" with a spinner.
- When the suggestion task ends (done or failed), the tab opens beside the launcher. It does not open while the reader has a panel, the chooser or the picker open; in that case the card shows the check or cross and the status dot shows ready.
- Clicking the card early shows the form while it loads, and it then never opens by itself later.
- With AI off, nothing changes.

### Arabic diacritics (D26)

| Area | Where |
| --- | --- |
| Diacritic set and helpers (identical in both apps; uses `\u{…}` escapes) | `apps/backend/src/utils/arabic.ts`, `apps/extension/src/utils/arabic.ts` |
| Name writers: reader and admin, keywords and aliases | `apps/backend/src/routes/keywords.ts:64`, `keyword-aliases.ts`, `admin/keywords.ts`, `admin/keyword-aliases.ts` |
| `assertHasName` now runs on the cleaned names in reader creates (a name made only of marks was previously accepted) | `keywords.ts`, `keyword-aliases.ts` POST |
| Searches strip the query | `keywords.ts:136`, `admin/keywords.ts` list |
| Data migration (collision-safe, sync triggers fire) | `apps/backend/prisma/migrations/20261002120000_arabic_diacritics/migration.sql` |
| Page matcher: diacritics after every Arabic letter and prefix, `\p{M}` in word boundaries, NFD alternatives, stripped lookups for replacements, tatweel after a marked prefix | `apps/extension/src/utils/content-processor.ts` (`withTatweel` 87, `findKeywordMatch` 107, prefix 138, `termPattern` 190) |
| Offline outbox strips keyword and alias names | `apps/extension/src/lib/offline/outbox.ts:257` |
| Search, extraction dedupe, image passages, form seeds | `src/utils/fuzzy-search.ts`, `src/lib/desktop-client/chapter-extraction.ts`, `character-image.ts`, `popup.extract/extraction-view.tsx`, `popup.home/tabs/coloring/coloring-form.tsx` |

Points worth a second look:
- Tatweel counts as a diacritic. Hamza and madda marks (U+0653–U+0655) are kept because they form letters.
- In the migration, a name whose stripped form is already used in the same novel (keywords) or keyword (aliases) is left unchanged. The matcher ignores the marks either way.
- An offline edit queued before the migration can hit `STALE_WRITE` once the migration bumps that row's revision. This is the usual conflict flow.
- Stacked prefixes (و + ال) were never supported and still are not.

## Automated checks run

- Backend: `bun run typecheck` is clean. The full suite with the live database (`STORYLENS_LIVE_DB_TEST=1` against `storylens_lenses_test`) passes 177 tests, including the new `test/arabic-names.test.ts`.
- Migration `arabic_diacritics`: applied to the test database with seeded rows. Collisions were skipped and the rest stripped, `SyncChange` update rows were written, and the helper function was dropped. The test rows were then removed.
- Extension: `bun run typecheck` and Biome are clean (only existing warnings). `bun run test` passes 321 tests.
  - New tests: `test/arabic-keyword-matching.test.ts` (6), `test/offline/store/outbox.test.ts` (2), `test/fuzzy-search.test.ts`, `test/chapter-extraction.test.ts`, `test/character-image.test.ts` and `test/ui/page-popup-launcher.test.ts` ("AI form from a text pick", 6).
  - On the old code, 6 of the 10 matcher tests fail. The first two launcher tests fail, then that run hangs and was stopped.
- Dashboard: typecheck and `src` lint are clean, and `tests/billing.spec.ts` passes 16 tests (Settings and AI tab included).
- Client and website: typecheck is clean (not changed).

## Manual test steps

1. Dashboard → Settings → AI.
   - Pick a costly text model (for example a large reasoning model). The cost table should mark losses and show the lens price needed, and saving should ask for confirmation.
   - Pick back `google/gemini-2.5-flash` and save. Check that `AI_Text_Model` changed under the Configs tab.
2. Extension on an Arabic novel page.
   - Pick a word with Use AI on. The panel must stay closed and a spinner card must show under the launcher. When the answer arrives, the form opens by itself with the details filled in.
   - Repeat while another popup tab is open on screen. The finished form must not appear, and its card should show a check instead.
3. Matching and names.
   - Create the keyword `محمد`. A page with `مُحَمَّدٌ` and `بِمُحَمَّد` highlights both, and the page text keeps its marks.
   - Saving `مُحمّد` as a second keyword reports that the name is taken.
   - Pick `مُحَمَّد` from the page: the form's name shows `محمد`.

## Known limits

- The 8-second fallback for a form whose AI request never starts is not covered by a test, because it would need fake timers.
- The extension's Use AI switch still defaults to on. D20 turns it off with the cloud AI release (phase 10).
- `docs/` and the plan describe the current state. Phase 11 still owns the legal text and the release.
