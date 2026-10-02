# Lenses and cloud AI — architecture

[Global tracker](main.md)

This is the target design. Phase files refer to the names defined here; change them here first if a phase needs to.

## Overview

```text
                      ┌──────────────────── Story Lens API (Elysia, Postgres) ─────────────────────┐
 Extension ──bearer──►│ /api/user/ai/prompts, /ai/images ─► charge ─► OpenRouter ─► result/refund │
 (Cloud AI source)    │ /api/user/billing/* (pricing, balance, history, requests)                 │
                      │                                                                           │
 Website ──cookie────►│ /api/user/auth/web/* (session), /api/user/billing/*                       │
 (static export)      │                                                                           │
                      │ ledger: User.lensBalance + LensTransaction (append-only)                  │
 Dashboard ──bearer──►│ /api/admin/billing/*, /api/admin/users/:id/lenses/*, /api/admin/ai-pricing, /api/admin/ai-models │
                      └───────────────────────────────────────────────────────────────────────────┘
 Desktop companion: unchanged, free, local (Claude Code / Codex CLIs).
```

## Data model (Prisma)

All changes are additive: one new column on `User` with a default, one on `Session` with a default (phase 5's own migration), five enums and five tables. No column is renamed or dropped.

```prisma
enum LensTransactionType {
  TRIAL_GIFT        // new registered reader (D1)
  ADMIN_GIFT        // dashboard gift (D11)
  ADMIN_ADJUSTMENT  // dashboard correction, positive or negative (D11)
  TOP_UP            // approved billing request
  AI_CHARGE         // cloud AI action started
  AI_REFUND         // cloud AI action delivered nothing (D5)
}

enum BillingRequestStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

enum AiActionStatus {
  RUNNING
  SUCCEEDED
  FAILED
}

// How the owner reaches the reader to arrange payment (D21).
enum ContactChannel {
  WHATSAPP
  TELEGRAM
}

enum SessionKind {
  bearer // Authorization header: extension, desktop client, dashboard
  web    // HttpOnly cookie: website only (phase 5)
}

model User {
  // ...existing fields...
  // Spendable lenses. Changed only by `applyLensChange` (src/lib/billing/ledger.ts),
  // always together with a LensTransaction row. A CHECK constraint keeps it >= 0.
  lensBalance Int @default(0)

  lensTransactions        LensTransaction[] @relation("LensTransactionUser")
  lensTransactionsCreated LensTransaction[] @relation("LensTransactionCreator")
  billingRequests         BillingRequest[]  @relation("BillingRequestUser")
  billingRequestsReviewed BillingRequest[]  @relation("BillingRequestReviewer")
  aiActions               AiAction[]
}

model Session {
  // ...existing fields...
  // Bearer sessions are read only from Authorization, web sessions only from the cookie.
  kind SessionKind @default(bearer)
}

// Append-only lens ledger: one row per balance change.
model LensTransaction {
  id     String @id @default(uuid())
  userId String
  user   User   @relation("LensTransactionUser", fields: [userId], references: [id], onDelete: Cascade)

  type LensTransactionType
  // Signed change, never 0.
  delta        Int
  // The balance right after this change.
  balanceAfter Int
  // Exactly-once key: trial:<userId>, gift:<clientId>, adjust:<clientId>, billing:<requestId>,
  // ai-charge:<actionId>, ai-refund:<actionId>, merge-in:<guestId>.
  idempotencyKey String @unique
  // Shown to the reader for gifts; the reason for adjustments (dashboard only).
  note String?

  billingRequestId String?
  billingRequest   BillingRequest? @relation(fields: [billingRequestId], references: [id], onDelete: SetNull)
  aiActionId       String?
  aiAction         AiAction?       @relation(fields: [aiActionId], references: [id], onDelete: SetNull)
  // Copy of AiAction.feature, so history keeps its label after AiAction rows are pruned.
  aiFeature        String?

  // Dashboard user who gifted or adjusted.
  createdById String?
  createdBy   User?   @relation("LensTransactionCreator", fields: [createdById], references: [id], onDelete: SetNull)

  // TRIAL_GIFT, ADMIN_GIFT and TOP_UP rows are shown once in each app (D12): the extension
  // celebrates every one with confetti; the website celebrates gifts and notes top-ups.
  // Null until that app has shown it.
  websiteSeenAt   DateTime?
  extensionSeenAt DateTime?
  createdAt DateTime  @default(now())

  @@index([userId, createdAt])
  @@index([type, createdAt])
}

// A reader's request to buy lenses, reviewed on the dashboard.
model BillingRequest {
  // Client-generated UUID, so a resent form does not create a second request.
  id     String  @id
  userId String?
  user   User?   @relation("BillingRequestUser", fields: [userId], references: [id], onDelete: SetNull)
  // The reader's email when they asked; the dashboard also shows the current one.
  userEmail String

  lenses       Int
  // Quoted price per lens and lenses × price rounded half-up to cents (D6, D10).
  unitPriceUsd Decimal @db.Decimal(12, 6)
  totalUsd     Decimal @db.Decimal(12, 2)

  status BillingRequestStatus @default(PENDING)
  // Where the owner contacts the reader to arrange payment (D9, D21): a WhatsApp number in
  // international format (+9647…), or a Telegram username (@name) or number. Required.
  contactChannel ContactChannel
  contactHandle  String
  // Optional message from the reader.
  note   String?
  // Language for emails about this request (`en` or `ar`, from Accept-Language).
  locale String @default("en")

  rejectionReason String?
  reviewedById    String?
  reviewedBy      User?     @relation("BillingRequestReviewer", fields: [reviewedById], references: [id], onDelete: SetNull)
  reviewedAt      DateTime?
  cancelledAt     DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  transactions LensTransaction[]

  @@index([status, createdAt])
  @@index([userId, createdAt])
}

// One pricing record per AI feature. Rows are created by migration; the dashboard edits them.
model AiFeaturePrice {
  // Stable contract with clients: page_summary, keyword_suggestion, chapter_extraction,
  // character_image, novel_context, selector_detection.
  key String @id

  nameEn        String
  nameAr        String
  descriptionEn String?
  descriptionAr String?

  // Lenses charged once per action; 0 makes the feature free.
  lenses  Int     @default(0)
  enabled Boolean @default(true)

  maxPromptChars  Int
  maxOutputTokens Int
  sortOrder       Int @default(0)

  updatedById String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// One cloud AI action as the reader sees it: one charge, at most one refund.
model AiAction {
  // Client-generated UUID, shared by both attempts of an action.
  id     String @id
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  feature       String
  status        AiActionStatus @default(RUNNING)
  lensesCharged Int
  refunded      Boolean        @default(false)
  attempts      Int            @default(1)
  // For statistics only; no foreign key, so deleting a novel keeps the row.
  novelId       String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  calls        AiCall[]
  transactions LensTransaction[]

  @@index([userId, createdAt])
  @@index([status, updatedAt])
  @@index([feature, createdAt])
}

// One provider request. Never holds prompts, answers or images.
model AiCall {
  id       String   @id @default(uuid())
  actionId String
  action   AiAction @relation(fields: [actionId], references: [id], onDelete: Cascade)

  attempt Int
  // `main`, or `brief` for the text step of a character image.
  step    String @default("main")
  model   String
  // succeeded | failed | cancelled
  status    String
  errorCode String?

  inputTokens     Int?
  outputTokens    Int?
  reasoningTokens Int?
  // OpenRouter `usage.cost` in USD (before OpenRouter's credit purchase fee).
  costUsd    Decimal? @db.Decimal(12, 6)
  durationMs Int
  // OpenRouter generation ID, for disputes and debugging.
  providerId String?
  // `deny` when the call was restricted to providers that do not keep or train on data,
  // `allow` when it fell back to any provider (D18).
  dataPolicy String?

  createdAt DateTime @default(now())

  @@index([actionId])
  @@index([createdAt])
}
```

The migration also adds:

- `ALTER TABLE "User" ADD CONSTRAINT "User_lensBalance_nonnegative" CHECK ("lensBalance" >= 0)`;
- `CHECK ("delta" <> 0)` on `LensTransaction` and `CHECK ("lenses" > 0)` on `BillingRequest`;
- the six `AiFeaturePrice` rows (below) and the config defaults, both with `ON CONFLICT DO NOTHING` so a re-run never overwrites the owner's values.

`Config` and `Session` already exist; `SyncChange` triggers are not needed (none of these tables is synced to the extension's offline store).

## Money rules (D6)

- Feature prices, balances, gifts and requests are whole lenses (`Int`).
- `Lens_Price_USD` is parsed with `^\d{1,4}(\.\d{1,6})?$` into integer **micro-dollars** (1 USD = 1,000,000). Never parse it with `parseFloat`.
- `totalCents = floor((lenses × priceMicros + 5,000) / 10,000)`, which is half-up rounding to cents. `lenses ≤ 50,000` and `priceMicros ≤ 9,999,999,999` keep the product below `Number.MAX_SAFE_INTEGER`, so plain integers suffice.
- The same `priceCents(lenses, priceMicros)` function, with the same test vectors, lives in `apps/backend/src/lib/billing/money.ts`, `apps/website/src/lib/billing/money.ts` and `apps/dashboard/src/lib/money.ts` (there is no shared package). Format with `Intl.NumberFormat(locale, { style: "currency", currency: "USD" })`.
- The API returns prices as decimal strings (`"0.010000"`, `"5.00"`) plus `lensPriceMicros`; clients never do floating-point money math.

Test vectors used in every copy (lenses, price in micro-dollars → cents):

| Lenses | Price (micro-dollars) | Cents | Why |
| ---: | ---: | ---: | --- |
| 1 | 10,000 | 1 | $0.01 × 1 |
| 100 | 10,000 | 100 | $1.00 |
| 333 | 15,000 | 500 | $4.995 rounds half-up to $5.00 |
| 1 | 4,000 | 0 | $0.004 rounds down |
| 1 | 5,000 | 1 | $0.005 rounds half-up |
| 7 | 1,234,567 | 864 | $8.641969 |
| 50,000 | 9,999,999,999 | 49,999,999,995 | Largest inputs stay below `Number.MAX_SAFE_INTEGER` |

## Config keys

Stored in the existing `Config` table (string values), edited on the dashboard's **Configs** page. `src/lib/billing/config.ts` parses them with zod and the admin configs route validates them on save (`400 INVALID_CONFIG_VALUE`). The migration inserts the defaults marked *seeded*.

| Key | Type and bounds | Default | Meaning |
| --- | --- | --- | --- |
| `Lens_Price_USD` | decimal, > 0, ≤ 9999.999999, up to 6 decimals | `0.01` (seeded) | Price of one lens. Missing or invalid: billing is unavailable (`503 BILLING_UNAVAILABLE`); AI still works on existing balances. |
| `Lens_Trial_Gift` | integer 0–10,000 | `10` (seeded) | Lenses given to each new registered reader. `0` (or missing): no gift and no celebration. |
| `Lens_Request_Min` | integer ≥ 1 | `100` (seeded) | Smallest request. |
| `Lens_Request_Max` | integer ≥ min, ≤ 50,000 | `50000` (seeded) | Largest request. |
| `Lens_Pending_Requests_Max` | integer 1–20 | `3` (seeded) | Pending requests per reader. |
| `Billing_Notify_Email` | email | empty (falls back to `DASHBOARD_ADMIN_EMAIL`) | Receives an email for each new request. |
| `AI_Cloud_Enabled` | `true` / `false` | `false` (seeded) | Kill switch; `false` answers `503 AI_UNAVAILABLE`. The owner turns it on at launch. |
| `AI_Daily_Spend_Cap_USD` | decimal ≥ 0 | empty (no cap; the owner chose none at launch, D16) | When set and today's (UTC) recorded `AiCall.costUsd` reaches it, new actions get `503 AI_UNAVAILABLE` and the owner gets one email that day. |
| `AI_Reader_Max_Running` | integer 1–10 | `3` | Running actions per reader. |
| `AI_Reader_Max_Per_10_Min` | integer 1–500 | `30` | Actions a reader may start in 10 minutes. |
| `AI_Text_Model` | OpenRouter model ID | `google/gemini-2.5-flash` | Every text feature, the character image brief and the deprecated selector route (D24). |
| `AI_Image_Model` | OpenRouter model ID | `bytedance-seed/seedream-5-0-flash` | `character_image` (D24). |

`OPENROUTER_API_KEY` stays an environment variable (secret). There is no model environment variable: `OPENROUTER_MODEL` was removed, and the two model configs are changed from the dashboard's Settings → AI tab, which lists OpenRouter's models with their prices and warns when lens prices would no longer cover a model (D24).

## Pricing records (seeded by migration)

Models come from the `AI_Text_Model` and `AI_Image_Model` configs (D24); the column shows the defaults.

| Key | English name | Arabic name | Lenses (D7) | Model | `maxPromptChars` | `maxOutputTokens` | Attempts |
| --- | --- | --- | ---: | --- | ---: | ---: | ---: |
| `page_summary` | Summarize page | تلخيص الصفحة | 2 | `google/gemini-2.5-flash` | 64,000 | 1,200 | 2 |
| `keyword_suggestion` | AI keyword suggestion | اقتراح الكلمة بالذكاء الاصطناعي | 1 | `google/gemini-2.5-flash` | 32,000 | 800 | 2 |
| `chapter_extraction` | Extract chapter characters | استخراج شخصيات الفصل | 4 | `google/gemini-2.5-flash` | 200,000 | 8,000 | 2 |
| `character_image` | Character image | صورة الشخصية | 3 | `bytedance-seed/seedream-5-0-flash` (brief: `google/gemini-2.5-flash`) | 24,000 | 400 (brief) | 1 |
| `novel_context` | Novel background research | البحث عن خلفية الرواية | 0 | `google/gemini-2.5-flash` + web search | 8,000 | 1,000 | 2 |
| `selector_detection` | Website selector detection | اكتشاف محددات الموقع | 0 | `google/gemini-2.5-flash` | 60,000 | 2,000 | 2 |

Dashboard edits are bounded: lenses 0–10,000; `maxPromptChars` 1,000–400,000; `maxOutputTokens` 100–16,000; the model configs must match `^[a-z0-9-]+/[a-z0-9.:_-]+$`. The Arabic names are drafts for a native review (phase 11).

## Flows

### A. Cloud AI action (text)

```text
Extension page/content ──message──► background: executeAiPrompt({source:"cloud", feature, actionId, attempt:1, prompt, language})
background ──POST /api/user/ai/prompts (Accept: application/x-ndjson, bearer, X-Client-Version)──► API

API before streaming (plain HTTP errors):
  401/403 session and permission (guests have no permission; extension checks isGuest first)
  503 AI_UNAVAILABLE (switch off, no key, spend cap) · 404 AI_FEATURE_NOT_FOUND · 503 AI_FEATURE_DISABLED
  413 PROMPT_TOO_LARGE {maxChars} · 429 AI_RATE_LIMITED (Retry-After)
  409 NOVEL_CONTEXT_EXISTS (novel_context only)
  transaction: insert AiAction(RUNNING) ─► applyLensChange(AI_CHARGE, -lenses, "ai-charge:<id>")
               ─► 402 INSUFFICIENT_LENSES {required, balance}, and nothing is written
API streaming (200, NDJSON, heartbeat every 8 s):
  {"type":"started","actionId","lensesCharged","balance"}
  {"type":"heartbeat"} …
  OpenRouter chat (model from AI_Text_Model, caps from AiFeaturePrice, reasoning off, user=<userId>, data_collection deny;
                   on "no endpoint matches the data policy", one retry without it, recorded as dataPolicy=allow)
  ok   ─► AiCall(succeeded, tokens, cost) ─► AiAction SUCCEEDED ─► {"type":"result","output","model","balance","lensesCharged","attempt"}
  fail ─► AiCall(failed) ─► AI_REFUND (+lenses, "ai-refund:<id>") ─► AiAction FAILED
       ─► {"type":"error","error":{"code","message"},"refunded":true,"balance"}
Client disconnect: the request signal aborts the provider call; same as fail (code AI_CANCELLED).
Server restart: a 5-minute sweeper fails and refunds actions RUNNING for more than 15 minutes.

Attempt 2 (same actionId; wrong language or unreadable answer): allowed only when the action SUCCEEDED,
attempts < max, same user and feature. No charge. A failed attempt 2 refunds nothing (attempt 1 delivered).
```

### B. Character image

Same as A, on `POST /api/user/ai/images`, one attempt:

1. *Brief:* the text model (`AI_Text_Model`) rewrites the extension's long brief (names, description, chapter excerpts, novel context, the reader's image prompt) into one English image prompt of at most 900 characters, under fixed server rules (see phase 4).
2. *Image:* `POST https://openrouter.ai/api/v1/images` with `model`, `prompt` (the brief), `aspect_ratio: "1:1"`, `output_format: "jpeg"`, `n: 1`.
3. Result frame: `{"type":"result","mimeType","data" (base64),"revisedPrompt","balance","lensesCharged"}`. Both calls are `AiCall` rows (`step` `brief` and `main`).

The extension turns the image into the form's file, and the existing upload-on-save sends it to image storage, exactly like the desktop image.

### C. Top-up request

```text
Website Balance page ──GET /api/user/billing/pricing──► lens price, min, max
reader enters N and a WhatsApp or Telegram contact (prefilled from their last request)
  ──► page shows N × price (priceCents)
  ──POST /api/user/billing/requests {id, lenses:N, quotedLensPriceUsd, contactChannel, contactHandle, note?}
API: registered? billing available? N in range? contact valid? quote == current price? pending < max?
  ─► BillingRequest PENDING (email, contact and price snapshot)
  ─► email to Billing_Notify_Email with the contact link (best effort)
  ─► page says "We'll contact you on WhatsApp at +964… to arrange payment"
Owner contacts the reader (wa.me / t.me link or email from the dashboard) and receives the payment
Dashboard Billing requests ──Approve──► tx: PENDING→APPROVED (compare-and-set) + applyLensChange(TOP_UP, +N, "billing:<id>") ─► email reader
                            ──Reject {reason}──► PENDING→REJECTED with the reason ─► email reader
Reader ──Cancel──► PENDING→CANCELLED (compare-and-set)
```

### D. Trial gift and celebrations

```text
POST /auth/register/verify, POST /auth/web/register/verify, Google sign-up (Better Auth create hook)
  ─► grantTrialGift: Lens_Trial_Gift > 0 ? applyLensChange(TRIAL_GIFT, +gift, "trial:<userId>") : nothing
Extension ──GET /api/user/billing/balance?surface=extension──► { balance, notices: [TRIAL_GIFT, ADMIN_GIFT, TOP_UP rows with extensionSeenAt null] }
  any notice (gift or purchase) ─► confetti (unless reduced motion) + congratulations dialog
  ─► POST /api/user/billing/notices/seen {ids, surface: "extension"}
Website ──GET /api/user/billing/balance?surface=website──► { balance, notices: [… with websiteSeenAt null] }
  a gift ─► confetti + congratulations; a purchase ─► plain "Your 500 lenses have arrived" notice
  ─► POST /api/user/billing/notices/seen {ids, surface: "website"}
The two apps track "seen" separately, so each shows every increase once.
Refunds (AI_REFUND) and corrections (ADMIN_ADJUSTMENT) are never notices.
Gift = 0 ─► no row ─► no confetti, no congratulations.
```

### E. Website session and extension handoff

The website signs itself in with a cookie (phase 5), then reconciles with the extension through the existing bridge (`get`/`set`/`clear` on the `storylens-account` channel). It runs on load and on every session change the extension pushes.

| Website (cookie) | Extension (bridge) | Website does |
| --- | --- | --- |
| Signed in as A | Not installed | Nothing; offers the install link |
| Signed in as A | Signed out | `POST /auth/web/extension-session` → bridge `set` (A) |
| Signed in as A | Guest G | `POST /auth/web/extension-session {guestToken: G}` (G's data merges into A, as with Google sign-in) → bridge `set` (A) |
| Signed in as A | Member A | Refreshes the extension's stored user if it is stale (for example a guest upgraded in place) |
| Signed in as A | Member B | Asks: **Use A in the extension** (handoff) or **Switch this site to B** (`POST /auth/web/adopt` with B's token) |
| Signed out | Member B | `POST /auth/web/adopt` with B's token → website signed in as B |
| Signed out | Guest or signed out | Shows sign-in and registration |

Signing out on the website ends the web session and clears the extension (bridge `clear`), as today.

### F. Not enough lenses

```text
Extension AI button ─► cached balance (storylens-lens-balance) < price? ─┐
or API answers 402 INSUFFICIENT_LENSES {required, balance} ──────────────┴─► notice "You need 3 lenses (you have 1)"
  ─► background opens {website}/{locale}/profile/balance/?need=3&feature=character_image&from=extension
Guest ─► notice "Create a free account to get 10 lenses" ─► {website}/{locale}/profile/register/
Navbar balance chip (D22) ─► tooltip "Add more" ─► {website}/{locale}/profile/balance/?from=extension#request
  (guests: tooltip "Create a free account to get 10 lenses" ─► …/profile/register/)
```

## API catalogue

Default access follows `defaultAccessLevel` in `src/lib/permissions/catalog.ts`: GET is guest, writes are reader, and every admin route goes to the super admin.

### Reader API (`/api/user`)

| Method and path | Access | Purpose | Phase |
| --- | --- | --- | --- |
| `GET /billing/pricing` | **public** (`PUBLIC_ENDPOINTS`) | Lens price, currency, trial size, request limits, cloud AI on/off, and each feature's key, both names and descriptions, lenses, `enabled` and `maxPromptChars` | 3 |
| `GET /billing/balance?surface=website\|extension` | guest+ | `{ balance, notices }`: the gift and purchase rows that app has not shown yet (guests always 0 and none) | 3 |
| `POST /billing/notices/seen` | reader | `{ ids, surface }`: marks the caller's notices as shown in that app only | 3 |
| `GET /billing/transactions` | guest+ | The caller's ledger, newest first, paged | 3 |
| `GET /billing/requests` | guest+ | The caller's requests, paged, plus `lastContact` (`{ channel, handle }` of their latest request) for prefilling the form | 3 |
| `POST /billing/requests` | reader | Create a request with its WhatsApp or Telegram contact | 3 |
| `POST /billing/requests/:id/cancel` | reader | Cancel a pending request | 3 |
| `POST /ai/prompts` | reader | Run a text action (NDJSON) | 4 |
| `POST /ai/images` | reader | Run a character image action (NDJSON) | 4 |
| `POST /auth/web/login` | **public** | Email and password → web cookie | 5 |
| `POST /auth/web/register/verify` | **public** | Emailed code → account (or upgraded guest), trial gift, web cookie | 5 |
| `POST /auth/web/oauth/session` | **public** | Better Auth cookie → web cookie | 5 |
| `POST /auth/web/logout` | guest+ (`GUEST_WRITES`) | Ends the web session and clears the cookie | 5 |
| `POST /auth/web/extension-session` | reader | Web cookie → new bearer session for the extension, merging a guest | 5 |
| `POST /auth/web/adopt` | reader | Bearer (the extension's member session) → web cookie | 5 |
| `POST /ai/chapter-selectors` (existing) | guest+ | Unchanged; dated deprecation (D15) | 4 |

### Dashboard API (`/api/admin`)

| Method and path | Purpose | Phase |
| --- | --- | --- |
| `GET /billing/requests?status&search&page&pageSize` | Requests with the reader's current email, snapshot email, name, username and balance, and the reviewer | 3 |
| `POST /billing/requests/:id/approve` | Approve and credit | 3 |
| `POST /billing/requests/:id/reject` | Reject with `{ reason }` (3–500 characters) | 3 |
| `GET /billing/summary?days=30` | Counts by status, pending and approved totals, lenses granted and spent, AI cost (with the 5.5% OpenRouter fee) and per-feature averages | 3 |
| `GET /users/:id/lenses?page` | A reader's balance and ledger | 3 |
| `POST /users/:id/lenses/gifts` | `{ id, lenses, note? }` gift | 3 |
| `POST /users/:id/lenses/adjustments` | `{ id, delta, reason }` correction | 3 |
| `GET /ai-pricing` | Every pricing record | 3 |
| `PUT /ai-pricing/:key` | Partial update within the bounds above | 3 |
| `GET /ai-models?refresh` | OpenRouter text and image models with prices, and the selected two (D24) | 4 |
| `PUT /configs` (existing) | Now validates the keys above | 3 |
| `GET /users`, `GET /users/:id` (existing) | Responses gain `lensBalance` (additive) | 3 |

## Error codes

Thrown as `new HttpError({ code })`, which `onError` sends as `{ message, code, ...details }`. Codes are a contract with the clients and are never renamed. They live in `src/lib/billing/error-codes.ts` and `src/lib/ai/cloud/error-codes.ts`.

| Code | Status | Details | Where |
| --- | --- | --- | --- |
| `BILLING_UNAVAILABLE` | 503 | — | Requests when `Lens_Price_USD` is missing or invalid |
| `REGISTERED_ACCOUNT_REQUIRED` | 403 | — | Billing requests, web adopt, guests that still reach a reader route |
| `LENS_AMOUNT_OUT_OF_RANGE` | 400 | `min`, `max` | Requests |
| `PRICE_CHANGED` | 409 | `lensPriceUsd`, `lensPriceMicros` | Requests with a stale quote |
| `TOO_MANY_PENDING_REQUESTS` | 409 | `max` | Requests |
| `REQUEST_NOT_PENDING` | 409 | `status` | Cancel, approve, reject |
| `REQUEST_USER_DELETED` | 409 | — | Approve after the reader's account was deleted |
| `GUEST_ACCOUNT` | 409 | — | Gifts and adjustments to a guest |
| `NOT_A_READER` | 409 | — | Gifts and adjustments to a dashboard-only account (`isUser` false) |
| `CONTACT_INVALID` | 400 | `channel` | A WhatsApp number not in international format, or a Telegram handle that is neither `@username` (5–32 characters) nor a number |
| `REQUEST_RATE_LIMITED` | 429 | `retryAfterSeconds` | More than 10 requests by one reader in 24 hours |
| `BALANCE_TOO_LOW` | 409 | `balance` | Adjustment below zero |
| `INVALID_CONFIG_VALUE` | 400 | `key` | Admin configs |
| `INSUFFICIENT_LENSES` | 402 | `required`, `balance`, `feature` | AI start |
| `AI_UNAVAILABLE` | 503 | `reason` (`disabled`, `not-configured`, `spend-cap`) | AI start |
| `AI_FEATURE_NOT_FOUND` | 404 | — | AI start |
| `AI_FEATURE_DISABLED` | 503 | `feature` | AI start |
| `PROMPT_TOO_LARGE` | 413 | `maxChars` | AI start |
| `AI_RATE_LIMITED` | 429 | `retryAfterSeconds`, plus `Retry-After` | AI start |
| `NOVEL_CONTEXT_EXISTS` | 409 | — | `novel_context` for a novel that already has context |
| `ID_CONFLICT` | 409 | — | Action, request, gift or adjustment ID reused by another user, feature or attempt |
| `ACTION_NOT_RETRYABLE` | 409 | `reason` | Attempt 2 on a running or failed action, or past the limit |
| `WEB_ORIGIN_REQUIRED` | 403 | — | Web session routes called from another origin or without the CSRF header |
| `AI_PROVIDER_FAILED`, `AI_TIMEOUT`, `AI_EMPTY_OUTPUT`, `AI_REFUSED`, `AI_CANCELLED` | stream `error` frame | `refunded`, `balance` | During an action |

The stream frames reuse the desktop protocol's shape (`type`, `output`, `mimeType`, `data`, `error { code, message }`), so the extension reads them with the existing `readResultFrame` in `src/lib/desktop-client/job-stream.ts`. Extra fields (`balance`, `lensesCharged`, `refunded`, `revisedPrompt`) are optional.

## Invariants (each has a test)

1. For every user, `lensBalance` equals the sum of their `LensTransaction.delta` (`make lens-audit` checks it in production too).
2. `lensBalance` is never negative: conditional update plus the CHECK constraint.
3. Every balance change is one ledger row with a unique `idempotencyKey`; a replayed key changes nothing.
4. An AI action is charged at most once and refunded at most once, and only when no attempt delivered a result.
5. A billing request leaves `PENDING` exactly once; approval credits exactly once.
6. The server never stores or logs prompts, page text, AI answers or images.
7. A web session is accepted only from the cookie, only from the website's origin, and only with the CSRF header on writes; a bearer session is accepted only from `Authorization`.
8. Money is integer micro-dollars and cents everywhere; the three `priceCents` copies pass the same vectors.

## Client-side state

| App | Key or place | Holds |
| --- | --- | --- |
| Extension | `storylens-ai-source` (extension storage) | `cloud` or `desktop` (D3) |
| Extension | `storylens-ai-pricing` | Last `GET /billing/pricing` response and its fetch time |
| Extension | `storylens-lens-balance` | `{ userId, balance, updatedAt }`, for content scripts and the navbar |
| Website | none (HttpOnly cookie) | The web session; page JavaScript never reads it |
| Dashboard | existing `storylens-dashboard-token` | Unchanged |

## Security notes

- Cookie: `__Host-sl_web=<token>; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=2592000`. The website (`storylens.iscoded.com`) and the API (`storylens-api.iscoded.com`) are the same site, so the browser sends it on the website's `fetch(..., { credentials: "include" })`. Local development over plain HTTP uses `sl_web` without `Secure` (controlled by an env flag, never in production).
- `setup.ts` resolves the cookie only when there is no bearer token, the `Origin` header is the website origin (`WEBSITE_URL`, plus `WEBSITE_DEV_ORIGINS` outside production) and, for methods other than GET and HEAD, the `X-Storylens-Web: 1` header is present. Requests from other origins carrying the cookie are treated as signed out.
- CORS keeps `credentials: true`. Because the cookie is ignored from other origins, reflecting origins for bearer requests exposes nothing new.
- OpenRouter requests send `user: <userId>` (an opaque UUID, never the email), `provider.data_collection: "deny"` with a recorded fallback to any provider when a model has no such route (D18), and the per-feature `max_tokens`. The API key stays on the server.
- Contact numbers and Telegram handles are personal data: stored only on billing requests, shown only to dashboard users with the billing permission and to the reader who entered them, never logged.
- Prompts reach the server only to be forwarded. Request logging must not print bodies (check `src/plugins/logger.ts`) and errors must not echo prompt text.
- AI responses are plain text in the extension, as today: never inserted as HTML.
