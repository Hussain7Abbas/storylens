# Phase 2 — Backend sync API

[Global tracker](main.md) · **Status: Not started** · **Estimate: 8 points** · **Depends on: none (can run in parallel with phase 1)** · **Ships in: the offline-first release, together with the extension, desktop client and dashboard (D13)**

## Goal

Give the extension a sync-ready API and remove the API's compatibility shims:

- idempotent creates with client IDs;
- stale-write detection;
- machine-readable errors with meaningful statuses;
- partial updates, and the ability to clear fields;
- one naming model for aliases;
- raw stored text;
- a protocol version.

Backward compatibility is **not** kept (D13). Requests are validated against the new contract, older extension and desktop releases are refused with 426, and the desktop client and dashboard change in the same release.

**Closes (server side):** C1, C3, C4, C5, M1, W5, and P13 at the source. **Implements:** D2, D11 and D12. **Inventory:** removes the alias `name` shim and HTML-escaped storage.

## Tasks

### 2.1 Errors

- [ ] `src/utils/errors.ts`: `HttpError` gains `code` and optional `details`. Every error thrown by a synced route carries a `code`.
- [ ] `src/server.ts` `onError` returns `{ message, code, ...details }`.
- [ ] `src/schemas/common.ts`: `errorSchema` gains `code`, and a conflict schema adds `current`. A test proves both survive Elysia's response normalization, including the global `guard({ response: { 404, 500 } })`.
- [ ] Codes live in `src/lib/sync/error-codes.ts`. Statuses follow their meaning:

  | Code | Status | Thrown at |
  | --- | --- | --- |
  | `NOT_FOUND` | 404 | Lookups by ID on the synced routes |
  | `PARENT_NOT_FOUND` | 404 | Creates whose novel, keyword, category or nature is missing (`keywords.ts:235-237`, `keyword-versions.ts:82-84`, `keyword-aliases.ts:72-74`) |
  | `NOT_OWNER` | 403 | Ownership checks (`middleware/authorize.ts`) |
  | `STALE_WRITE` | 409 | Precondition (2.3), with `current` |
  | `ID_CONFLICT` | 409 | Client-ID check (2.2) |
  | `KEYWORD_NAME_TAKEN`, `ALIAS_NAME_TAKEN`, `REPLACEMENT_EXISTS`, `LOOKUP_NAME_TAKEN` | 409 (was 400) | Duplicate checks in keywords, aliases, replacements, categories and natures |
  | `UNIQUE_VIOLATION` | 409 (was 500) | Prisma `P2002`, mapped globally |
  | `NAME_REQUIRED` | 422 | `assertHasName` |
  | `REPLACEMENT_BIDIRECTIONAL` | 400 | `replacements.ts:330-346` |
  | `VERSION_CHAPTER_REQUIRED`, `VERSION_NOT_AFTER_LATEST` | 400 | `keyword-versions.ts:98-112` |
  | `VERSION_ONLY_PROTECTED`, `VERSION_BASE_PROTECTED` | 400 | `keyword-versions.ts:240-251` |
  | `CATEGORY_IN_USE`, `NATURE_IN_USE` | 400 | `keyword-categories.ts:229-236`, `keyword-natures.ts:190-195` |

- [ ] Global mapping in `onError`: `P2002` → 409 `UNIQUE_VIOLATION`, `P2025` → 404 `NOT_FOUND`.

### 2.2 Client IDs (required)

- [ ] `id: t.String({ format: "uuid" })` is **required** on the POST bodies of `keywords`, `keyword-aliases`, `keyword-versions`, `replacements`, `keyword-categories` and `keyword-natures`. `versionId` (the base version's ID) is **required** on `POST /keywords`. Novels are online-only (D6) and unchanged.
- [ ] `src/lib/sync/replay.ts` runs **before** duplicate and rule checks:
  - Found, same model, same creator and same parent (novel or keyword): return the existing row in the route's 200 shape. Skip every side effect (version auto-close, replacement chain rewrite, base version creation).
  - Found otherwise: 409 `ID_CONFLICT`.
  - Categories and natures have no creator column. A moderator replay returns the existing row when the names and color match, and 409 otherwise.
- [ ] Race: two identical replays at once. Catch `P2002` on the primary key inside the create, read again and return the existing row.

### 2.3 Stale-write preconditions (required)

- [ ] `baseUpdatedAt: t.String({ format: "date-time" })` is **required** on the PUT bodies of the same six resources.
- [ ] `src/lib/sync/precondition.ts`: when `existing.updatedAt` is later than `baseUpdatedAt` (millisecond precision, since Prisma `DateTime` is `timestamp(3)`), it throws 409 `STALE_WRITE` with `current` in the route's 200 shape.
- [ ] One order in every synced PUT: 404 → 403 → 409 stale → rule and duplicate checks → write. `baseUpdatedAt` is never written; every route builds `data` field by field (checked).
- [ ] Deletes stay unconditional (D2).

### 2.4 Partial updates everywhere

- [ ] `PUT /replacements/:id` takes optional `from`, `to` and `matchingType`, plus `baseUpdatedAt`. `novelId` leaves the body: validation uses the stored row's novel and the merged values. Every other synced PUT is already partial.

### 2.5 Clearing fields (W5)

- [ ] Version and alias PUTs accept `null` for `description` and `imageId`, which clears them. A version's `categoryId`/`natureId` stay non-nullable; the base version needs them for highlighting.

### 2.6 Alias names: remove the `name` shim

- [ ] One migration (no expand and contract; D13):
  1. Fill `nameAr`/`nameEn` from `name` where the name's script column is empty (today's `aliasNames` rule).
  2. Names without letters (digits, symbols) go into every language column the parent keyword is named in, so they keep highlighting where they do today.
  3. Stop with a list if any alias would end up with no name, or would break the new unique constraints `[keywordId, nameAr]` and `[keywordId, nameEn]`. Fix that data first; never drop it.
  4. Drop `name` and its unique index, and add the two constraints.
- [ ] Reader alias routes take `nameAr`/`nameEn` (`translatedNameBody`, at least one on create), check uniqueness per language, and stop returning `name`.
- [ ] Dashboard alias routes and keyword merges (`admin/keyword-aliases.ts`, `admin/keywords.ts:360-524`) use the same model.
- [ ] Remove `aliasNames` and `aliasNameColumns` from `src/utils/translation.ts`, and `scriptLanguage` if nothing else uses it.
- [ ] Dashboard: remove `aliasNames` from `src/lib/translation.ts`; alias forms edit `nameAr`/`nameEn` like keyword forms; run `make dashboard-orval`.
- [ ] Desktop client: `createAlias` sends the UI language's field, as `createKeyword` does (`apps/client/src/backend/api.ts`).
- [ ] Extension: phase 6 updates forms, display and matching.

### 2.7 Raw stored text (D11)

- [ ] `sanitize()` in `src/utils/sanitize.ts` keeps trimming and stops HTML-escaping. List every caller of `sanitize` and `sanitizeObject` and confirm that none depends on escaping.
- [ ] A migration decodes `&lt;`, `&gt;`, `&quot;` and `&#x27;` once in every text column those callers write: novels, keywords, aliases, versions, replacements, categories, natures and chapters. Take the exact column list from the caller review.
- [ ] Add a backend `AGENTS.md` rule, and a test that scans `apps/{extension,dashboard,website}/src` for `innerHTML` and `dangerouslySetInnerHTML`. Stored text is plain, so no client may insert it as HTML. Today none does (checked).
- [ ] The extension deletes `decodeStoredText` in phase 6.

### 2.8 Alias and version edit rights (D12)

- [ ] `keyword-aliases.ts` and `keyword-versions.ts` PUT and DELETE allow a moderator, the row's own `createdById`, or the parent keyword's creator. Add `assertOwnsAnyOf([row.createdById, row.keyword.createdById], user)` in `middleware/authorize.ts`.

### 2.9 Protocol version and client floors

- [ ] `GET /api/user/sync/protocol` returns `{ version: 2 }`. Version 2 is this release's whole contract, including phase 9's change feeds. APIs from before this release answer 404, which the extension treats as too old.
  - Register it in `src/routes/user.ts` and add a `USER_ENDPOINT_DESCRIPTIONS` entry.
  - GET defaults to guest access.
  - `test/permissions.test.ts` must pass.
- [ ] Raise `MIN_CLIENT_VERSIONS` (`src/lib/compat/client-version.ts`) for `extension` and `desktop` to this release's versions. Older extensions get 426 and ask the store for the update (`client-compat.ts`). Older desktop clients show "Download the latest Story Lens Client" (`CLIENT_OUTDATED`, `apps/client/src/backend/api.ts:84`).

### 2.10 Lookup uniqueness fix (found during the review)

- [ ] The category and nature routes check uniqueness with `findFirst({ where: { nameEn: body.nameEn } })`:
  - An `undefined` name removes the filter and matches any row.
  - The popup sends `""` for an empty name, so two Arabic-only lookups collide.
  - Normalize empty names to `null`, and check each provided language.

### 2.11 Desktop client

- [ ] `apps/client/src/backend/api.ts`:
  - `createKeyword` sends `id` and `versionId`, and `createAlias` and `createVersion` send `id` (`crypto.randomUUID()`);
  - alias names are sent as in 2.6;
  - the crawler treats 409 `*_NAME_TAKEN` as "already exists" and continues.
- [ ] Update the client's tests and docs.

## Tests (`apps/backend/test/`, plus the dashboard and client suites)

| # | Test | Expected |
| --- | --- | --- |
| 1 | POST keyword with `id` and `versionId` | 200; the row and base version use those IDs |
| 2 | The same POST again (replay) | 200; same row; no second version; no duplicate-name error |
| 3 | POST with an `id` owned by another user or another novel | 409 `ID_CONFLICT` |
| 4 | Two replays in parallel | Both 200 with the same row; one row stored |
| 5 | Version and replacement create replays | No second auto-close; no second chain rewrite |
| 6 | POST without `id`; PUT without `baseUpdatedAt` | 422 |
| 7 | PUT with the current `baseUpdatedAt` / an older one | 200 / 409 `STALE_WRITE` with `current` equal to `GET` |
| 8 | Not the owner with a stale base | 403 `NOT_OWNER` (ownership first) |
| 9 | Partial replacement update (`to` only) | Only `to` changes; uniqueness checked with the stored `from` |
| 10 | Each rule and duplicate in 2.1 | The listed status and code |
| 11 | Forced `P2002` and `P2025` | 409 `UNIQUE_VIOLATION`, 404 `NOT_FOUND` |
| 12 | `null` description and image on version and alias PUTs | Cleared |
| 13 | D12 matrix: alias and version by their creator on another's keyword, keyword owner, third reader, moderator | Allowed, allowed, 403, allowed |
| 14 | Alias migration fixtures: Arabic, English, digit-only under a bilingual keyword, both columns, a duplicate after backfill | Columns filled as specified; the duplicate stops the migration with a report |
| 15 | Raw-text migration fixtures with each entity; new writes of `D'Artagnan` and `<b>` | Stored decoded; new writes stored as typed |
| 16 | `GET /sync/protocol` | 200 `{ version: 2 }` for guest, reader and moderator |
| 17 | Requests with `X-Client-Version: extension/3.2.1` and an older `desktop/…` | 426 with `X-Min-Client-Version` |
| 18 | Two Arabic-only categories | Both created |
| 19 | Desktop client: crawler creates a keyword, an alias and a version, then runs again | IDs sent; the second run treats 409 as existing |
| 20 | Dashboard: create and rename an alias through the forms | `nameAr`/`nameEn` saved; no `name` |

## Cross-submodule follow-up

- [ ] Run `make orval` and `make dashboard-orval`, and commit both generated clients.
- [ ] The dashboard's `src/lib/permissions.ts` needs no change (no admin routes added).

## Exit criteria

- [ ] `bun run test` passes in the backend, the dashboard and the client; `make deprecations` is clean; typecheck passes in all five submodules.
- [ ] Every test above is automated.
- [ ] Every caller of `sanitize` is listed in the verification log with its decision.

## Docs and instructions

- `docs/backend.md`: a "Sync API" section covering required IDs and `baseUpdatedAt`, the codes and statuses, partial updates, clears, the protocol endpoint, alias names and raw text.
- `apps/backend/AGENTS.md`:
  - synced resources take a client `id` on create and `baseUpdatedAt` on update;
  - replays skip side effects;
  - codes are a contract;
  - stored text is plain and never inserted as HTML;
  - aliases use `nameAr`/`nameEn`.
- `docs/compatibility.md`: record that this release deliberately broke compatibility and raised both client floors (D13). The policy itself is unchanged for later work.
- `docs/dashboard.md` and `docs/client.md`: alias name fields and the crawler's IDs.

## Risks

| Risk | Mitigation |
| --- | --- |
| Response normalization strips `code` or `current` | The schema declares them; test in 2.1 |
| The alias migration meets ambiguous or duplicate names | It stops and lists them; fix the data first, never drop it |
| A later change inserts stored text as HTML | `AGENTS.md` rule and the scan test in 2.7 |
| Store review runs the new extension against the old API | The protocol guard (phase 4) pauses sync; reading and local edits keep working |
| Desktop installs update by hand | The raised floor shows the existing "Download the latest Story Lens Client" message |

## Verification log

| Date | Check | Result | Evidence |
| --- | --- | --- | --- |
| | | | |
