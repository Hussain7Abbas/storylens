# Phase 3 — Backend: billing API

[Global tracker](main.md) · **Status: Done (not committed; the email coin waits for phase 1's PNG)** · **Estimate: 5 points** · **Depends on: phase 2; D8, D9, D10, D11, D12, D21** · **Ships in: 3.4.0**

## Goal

The reader and dashboard endpoints for prices, balances, history, top-up requests, gifts, adjustments and pricing records, plus the billing emails. Request and response shapes are fixed here, so the website, dashboard and extension can be built against them (phases 7, 8, 10).

## Tasks

### 3.1 Reader routes (`src/routes/billing.ts`, prefix `/billing`)

Register in `src/routes/user.ts`. Order inside the module: `.use(setup)`, the public pricing route, then `.use(authorize('user'))`. Add each key to `USER_ENDPOINT_DESCRIPTIONS`; add `GET /api/user/billing/pricing` to `PUBLIC_ENDPOINTS`.

- [x] `GET /pricing` (public). Response:

  ```json
  {
    "currency": "USD",
    "available": true,
    "lensPriceUsd": "0.010000",
    "lensPriceMicros": 10000,
    "trialLenses": 10,
    "request": { "min": 100, "max": 50000, "pendingMax": 3 },
    "cloudAi": { "enabled": false },
    "features": [
      {
        "key": "page_summary",
        "nameEn": "Summarize page",
        "nameAr": "تلخيص الصفحة",
        "descriptionEn": null,
        "descriptionAr": null,
        "lenses": 2,
        "enabled": true,
        "maxPromptChars": 64000
      }
    ]
  }
  ```

  `available` is false (and the price fields null) when `Lens_Price_USD` is missing or invalid. Features are ordered by `sortOrder`. `Cache-Control: public, max-age=60`. Models and output caps are not exposed.
- [x] `GET /balance?surface=website|extension` (required) → `{ balance, notices: [{ id, type, lenses, note, createdAt }] }`. Notices are the caller's `TRIAL_GIFT`, `ADMIN_GIFT` and `TOP_UP` rows not yet shown in that app (`websiteSeenAt` or `extensionSeenAt` null), oldest first, at most 20. `note` is returned for gifts only. Refunds and adjustments are never notices (D12).
- [x] `POST /notices/seen` `{ ids: string[] (1–20, uuid), surface: "website" | "extension" }` → `{ updated }`. Sets only that app's column, only on the caller's rows; unknown IDs are ignored.
- [x] `GET /transactions?page&pageSize(≤50)&type?` → `{ data: [{ id, type, delta, balanceAfter, feature, note, billingRequestId, createdAt }], page, pageSize, total }`. `feature` is `aiFeature`. `note` is shown for gifts and hidden for adjustments (the reader sees the type "Balance correction").
- [x] `GET /requests?page&pageSize(≤50)` → `{ data: [request], page, pageSize, total, lastContact }`. `request` = `{ id, lenses, unitPriceUsd, totalUsd, status, contactChannel, contactHandle, note, rejectionReason, createdAt, reviewedAt, cancelledAt }`. `lastContact` is `{ channel, handle }` from the reader's newest request (any status), or null; the website prefills the form with it (D21). There are no payment instructions: the owner contacts the reader (D9).
- [x] `POST /requests` `{ id: uuid, lenses: integer, quotedLensPriceUsd: string, contactChannel: "WHATSAPP" | "TELEGRAM", contactHandle: string (≤64), note?: string (≤500) }`. In order:
  1. `currentUser.isGuest` → 403 `REGISTERED_ACCOUNT_REQUIRED`.
  2. Replay: a request with this `id` by the same user and the same `lenses` → 200 with that request; a different user or amount → 409 `ID_CONFLICT`.
  3. Billing config unavailable → 503 `BILLING_UNAVAILABLE`.
  4. `lenses` outside `[Lens_Request_Min, Lens_Request_Max]` (100 and 50,000 at launch, D8) → 400 `LENS_AMOUNT_OUT_OF_RANGE` `{ min, max }`.
  4b. Contact (`src/lib/billing/contact.ts`, D21): trim and normalize, then validate. WhatsApp: `+` and 8–15 digits after removing spaces, dashes and brackets, stored as `+<digits>`. Telegram: `@` plus 5–32 letters, digits or underscores (stored lowercase with the `@`), or a phone number as for WhatsApp. Otherwise 400 `CONTACT_INVALID` `{ channel }`.
  5. `parseUsdToMicros(quotedLensPriceUsd)` differs from the current price → 409 `PRICE_CHANGED` `{ lensPriceUsd, lensPriceMicros }`.
  6. More than 10 requests by this reader in 24 hours → 429 `REQUEST_RATE_LIMITED` `{ retryAfterSeconds }`.
  7. Pending requests ≥ `Lens_Pending_Requests_Max` → 409 `TOO_MANY_PENDING_REQUESTS` `{ max }`. Count and insert under a transaction-scoped advisory lock on the user (`pg_advisory_xact_lock(hashtext('billing:' || userId))`), so two parallel submissions cannot both pass.
  8. Insert with `userEmail`, the normalized contact, `unitPriceUsd`, `totalUsd = priceCents(...)`, `note` (trimmed through `sanitize`), `locale` from `lang`.
  9. After the commit, email the owner (3.5), best effort.

  Response: `{ request }`. The website tells the reader that the owner will contact them on the chosen channel.
- [x] `POST /requests/:id/cancel` → `updateMany({ where: { id, userId, status: PENDING }, data: { status: CANCELLED, cancelledAt } })`; count 0 → 409 `REQUEST_NOT_PENDING` `{ status }` (or 404 when the request is not the caller's).

### 3.2 Dashboard routes

New modules registered in `src/routes/admin/index.ts`, each route with `detail.summary`. Default access: super admin only.

- [x] `src/routes/admin/billing.ts` (prefix `/billing`):
  - `GET /requests?status&search&page&pageSize(≤100)`: `search` matches the snapshot email, current email, contact handle, username and name (case-insensitive). Each row: the request fields (including `contactChannel` and `contactHandle`) plus `userEmail`, `user: { id, email, username, name, lensBalance, isGuest } | null`, `reviewedBy: { id, name, email } | null`. The response also carries `counts: { PENDING, APPROVED, REJECTED, CANCELLED }` for the tabs and the sidebar badge. Default sort: pending oldest first; others newest first.
  - `POST /requests/:id/approve`: in one transaction, a compare-and-set `PENDING → APPROVED` with `reviewedById` and `reviewedAt` (count 0 → 409 `REQUEST_NOT_PENDING` with the current status and reviewer); `userId` null → 409 `REQUEST_USER_DELETED`; then `applyLensChange(TOP_UP, +lenses, "billing:<id>", billingRequestId)`. After the commit, email the reader. Response `{ request, transaction }`.
  - `POST /requests/:id/reject` `{ reason: string (3–500) }`: compare-and-set `PENDING → REJECTED` with the trimmed reason; email the reader.
  - `GET /summary?days(1–365, default 30)`: counts by status; pending lenses and USD; approved lenses and USD in the window and overall; lenses granted (trial, gifts, top-ups) and spent (charges minus refunds); AI cost from `AiCall.costUsd` in the window, also multiplied by 1.055 for OpenRouter's credit fee; per feature: actions, failures, refunds, average cost, average lenses charged and their value at the current lens price.
- [x] `src/routes/admin/user-lenses.ts` (prefix `/users`):
  - `GET /:id/lenses?page&pageSize` → `{ balance, data: [transaction with createdBy { id, name, email } and note], page, pageSize, total }`.
  - `POST /:id/lenses/gifts` `{ id: uuid, lenses: 1–100,000, note?: string (≤300) }` → `ADMIN_GIFT` with key `gift:<id>` and `createdById`. Guest → 409 `GUEST_ACCOUNT`; `isUser` false → 409 `NOT_A_READER`.
  - `POST /:id/lenses/adjustments` `{ id: uuid, delta: integer, non-zero, −100,000 to 100,000, reason: string (3–300) }` → `ADMIN_ADJUSTMENT` with key `adjust:<id>`; below zero → 409 `BALANCE_TOO_LOW` `{ balance }`; same guest and reader checks.
- [x] `src/routes/admin/ai-pricing.ts` (prefix `/ai-pricing`):
  - `GET /` → `{ data: AiFeaturePrice[] }` ordered by `sortOrder`.
  - `PUT /:key` partial update of `nameEn`, `nameAr`, `descriptionEn`, `descriptionAr`, `lenses`, `enabled`, `maxPromptChars`, `maxOutputTokens`, `sortOrder`, within the [bounds](architecture.md#pricing-records-seeded-by-migration); records `updatedById`. Unknown key → 404. There is no create or delete: feature keys are part of the client contract.
- [x] `src/routes/admin/users.ts`: add `lensBalance` to list and detail responses (additive). The existing `DELETE /users/:id` keeps working: ledger rows cascade, billing requests keep their email snapshot with `userId` null.
- [x] `src/routes/admin/configs.ts`: `PUT /` runs `validateConfigValue` and answers 400 `INVALID_CONFIG_VALUE` `{ key }` with a message that names the expected format. Deleting a billing key is allowed (it falls back to its default or to "unavailable").

### 3.3 Permissions

- [x] `test/permissions.test.ts` passes: every new route has its permission row, reader descriptions and admin summaries exist, and `GET /api/user/billing/pricing` is public.
- [x] Defaults: reader GETs are guest-level (they return empty data for guests); reader POSTs need the reader role; admin routes are super-admin only. Custom dashboard roles get the new permissions only when the owner grants them (note this in phase 11).

### 3.4 Concurrency rules

- [x] Approve, reject and cancel use compare-and-set on `status = PENDING`, so the first wins and the others get 409 `REQUEST_NOT_PENDING`.
- [x] The approval credit's idempotency key (`billing:<id>`) makes a retried approval after a lost response harmless.

### 3.5 Emails (`src/lib/billing/emails.ts`)

Sent only through `sendEmail` (`src/lib/email/`). Outside production with no Resend key they are logged, as registration codes are. Failures are logged and never fail the request.

- [x] **New request → owner** (`Billing_Notify_Email`, else `DASHBOARD_ADMIN_EMAIL`; skipped when neither is set): reader name, email, contact channel and handle with a direct link (`https://wa.me/<digits>`, `https://t.me/<username>` or `https://t.me/+<digits>`), lenses, total, note, time, and a link to `${DASHBOARD_URL}/billing-requests?status=PENDING`. This email is how the owner starts the payment conversation (D9).
- [x] **Approved → reader** (request `locale`): lenses added, new balance, link to the website Balance page.
- [x] **Rejected → reader**: the reason, the amount, and how to ask again.
- [x] Add `DASHBOARD_URL` (optional, default `https://storylens-dashboard.iscoded.com`) to `src/env.ts` and `.env.example`.
- [x] Text bodies in English and Arabic; HTML bodies escape every interpolated value (names, notes and reasons are user text); the coin uses the PNG export from phase 1, never SVG.

### 3.6 OpenAPI and generated clients

- [x] Response schemas for every route (`t.Object`), so Orval generates usable types.
- [x] Run `make orval` (extension) and `make dashboard-orval` (dashboard) against a running local backend.
- [ ] Commit both generated clients in their submodules (waits for the owner's go-ahead to commit).

## Tests (`test/billing-api.test.ts`, live database)

| # | Test | Expected |
| --- | --- | --- |
| 1 | `GET /pricing` without a session | 200 with the seeded values; no `model` fields |
| 2 | `GET /pricing` with an invalid `Lens_Price_USD` | `available: false`, price fields null |
| 3 | `GET /balance` for a guest and for a new reader with the trial | Guest: 0 and no notices; reader: 10 and one `TRIAL_GIFT` notice |
| 4 | `POST /notices/seen` with own and someone else's IDs | Only own rows updated; next `GET /balance` for that surface has no notices |
| 4b | Website marks a top-up seen; then `GET /balance?surface=extension` | The extension still gets the notice (and the reverse) |
| 4c | A refund and a positive adjustment | Never returned as notices |
| 4d | `GET /balance` without `surface` | 422 |
| 5 | `POST /requests` as a guest | 403 `REGISTERED_ACCOUNT_REQUIRED` |
| 6 | Amount below min, above max | 400 `LENS_AMOUNT_OUT_OF_RANGE` with `min`, `max` |
| 7 | Stale quote | 409 `PRICE_CHANGED` with the current price |
| 8 | Fourth pending request; four parallel submissions with the limit at 3 | 409 `TOO_MANY_PENDING_REQUESTS`; exactly 3 stored |
| 9 | Same `id` resent; same `id` with a different amount | 200 same request; 409 `ID_CONFLICT` |
| 10 | Snapshot | `unitPriceUsd` 0.010000, `totalUsd` from `priceCents`, `userEmail`, normalized contact, `locale` from `Accept-Language` |
| 10b | Contact: missing; WhatsApp `07701234567` (no country code); WhatsApp `+964 770 123 4567`; Telegram `@ab`; Telegram `@Story_Lens`; Telegram `+447700900123` | 422; 400 `CONTACT_INVALID`; stored `+9647701234567`; 400 `CONTACT_INVALID`; stored `@story_lens`; stored as given |
| 10c | `GET /requests` after two requests with different contacts | `lastContact` is the newest one |
| 11 | Cancel pending; cancel approved | 200; 409 `REQUEST_NOT_PENDING` |
| 12 | Admin list | Shows the contact, the current email and the snapshot email after an email change; counts per status; search by email and by contact handle |
| 13 | Approve twice in parallel | One 200, one 409; one `TOP_UP` row; balance +lenses once |
| 14 | Approve after cancel; approve after the reader was deleted | 409 `REQUEST_NOT_PENDING`; 409 `REQUEST_USER_DELETED` |
| 15 | Reject without a reason, with 2 characters, with a valid reason | 422, 422, 200; the reader sees the reason in `GET /requests` |
| 16 | Gift to a reader, a guest, a dashboard-only account; gift replay | `ADMIN_GIFT` row and a notice; 409 `GUEST_ACCOUNT`; 409 `NOT_A_READER`; replay changes nothing |
| 17 | Adjustment −50 on a balance of 20 | 409 `BALANCE_TOO_LOW` with `balance` |
| 18 | `PUT /ai-pricing/page_summary` with lenses −1, 10,001, and valid values | 422 for each invalid value; 200 and `updatedById` set |
| 19 | `PUT /configs` with `Lens_Price_USD=abc` and `Lens_Trial_Gift=-1` | 400 `INVALID_CONFIG_VALUE` |
| 20 | Emails | Owner email on create with the contact link; reader emails on approve and reject in the request's language; HTML escapes `<b>` in notes, handles and reasons; sending failures do not fail the routes |
| 21 | `GET /summary` with fixture actions, calls and transactions | Figures match hand-computed values, including the 1.055 fee factor |
| 22 | `test/permissions.test.ts` | Passes |
| 23 | `auditBalances` after the whole suite | No mismatches |

## Exit criteria

- [x] Backend tests (plain and live), `make deprecations` and typecheck in all five submodules pass.
- [x] Both generated clients are regenerated and committed.

## Docs and instructions

- `docs/backend.md`: "Billing API" section (endpoints, status rules, emails, `DASHBOARD_URL`), linked from the "Lenses" section.
- `apps/backend/AGENTS.md`: billing request status changes are compare-and-set on `PENDING`; approvals credit through `applyLensChange` with `billing:<id>`; billing codes are a contract.
- `apps/backend/.env.example`: `DASHBOARD_URL`.

## Risks

| Risk | Mitigation |
| --- | --- |
| Spam requests flood the owner's inbox | 3 pending, 10 per 24 hours, registered accounts only, $1 minimum |
| A wrong or someone else's number is entered | The owner confirms over the chat before approving; the reader's verified email is always shown too |
| The owner approves before receiving payment | The approve dialog says so (phase 8); approvals are audited with the reviewer and time; adjustments can correct mistakes |
| Price changed while the reader was on the page | `PRICE_CHANGED` and a refreshed total (D10) |
| Email injection through notes or reasons | Escaped HTML; plain-text bodies; header fields never take user text |

## Implementation notes

- Contact validation lives in `src/lib/billing/contact.ts` (`normalizeContact`, `contactLink`). The admin search accepts a phone number typed as digits (the query parser turns it into a number).
- Responses use `t.Number()` rather than `t.Integer()`, which Orval generated as `string | number`.
- Open: the coin image in emails (needs the phase 1 PNG hosted on the website), committing the generated clients.

## Verification log

| Date | Check | Result | Evidence |
| --- | --- | --- | --- |
| 2026-10-02 | `test/billing-api.test.ts` with the live test database | Pass | part of the 177 backend tests |
