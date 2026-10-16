# API and data compatibility

[Documentation index](intro.md) · [Backend API](backend.md)

The extension and desktop client are installed apps: store review, auto-update delays and readers who never restart mean several releases call the API at once, and the backend deploys before most of them update. The website and dashboard are redeployed separately from the backend. Every API and database change must therefore keep working for the oldest client still in use. This page is the policy; the enforced rules live in the [root](../AGENTS.md) and [backend](../apps/backend/AGENTS.md) instructions.

## The offline-first release (a deliberate break)

The offline-first changes are merged to `develop` locally and remain unreleased (decision D13). The synced reader routes changed without a compatibility layer: creates require client IDs, updates require `baseUpdatedAt`, error statuses changed (duplicates are 409), aliases lost their `name` column, and stored text is no longer HTML-escaped. The backend, extension, desktop client and dashboard are planned to ship together. `MIN_CLIENT_VERSIONS` is 3.2.2 for both installed clients: identified older clients and unversioned callers of the changed sync write routes get 426. Local Chrome development builds now report 3.2.2; previously loaded 3.2.1 builds need a reload or replacement. While the new extension waits in store review it meets the old API: its protocol check (`GET /api/user/sync/protocol`) fails, sync pauses and local edits are kept. The policy below still applies to every later change.

## Evolve instead of versioning

`/api/user` and `/api/admin` are version 1 of the reader and dashboard APIs. Permission keys are route templates (`GET /api/user/novels/:id`), so a `/v2` mount would duplicate every permission and role grant. Treat a new URL version as a last resort that needs its own plan.

| Safe (ship any time) | Breaking (needs the deprecation cycle below) |
| --- | --- |
| New endpoint | Removing or renaming an endpoint or field |
| New optional request field or query parameter | Making an optional input required, or tightening validation |
| New response field | Changing a field's type, unit, format or meaning |
| New enum value that clients already tolerate | New enum value that old clients would reject or mishandle |
| Looser validation | Changing error status codes or the `{ message }` error shape |

Clients must tolerate unknown response fields and unknown enum values, and the backend must accept requests from any supported client release.

## Deprecation cycle

1. **Add the replacement** (new route, new field) alongside the old one, and ship clients that use it.
2. **Mark the old one deprecated** with a removal date:
   - Route: the `deprecated` route option, `{ deprecated: { since: 'YYYY-MM-DD', removeAfter: 'YYYY-MM-DD', replacement?, link? } }`. It marks the route deprecated in OpenAPI, so Orval adds `@deprecated` to generated clients. It also sends `Deprecation` ([RFC 9745](https://www.rfc-editor.org/rfc/rfc9745)), `Sunset` ([RFC 8594](https://www.rfc-editor.org/rfc/rfc8594)) and optionally `Link; rel="deprecation"`. Hits are logged as `DEPRECATED <method> <route> <client>` at most once an hour per route and client.
   - Request or response field: wrap its schema with `deprecate(schema, { since, removeAfter, replacement })` from `src/lib/compat/deprecation.ts`.
   - Code or Prisma field: a one-line comment, `/** @deprecated use aliases. remove-after: 2026-12-31 (#12) */` or `/// @deprecated use nameEn. remove-after: 2026-12-31`. Prisma copies `///` comments into the generated client, so editors strike through uses.
3. **Watch usage.** The `DEPRECATED …` and `OUTDATED …` log lines name the calling client release (`X-Client-Version`).
4. **Remove it** once usage is gone, and raise the client floor (below) if older releases still depend on it. If the date arrives and it is still in use, move `removeAfter` deliberately in a reviewed change.

The date is enforced, not remembered. `test/deprecations.test.ts` scans backend `src/` and `prisma/schema.prisma`. It fails `bun run test` when:
- a `@deprecated` comment has no `remove-after: YYYY-MM-DD` on the same line;
- a date is invalid;
- a bare `deprecated: true` bypasses the helpers;
- any removal date has passed.

`make deprecations` in `apps/backend` (or `make backend-deprecations` from the root) lists every deprecation, marking those due within 30 days. The source markers are the only record; there is no hand-maintained tracker.

## Client versions

The extension sends `X-Client-Version: extension/<manifest version>` on every API request (`src/api/client-compat.ts`), and the desktop client sends `desktop/<package version>` (`src/backend/api.ts`). The website and dashboard do not send it.

`MIN_CLIENT_VERSIONS` in `apps/backend/src/lib/compat/client-version.ts` is the oldest release of each app the API serves. The `client-version` plugin refuses older releases on `/api/*` before routing. It responds with **426 Upgrade Required**, an `X-Min-Client-Version` header and a localized `{ message, minVersion }` body. Requests with no header or an unrecognized one are served, because releases from before the header cannot send it. On a 426, the extension asks the store for an update (at most hourly, where the browser supports `runtime.requestUpdateCheck`) and reloads into it. The desktop client reports a `CLIENT_OUTDATED` error.

Raise a floor only in the change that removes something those releases need, and only after the logs show they are rare. The backend deploys when the new extension version goes live on the store (see [Deployment and review version](backend.md#deployment-and-review-version)), but installed extensions update over the following hours or days, so never assume that version is everywhere.

## Database changes: expand, migrate, contract

Never rename, retype or drop a column that running code or supported clients use in one release. Spread it across deploys:

| Phase | Schema | Code |
| --- | --- | --- |
| Expand | Add the new column (nullable or with a default), or the new table | Write both old and new; read old |
| Migrate | Backfill the new column in a migration or script | Read new; keep writing both. Mark the old field `/// @deprecated … remove-after: YYYY-MM-DD` |
| Contract | Drop the old column in a later migration | Stop touching the old field; remove its marker |

Each phase is a separate release that is safe to roll back. The contract step waits until the API no longer exposes the field and no supported client (per `MIN_CLIENT_VERSIONS`) or offline sync payload sends it. For fields stored offline by the extension, the Dexie store, download bundle and sync payload follow the same cycle.

## Cloud and lenses in 3.4.0

Billing, website cookie sessions and feature-keyed `/api/user/ai/prompts` and `/images` are additive. No extension or desktop minimum version is raised. New extension Cloud fetches send `X-Client-Version`, bearer auth and language like the generated Axios client; 426 invokes the same update check. An old API’s 404 is a visible Cloud-unavailable error, while the independently selected Desktop path still works. An NDJSON result or a bounded JSON fallback is read from the same request, never by replaying a paid action.

`POST /api/user/ai/chapter-selectors` remains for supported old clients with a dated deprecation (`remove-after: 2027-01-31`). New extensions use their own selector prompt, validation and one free correction on the feature route. Observe legacy route use before removal. Lens/session migrations expand the schema; rollback keeps their tables and columns so existing balances/history survive.

## Bilingual keyword descriptions

The nullable `descriptionAr`/`descriptionEn` columns on aliases and versions are additive; keyword descriptions live on the base version. Requests accept optional language fields, and responses/downloads/snapshots expose both. Migration `20261014125105_localized_keyword_descriptions` backfills existing descriptions by script and retains `description` for supported legacy clients. The API mirrors new edits to the shared field and maps old shared-field writes into one locale without changing the other. New extension forms and offline mutations use locale fields; older cached rows and queued shared-field mutations remain readable/projectable. No minimum client version changes. Keep the legacy field through the later migration/deprecation cycle; this task performs only expansion.

## Initial keyword ranges and category effects

Keyword creation adds optional `startingChapter`/`endingChapter` fields, defaulting to 0/null for existing clients. They set the initial version only; normal highlighting still falls back to the base outside its range. Category requests add optional `effect`, and responses add its string value. Migration `20261016123431_keyword_category_effect` adds a defaulted `NONE` column without changing existing colors; old partial writes preserve it. Known writes are the five effect choices; clients render missing or unknown read values as plain highlighting. Deploy the migration/backend before the extension. No client floor changes or Dexie index/schema migration is required.

## Word VFX

Migration `20261016154843_word_vfx` adds defaulted `wordVfx` strings to `Keyword` and `KeywordAlias`; optional reader/admin inputs and additive responses preserve older clients and partial writes. Existing words start at `NONE`; no category effects are copied to words. Current forms and highlighting use independent word effects, and aliases do not inherit their parent’s. Category `effect` stays readable/writable for supported old clients and carries `remove-after: 2027-04-30` on its Prisma field. Remove it only after the normal usage/deprecation cycle. The extension keeps the existing `storylens-show-category-effects` boolean key for the renamed **Show word VFX** preference. Deploy the migration/backend before the extension; no client floor or Dexie index version changes.

### Word VFX color and enum storage

The unreleased Word VFX schema is refined by migration `20261016163040_word_vfx_color`: `wordVfx` uses the PostgreSQL/Prisma `WordVfx` enum, and `wordVfxColor` is nullable text on both keywords and aliases. The migration casts existing valid effects without resetting them; existing colors start at null. The API still uses the same five effect strings, plus an optional color field (null or six-digit hex), and partial updates preserve omitted fields. The nullable color is included in snapshots, feeds and offline mutations, with no Dexie index change. Deploy the migration/backend before the extension; no client floor changes.

## Gemini CLI desktop provider

Gemini is an additive provider under desktop protocol 2: capabilities add `provider: "gemini"` models from ACP discovery, and existing prompt requests keep their fields. Gemini offers only `default` effort. New and legacy companion settings default `geminiPath` to `gemini`; existing tokens, paths, account and preferences remain valid. Image generation stays on Codex and fails explicitly when unavailable. No backend/schema/client floor changes.
