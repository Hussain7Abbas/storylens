# Phase 2 — Backend: ledger, pricing records and config

[Global tracker](main.md) · **Status: Done (not committed)** · **Estimate: 5 points** · **Depends on: D1, D6, D7** · **Ships in: 3.4.0**

## Goal

The money foundation every later phase uses:

- the schema from [Architecture → Data model](architecture.md#data-model-prisma), with the six pricing records and the config defaults seeded;
- typed reading of the billing config keys;
- integer money helpers;
- `applyLensChange`, the only way a balance changes, exactly-once and never below zero;
- the trial gift for new registered readers (D1);
- audit and backfill scripts.

No route is added here except the trial gift calls inside existing registration flows.

## Tasks

### 2.1 Schema and migration

- [x] Add to `prisma/schema.prisma`: `lensBalance` and the relation fields on `User`; the enums `LensTransactionType`, `BillingRequestStatus`, `AiActionStatus`; the models `LensTransaction`, `BillingRequest`, `AiFeaturePrice`, `AiAction`, `AiCall`. Copy the comments from the architecture; schema comments are part of this repository's style. (`Session.kind` belongs to phase 5's own migration.)
- [x] `bun run db:migrate:dev --name lenses` generates the migration. Then add, in the same migration file **before it is first applied anywhere** (the rule against hand-editing applies to migrations already applied):
  - `CHECK ("lensBalance" >= 0)` on `"User"`, `CHECK ("delta" <> 0)` on `"LensTransaction"`, `CHECK ("lenses" > 0)` on `"BillingRequest"`;
  - the six `AiFeaturePrice` rows from [Pricing records](architecture.md#pricing-records-seeded-by-migration), `ON CONFLICT ("key") DO NOTHING`;
  - config defaults `Lens_Price_USD=0.01`, `Lens_Trial_Gift=10`, `Lens_Request_Min=100`, `Lens_Request_Max=50000`, `Lens_Pending_Requests_Max=3`, `AI_Cloud_Enabled=false`, `ON CONFLICT ("key") DO NOTHING`.
- [ ] Adding `lensBalance` with a constant default does not rewrite the `User` table on PostgreSQL 11 and later; confirm the server's Postgres version before deploying (phase 11).
- [x] `bun run db:generate` regenerates Prisma and prismabox (`ConfigPlain`-style TypeBox models are used by routes in phase 3).
- [x] `prisma/seed/`: development seed gives the seeded reader 25 lenses through `applyLensChange` (key `seed:<userId>`), so local testing has a balance.

### 2.2 Typed config (`src/lib/billing/config.ts`)

- [x] A zod schema per key from [Config keys](architecture.md#config-keys); `parseBillingConfig(rows)` returns typed values with defaults, and records invalid keys instead of throwing (an invalid `Lens_Price_USD` means billing unavailable, an invalid `Lens_Trial_Gift` means 0, and each logs a warning once an hour).
- [x] `getBillingConfig(prisma)` reads the keys in one `findMany`. No cache: the table is tiny, and caching would delay the owner's dashboard edits.
- [x] `validateConfigValue(key, value)` for the admin configs route (wired in phase 3): known keys must parse; unknown keys stay free-form, as today.
- [x] Export `BILLING_CONFIG_KEYS` with descriptions; the dashboard copies them into its hints in phase 8.

### 2.3 Money (`src/lib/billing/money.ts`)

- [x] `parseUsdToMicros(text): number | null` with the strict pattern (no exponents, no signs, no `parseFloat`).
- [x] `priceCents(lenses, priceMicros)` (half-up), `formatMicros(micros)` → `"0.010000"`, `formatCents(cents)` → `"5.00"`.
- [x] Prisma `Decimal` conversions: `centsToDecimal`, `microsToDecimal`, and back, for `BillingRequest.unitPriceUsd`/`totalUsd` and `AiCall.costUsd`.
- [x] Unit tests with the [test vectors](architecture.md#money-rules-d6); the website and dashboard copies reuse the same table in phases 7 and 8.

### 2.4 Ledger (`src/lib/billing/ledger.ts`)

- [x] `applyLensChange(tx, change)`, where `tx` is a Prisma transaction client and `change` is `{ userId, delta, type, idempotencyKey, note?, billingRequestId?, aiActionId?, aiFeature?, createdById? }`:
  1. `UPDATE "User" SET "lensBalance" = "lensBalance" + $delta WHERE "id" = $userId AND "lensBalance" + $delta >= 0 RETURNING "lensBalance"` (with `$queryRaw`; Prisma's `update` cannot express the guard).
  2. No row: if the user exists, throw `INSUFFICIENT_LENSES` (status 402, details `{ required: -delta, balance }`) for AI charges and `BALANCE_TOO_LOW` (409) for adjustments; otherwise `NOT_FOUND`.
  3. Insert the `LensTransaction` with `balanceAfter`.
- [x] `withLensChange(prisma, change, work?)` runs `applyLensChange` (and optional extra writes) in `prisma.$transaction`. On `P2002` for `idempotencyKey` the whole transaction has rolled back; it reads the existing row and returns it with `replayed: true`. This is the only way callers outside a larger transaction change balances.
- [x] Errors use `new HttpError({ code })` with the codes in `src/lib/billing/error-codes.ts` (create the file; codes from [Error codes](architecture.md#error-codes)).
- [x] `auditBalances(prisma, { userIds? })` compares `lensBalance` with `SUM(delta)` per user and returns the mismatches.
- [x] Nothing else in `src/` may write `lensBalance`. Add a test that scans `src/` for `lensBalance` writes outside `ledger.ts` (like `test/stored-text.test.ts` scans for HTML insertion).

### 2.5 Trial gift (`src/lib/billing/trial.ts`)

- [x] `grantTrialGift(tx, userId)`: reads `Lens_Trial_Gift`; `0` or invalid does nothing; otherwise `applyLensChange(TRIAL_GIFT, +gift, "trial:<userId>")`. Returns `{ lenses } | null` so routes can tell the client.
- [x] `POST /api/user/auth/register/verify` (`src/routes/accounts.ts`): grant inside the same transaction as the account creation or guest upgrade. Today the create path is a single `prisma.user.create`; wrap it and the gift in `prisma.$transaction`. The guest upgrade path already uses a transaction; add the gift there. Add an optional `gift: { lenses } | null` to the response (additive).
- [x] Google sign-up: Better Auth `databaseHooks.user.create.after` in `src/lib/auth/index.ts` calls `grantTrialGift` best-effort (logs `TRIAL_GIFT_FAILED <userId>` on error and does not fail sign-in). The `before` hook stays as is.
- [x] Never for guests (`POST /auth/guest`) or dashboard-created accounts (`POST /api/admin/users`).
- [x] Phase 5's `POST /auth/web/register/verify` reuses the same transaction helper.

### 2.6 Guest merge safety

- [x] `mergeGuestInto` (`src/lib/auth/oauth.ts`): guests never hold lenses (D1, D11), but if one does, move its balance in the same transaction with two ledger rows (`merge-out:<guestId>` on the guest is not needed since the guest is deleted; write `ADMIN_ADJUSTMENT` `merge-in:<guestId>` on the target with the note "Merged from a guest install"). Its `LensTransaction` rows cascade with the guest; its `AiAction` rows (none expected) cascade too.

### 2.7 Scripts and Make targets

- [x] `src/scripts/lens_audit.ts` and `make lens-audit`: runs `auditBalances` for everyone; exits non-zero on mismatches. Read-only.
- [x] `src/scripts/grant_trial_gifts.ts` and `make grant-trial-gifts` (D2, decided: run once at launch): every account with `isUser` and not `isGuest` gets the trial through `grantTrialGift` (idempotent by key). Dry run by default (prints the count); `CONFIRM=1` applies. Gifts granted this way are unseen, so those readers get the celebration.
- [x] Root `Makefile`: the generic `backend-<target>` pass-through covers both; mention them in `make help` text if the backend Makefile lists targets by hand.

## Tests

Live-database tests go under `test/billing-*.test.ts` and run with `make test-live` (`STORYLENS_LIVE_DB_TEST=1`), like the sync tests. Pure tests run in plain `bun run test`.

| # | Test | Expected |
| --- | --- | --- |
| 1 | Migration on a copy of the development database | Existing users have `lensBalance` 0; six pricing rows; config defaults present; re-running the seed SQL changes nothing |
| 2 | Raw `UPDATE "User" SET "lensBalance" = -1` | Fails on the CHECK constraint |
| 3 | `applyLensChange` +10 then −4 | Balance 6; two rows with `balanceAfter` 10 and 6 |
| 4 | Debit below zero | `INSUFFICIENT_LENSES` with `required` and `balance`; no row written; balance unchanged |
| 5 | Same idempotency key twice, sequentially and in parallel | One row, one balance change, second call reports `replayed` |
| 6 | 20 parallel debits of 1 on a balance of 10 | Exactly 10 succeed; balance 0; 10 rows; `auditBalances` clean |
| 7 | Config parsing: `0.01`, `1`, `0.000001`, `9999.999999` | Valid micros |
| 8 | Config parsing: `.5`, `1e-2`, `-1`, `0`, `abc`, `10000`, `0.0000001`, empty | Invalid; billing unavailable; warning logged |
| 9 | Money vectors | All seven rows of the table match |
| 10 | Registration verify, new account and guest upgrade | +10 `TRIAL_GIFT` once; response `gift.lenses` 10; a second verify is impossible (code consumed) and a manual second grant is a replay |
| 11 | `Lens_Trial_Gift=0` | No row; response `gift: null` |
| 12 | Google sign-up through the create hook (stubbed OAuth) | +10 once; a failing gift does not fail sign-in and logs `TRIAL_GIFT_FAILED` |
| 13 | Guest creation and dashboard-created reader | No gift |
| 14 | `mergeGuestInto` with a guest holding 5 lenses (forced) | Target +5 with `merge-in:<guestId>`; audit clean |
| 15 | `make grant-trial-gifts` dry run, then `CONFIRM=1`, then again | Counts only; grants; second run grants nothing |
| 16 | Source scan | No `lensBalance` write outside `ledger.ts` |

## Exit criteria

- [x] `bun run test`, `make test-live` and `make deprecations` pass; typecheck passes in all five submodules.
- [x] `make lens-audit` is clean on the development database after the seed.

## Docs and instructions

- `docs/backend.md`: a new "Lenses" section (balance and ledger, idempotency keys, trial gift, config keys, audit and grant targets).
- `apps/backend/AGENTS.md`: change balances only through `applyLensChange`/`withLensChange` with a unique idempotency key; money is integer micro-dollars and cents; never `parseFloat` a price; never store prompts or AI output.
- `apps/backend/.env.example`: no change in this phase (billing settings live in `Config`).

## Risks

| Risk | Mitigation |
| --- | --- |
| A future route writes `lensBalance` directly and breaks the audit | Source-scan test and the AGENTS rule |
| Re-registration farming (new email, new trial) | Needs a new verified email each time; the trial is small; dashboard history shows patterns; D1 keeps guests out |
| Better Auth hook failure loses a Google reader's trial | Logged; the owner can gift it from the dashboard |
| Prisma `Decimal` mistakes | Decimals are converted only through the money helpers, which have tests |

## Implementation notes

- Pricing records have no model columns (D24): the models are the `AI_Text_Model`/`AI_Image_Model` configs, seeded in the same `lenses` migration and validated by `MODEL_ID`. The migration was edited in place before it was applied anywhere but the disposable test database.
- `src/lib/billing/` holds `config.ts`, `money.ts`, `ledger.ts`, `trial.ts`, `contact.ts`, `emails.ts`, `serialize.ts` and `error-codes.ts`. Registration and login moved into `src/lib/auth/reader-auth.ts` (shared with phase 5) instead of separate `login.ts`/`registration.ts`.
- The development seed gives each registered reader 25 lenses (`prisma/seed/tables/lenses.ts`, key `seed:<userId>`, an `ADMIN_ADJUSTMENT` so it never celebrates).

## Verification log

| Date | Check | Result | Evidence |
| --- | --- | --- | --- |
| 2026-10-02 | `bun run test` with the live test database (`STORYLENS_LIVE_DB_TEST=1`) | Pass (177 tests) | `test/billing-money.test.ts`, `test/billing-ledger.test.ts` |
| 2026-10-02 | Development lens seed run twice on the test database | Pass: balance 25, one ledger row | ad-hoc check, account removed |
