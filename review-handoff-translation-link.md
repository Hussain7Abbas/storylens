# Review handoff: Translation Link in the keyword and alias forms

Written for a Codex review. Nothing is committed; every change is in the working trees of `apps/backend`, `apps/extension`, `apps/dashboard` and the umbrella (`docs/`).

## What was asked

1. In the extension and the dashboard, add an optional **Translation Link** async searchable field to the keyword/alias form, used to link two keywords together. When linked, the override fields (category, nature, image) are auto-filled.
2. When the extension's AI fills a keyword or alias, it should look through the existing keywords in the other language and, when it finds the opposite word, put it in the **Translation Link** field.

Three design questions were answered before implementation:

- **Link model:** reuse the existing *merge*, not a new stored relation. Saving with a link collapses the two rows into the one being saved; the linked row is gone.
- **Scope:** same kind only — keyword ↔ keyword, alias ↔ alias.
- **Autofill:** overwrite category, nature, description and image from the counterpart (not "fill empties only").

## State of the tree

Only the files below are mine. Note that **`apps/website` moved to a new commit during the session** (`5a918a9 feat: enhance SEO and accessibility…`) — not my work; another session or the user did that, and the umbrella's `M apps/website` pointer change is theirs. `docs/website.md`, `pricing-plan/`, `website-plan/` were already modified before this task started.

| Submodule | Files |
| --- | --- |
| backend | `src/lib/keywords/merge.ts` (new), `src/lib/sync/error-codes.ts`, `src/routes/keywords.ts`, `src/routes/keyword-aliases.ts`, `src/routes/admin/keywords.ts`, `src/routes/admin/keyword-aliases.ts`, `test/translation-link.test.ts` (new), `AGENTS.md` |
| extension | `src/components/translation-link-select.tsx` (new), `src/entrypoints/popup.home/tabs/coloring/coloring-form.tsx`, `.../use-keyword-suggestion.ts`, `src/lib/desktop-client/keyword-suggestion.ts`, `src/lib/offline/{outbox,projection}.ts`, `src/lib/offline/rules/validation.ts`, `src/lib/offline/hooks/{reads,mutations}.ts`, `src/lib/offline/sync/outcome.ts`, `public/locales/{en,ar}.json`, `src/api/generated/**` (Orval), `test/helpers/fake-api.ts`, `test/offline/sync/translation-link.test.ts` (new), `test/offline/unit/pure.test.ts`, `AGENTS.md` |
| dashboard | `src/components/ui/keyword-picker.tsx`, `src/components/keywords/keyword-forms.tsx`, `src/pages/match-translations.tsx`, `src/api/generated/schemas/**` (Orval), `tests/{dashboard.spec.ts,fixtures.ts}`, `AGENTS.md` |
| umbrella | `docs/backend.md`, `docs/extension.md`, `docs/dashboard.md` |

**No database migration:** the merge needs no column, so the schema is untouched and the existing `SyncChange` triggers already publish the update and the delete.

## What to review

### Backend: the merge (shared by both portals)

| What | Where |
| --- | --- |
| `absorb`, `takenAliasNames`, `NAME_COLUMNS` moved out of `routes/admin/keywords.ts` unchanged | `apps/backend/src/lib/keywords/merge.ts:29` |
| `mergeTranslationKeyword` (self / other novel / versioned source / same language, `assertMayAbsorb`, missing source ignored) | `merge.ts:136` |
| `mergeTranslationAlias` (same keyword only) | `merge.ts:177` |
| `missingNames`, refusal messages (`TranslationLinkCode`) | `merge.ts:111`, `merge.ts:82` |
| New sync codes | `src/lib/sync/error-codes.ts:25` |
| Reader `POST /keywords` takes `translationKeywordId` inside the create transaction | `src/routes/keywords.ts:316` |
| Reader `PUT /keywords/:id`: merge and the row's own write in one transaction, inside `compareAndSwap` | `src/routes/keywords.ts:402` |
| Reader `POST`/`PUT /keyword-aliases` take `translationAliasId` | `src/routes/keyword-aliases.ts:130`, `:220` |
| Admin `POST`/`PUT /keywords` and `/keyword-aliases` take the same fields (no ownership check; super admin) | `src/routes/admin/keywords.ts`, `src/routes/admin/keyword-aliases.ts` |

Intended behavior:

- The row being saved survives; the linked row is absorbed and deleted. The survivor takes the names it lacks; a keyword also takes the absorbed keyword's aliases, chapter links and replacements (its versions cascade away, which is why a source with more than one version is refused).
- Style is never copied server-side. The client's form already overwrote its own category/nature/description/image from the counterpart and sends them, so a merge carries no style.
- A `translation…Id` pointing at a row that no longer exists is **ignored** (200), so a replayed write does not fail on the row it already merged.
- Readers may absorb only a row they could delete (keyword: creator or moderator; alias: its creator, the parent keyword's creator, or a moderator) → 403 `NOT_OWNER`.
- The existing `POST /api/admin/keywords/:id/link` and `/:id/link-alias` are untouched and keep serving **Match translations**.

Worth a careful look: the order inside the transaction (absorb frees the unique names *before* the survivor takes them) and that a refusal rolls the whole transaction back.

### Extension: offline engine

| What | Where |
| --- | --- |
| `TranslationLink` / `AliasTranslationLink` inputs on create and update | `src/lib/offline/outbox.ts:108`, `:175` |
| `linkedKeyword` / `linkedAlias`: local rule + "may delete" check, a row missing from the view is left to the server | `outbox.ts:668`, `:687` |
| The link enters `patch` but never `base`/`seen`, and is always sent | `outbox.ts:740`, `:811`, `:901`, `:980` |
| `dependsOn` waits for the linked row's unsent create | `outbox.ts:748`, `:816`, `:911`, `:989` |
| Two different links on one row are not folded together | `outbox.ts:545` (`differentTranslations`) |
| Rule mirrors: `canTranslate`, `checkKeywordTranslation`, `checkAliasTranslation` | `src/lib/offline/rules/validation.ts:203`, `:232`, `:246` |
| Projection mirror of `absorb` (names, aliases, replacements, versions, the row itself) | `src/lib/offline/projection.ts:239`, `:313` |
| After a successful push: drop the merged row from the snapshot, mark the novel for a pull | `src/lib/offline/sync/outcome.ts:185`, `:274` |
| Candidate reads (both languages live in the snapshot; ordinary lists filter them out) | `src/lib/offline/hooks/reads.ts:233`, `:255` |

Intended behavior:

- The local view shows the merged result **before** the push: the saved row gains the other name, the linked keyword's aliases move under it, and the linked row disappears from the other language's lists too.
- A link is an action, not a field: a stale-write merge keeps it in `autoPatch` (the server has no such field), so a resend re-applies it and the server ignores it the second time.
- `differentTranslations` is defensive: the local rule already refuses a second link once the row is named in both languages, so it should be unreachable from the UI — it exists so a fold can never silently drop a merge. Flag it if you would rather not keep unreachable code.

### Extension: forms and AI

| What | Where |
| --- | --- |
| `TranslationLinkSelect` (debounced fuzzy `Select`, clearable) | `src/components/translation-link-select.tsx` |
| Keyword form: state, candidates from the names it will be saved with, overwrite-on-pick, late AI link through `loadFormValues` | `coloring-form.tsx:195`, `:253`, `:272`, `:293`, `:419` |
| Alias form: the same, over the parent keyword's siblings | `coloring-form.tsx:628`, `:678`, `:693`, `:850` |
| `keyword_translation_linked` analytics event (`kind`, `source`) | `coloring-form.tsx:375`, `:787` |
| Prompt: candidate list, `"translation": number`, 0 = none, 150 candidates with 160-char descriptions | `src/lib/desktop-client/keyword-suggestion.ts:33`, `:97`, `:135` |
| Parsing into `KeywordSuggestion.translation` (`kind` + `id`) | `keyword-suggestion.ts:169` |
| The hook picks the candidate list from the chooser's `create` and `parentId` parameters | `use-keyword-suggestion.ts:53`, `:77` |

Intended behavior:

- The dropdown offers rows that name a language this row does not and clash with none of its names (`canTranslate`), so a row already named in both languages gets no candidates.
- Picking one overwrites category, nature, description and image, and shows the linked image in the preview. Clearing the link leaves those values (they are this row's now).
- The AI's `translation` is tagged `keyword` or `alias`, so an alias form never adopts a keyword match and vice versa. It arrives at form open (the tab waits for the suggestion), but the candidates load from IndexedDB, so the style is applied through `loadFormValues()` and never replaces a field the reader already edited.

### Dashboard

| What | Where |
| --- | --- |
| `KeywordPicker`: `siblingAlias` mode, `withinKeywordId`, `candidate` filter, `PickedKeyword.style` | `src/components/ui/keyword-picker.tsx:132`, `:163` |
| `match-translations.tsx` fills the new `style` field | `src/pages/match-translations.tsx:104` |
| `isTranslationCandidate`, `translationStyle`, `TranslationLinkField` | `src/components/keywords/keyword-forms.tsx:72`, `:84`, `:98` |
| Keyword form field and body | `keyword-forms.tsx:348`, `:434` |
| Alias form field and body | `keyword-forms.tsx:489`, `:504`, `:577` |

`TranslationLinkField` renders its own label and hint because `Field` clones its child to label it and the picker already owns its combobox markup.

## Automated checks run

- `bun run typecheck` in all five submodules — clean.
- Backend `bun run test` (196 tests, 115 skipped live-database ones) and `bun run deprecations` — clean.
- Extension `bun run test` (366 tests) and `bun run build` — clean. Biome: the 9 remaining findings are all pre-existing (`content.css` `!important`, `novelForm.tsx` fragment, `keyword-tooltip.ts` concatenation).
- Dashboard `bun run typecheck`, `bun run lint`, `bun run build` and `bun run test` (90 Playwright tests, 2 new) — clean.
- Sensitivity checks: disabling the projection mirror fails `translation-link.test.ts`'s view assertion; disabling the snapshot cleanup in `outcome.ts` fails three of its tests.

### Not run — needs your attention

`apps/backend/test/translation-link.test.ts` is a **live-database** test and **was never executed**. The Postgres listening on this machine's 5432 is not the project's (Prisma answered `P1000 Authentication failed`), Docker's daemon was not running, and passing `TEST_DATABASE_URL` on the command line was blocked by this session's credential policy. Please run:

```bash
cd apps/backend && TEST_DATABASE_URL=<disposable db> make test-live
```

The Orval clients were regenerated from the backend's own OpenAPI document, dumped by importing `src/server.ts` and calling `app.handle('/openapi.json')` without listening (no database). The regenerated reader client also drops `getHealth422`/`getHealthReady422`, which is pre-existing drift between the committed client and the current `/health` schema, not part of this change. Re-run `make orval` / `make dashboard-orval` against a real local backend if you want to confirm byte-for-byte.

## Manual test steps

Extension, one novel, two accounts not needed:

1. In Arabic, add a keyword `ليو`. Switch to English, add a keyword `Leo` with a category, nature, description and image.
2. Back in Arabic, edit `ليو`. **Translation link** offers `Leo`; pick it. Category, nature, description and the image preview become `Leo`'s. Save.
3. The Arabic list shows one `ليو`; switching to English shows one `Leo` — the same row. The page highlights it in both languages. `Leo` is gone as a separate entry.
4. Repeat offline: the Coloring list updates at once, the card shows "Pending", and after **Sync now** the row stays merged with no duplicate.
5. Add an English alias to that keyword, then edit its Arabic alias: **Translation link** offers only that keyword's own aliases.
6. Pick text on a novel page with **Use AI** on, for a word whose other-language entry already exists: the form opens with **Translation link** already filled in, and its style copied from the match.
7. Dashboard → a novel's profile → edit a keyword named in one language: **Translation link** lists the novel's other keywords, skips any that already have a different name in this keyword's language, fills the style on pick, and saving merges them.

## Known limits

- **Readers can only link rows they may delete.** Linking someone else's keyword gives 403 (the dropdown hides those). That follows the existing delete rule; say if readers should be allowed to merge any row in a novel.
- **Alias links stay inside one keyword.** Linking aliases of two different keywords would silently move an alias out of the other keyword, so it is refused; the keyword-level link is the tool for that (it absorbs aliases wholesale).
- **A keyword with later versions cannot be absorbed** (its version history would be erased). The admin `POST /:id/link` still allows that, as before; only the new form path refuses it.
- Between the push and the next pull, a replacement that pointed at the absorbed keyword reads as unlinked locally; the `pullDue` flag fixes it on the next refresh.
- The desktop client's wiki crawler was not touched: it still creates keywords and aliases without translation links.
- The AI is given at most 150 candidates with 160-character descriptions. A novel with more entries in the other language may not have the right one in the list.
