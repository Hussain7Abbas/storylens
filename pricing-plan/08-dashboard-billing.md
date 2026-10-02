# Phase 8 — Dashboard: billing requests, gifts, and Settings (Configs and AI)

[Global tracker](main.md) · **Status: Done (not committed)** · **Estimate: 5 points** · **Depends on: phases 1, 3; D21** · **Ships in: 3.4.0**

## Goal

Everything the owner needs to run lenses from the dashboard:

- a **Billing requests** page to approve, or reject with a reason, each top-up request, always showing the reader's email and their WhatsApp or Telegram contact, so the owner can arrange payment (D9, D21);
- gifts and balance adjustments, with each reader's lens history, on the Users page;
- a **Settings** page with **Configs** and **AI** tabs: the AI tab chooses the text and image models from OpenRouter's catalogue (saved as configs), shows their prices and each feature's estimated cost against its lenses with a loss warning, and edits each feature's lenses and limits with the real average cost next to each price (D24);
- hints and validation for the new config keys, and billing figures on the Overview.

## Tasks

### 8.1 Client and permissions

- [x] `make dashboard-orval` after phase 3; use the generated hooks (generated, not committed yet).
- [x] `src/lib/permissions.ts`: add

  ```ts
  billing: {
    requests: "GET /api/admin/billing/requests",
    approve: "POST /api/admin/billing/requests/:id/approve",
    reject: "POST /api/admin/billing/requests/:id/reject",
    summary: "GET /api/admin/billing/summary",
  },
  lenses: {
    history: "GET /api/admin/users/:id/lenses",
    gift: "POST /api/admin/users/:id/lenses/gifts",
    adjust: "POST /api/admin/users/:id/lenses/adjustments",
  },
  aiPricing: {
    list: "GET /api/admin/ai-pricing/",
    update: "PUT /api/admin/ai-pricing/:key",
  },
  ```

  (Match the exact keys the backend syncs, including trailing slashes, as the existing entries do.)
- [x] `src/lib/money.ts`: `priceCents` and formatting with the [shared vectors](architecture.md#money-rules-d6).

### 8.2 Billing requests page (`src/pages/billing-requests.tsx`, `/billing-requests`)

- [x] Route guarded by `Allow permission={PERMISSIONS.billing.requests}`; sidebar item **Billing requests** (Lucide `ReceiptText` or `HandCoins`) with a pending-count badge from `counts.PENDING` (refetched every 60 s and on window focus). Add it to `Home`'s fallback list.
- [x] Status tabs with counts: **Pending** (default, oldest first), **Approved**, **Rejected**, **Cancelled**, **All**. Search box (email, contact, username, name), state in the URL (`useSearchState`), pagination.
- [x] Table columns (scrolling inside its card at 375 px):
  - **Reader**: name and `@username`; "Deleted account" when `user` is null;
  - **Contact**: a WhatsApp or Telegram icon, the handle, and a link that opens the chat (`https://wa.me/<digits>` with a prefilled message such as "Hi, about your Story Lens request for 500 lenses ($5.00)…"; `https://t.me/<username>` or `https://t.me/+<digits>` for Telegram), plus a copy button;
  - **Email**: the current email as a `mailto:` link (subject "Story Lens lens request <short id>"), and "At request: …" when the snapshot differs;
  - **Lenses** with the coin; **Total** in USD with "$0.01 per lens" under it;
  - **Requested**: relative time with the exact time in a tooltip;
  - **Note**: the reader's note (truncated, full text on hover or expand);
  - **Status**: chip; for processed ones, who reviewed and when, and the rejection reason;
  - **Current balance** of the reader;
  - **Actions** (pending only, by permission): **Approve**, **Reject**.
- [x] **Approve** opens a `ConfirmDialog`: "Add 500 lenses ($5.00) to Hussain (reader@example.com)? Only approve after you have received the payment." The dialog also shows the reader's contact ("WhatsApp +9647…"). On success a toast, and the row leaves the Pending tab. A 409 `REQUEST_NOT_PENDING` shows "Already handled by …" in the dialog and refreshes the list; `REQUEST_USER_DELETED` explains that the account no longer exists.
- [x] **Reject** opens a dialog with a required reason (3–500 characters, counter, "The reader will see this reason"), errors shown in the dialog.
- [x] Wrap every toggling text in a `<span>` (the translator crash rule in `AGENTS.md`).

### 8.3 Users page (`src/pages/users.tsx`)

- [x] **Lenses** column with the balance (hidden for dashboard-only accounts and shown as "—" for guests).
- [x] Row actions (by permission, not for guests or dashboard-only accounts):
  - **Gift lenses**: amount (1–100,000) and an optional note (≤300) with a preview, "The reader will see: Story Lens sent you 50 lenses — <note>". Sends a client UUID per dialog opening.
  - **Adjust balance**: signed amount and a required reason (3–300), "Not shown to the reader"; the form prevents going below zero using the current balance; the API enforces it (`BALANCE_TOO_LOW`).
  - **Lens history**: a dialog with the ledger (type, change, balance after, feature, note or reason, by whom, when), paged.

### 8.4 Settings → AI tab (`src/components/settings/ai-settings.tsx`, `/settings?tab=ai`; `/ai-pricing` redirects)

Changed on 2026-10-02 (D24): the page became the AI tab of a Settings page, and models moved from the records to two configs.

- [x] **Models** card: **Text model** and **Image model** searchable pickers loaded from `GET /api/admin/ai-models/` (OpenRouter's catalogue with prices, cached 10 minutes, **Refresh**). Selecting one shows its prices; saving writes `AI_Text_Model`/`AI_Image_Model` through `PUT /configs`.
- [x] A cost table per feature with the selected models (typical tokens from `src/lib/ai-cost.ts`, OpenRouter's 1.055 fee, Exa search for research): estimated cost, what the lenses earn at the current lens price, a free/ok/thin/loss marker, the lenses that break even and keep a 1.5× margin, and the lens price every feature would need. A model that loses money needs a confirmation before saving.
- [x] **Cloud AI** switch (`AI_Cloud_Enabled`).
- [x] One card or row per feature (from `GET /ai-pricing/`): English and Arabic name and description, **lenses** (0 shows "Free"), **enabled** switch, `maxPromptChars`, `maxOutputTokens`. Edit and save per feature, with inline validation matching the API bounds.
- [x] Next to each price, from `GET /billing/summary?days=30`: actions, failure rate, average cost per action (including the 1.055 fee), the price's value at the current lens price, and a margin indicator (success color when the value covers the average cost by at least 50%, warning below that, error when it does not cover it).
- [x] A header panel with the current `Lens_Price_USD`, `Lens_Trial_Gift` and `AI_Cloud_Enabled` values and a link to Configs to change them.
- [x] Changing a model shows "This changes what each action costs you. Run `make ai-smoke` on the server after changing models."

### 8.5 Settings → Configs tab (`src/pages/configs.tsx` as `ConfigsPanel`, `/settings?tab=configs`; `/configs` redirects)

- [x] Add every key from [Config keys](architecture.md#config-keys) to `KNOWN_KEYS` with its description, format and default.
- [x] ~~Use a textarea for the two payment-instruction keys.~~ Dropped: there are no payment-instruction keys (D9, the owner contacts each reader). Free-form values use a textarea.
- [x] Show `INVALID_CONFIG_VALUE` messages next to the form.

### 8.6 Overview (`src/pages/overview.tsx`)

- [x] Cards guarded by `PERMISSIONS.billing.summary`: pending requests (links to the page), lenses sold and dollars approved in the last 30 days, lenses granted (trial and gifts) and spent, AI cost in the last 30 days (with the fee), and spent lenses' value minus AI cost.

### 8.7 Fixtures and tests (`tests/dashboard.spec.ts`, `tests/fixtures.ts`)

| # | Test | Expected |
| --- | --- | --- |
| 1 | Billing page, Pending tab | Rows oldest first; contact with the right wa.me or t.me link, email, snapshot email when different, lenses, total, note, balance |
| 2 | Approve | Confirm dialog with the summary; API called once; toast; row leaves the tab; badge count drops |
| 3 | Approve answered with `REQUEST_NOT_PENDING` | Message in the dialog; list refreshed |
| 4 | Reject without a reason, with 2 characters, with a valid reason | Disabled, error, success; reason visible on the Rejected tab |
| 5 | Search and tabs | URL state; counts |
| 6 | Role without billing permissions | No sidebar item; direct URL shows `Forbidden`; no actions |
| 7 | Gift dialog | Validation; preview; API body includes a UUID; balance column updates |
| 8 | Adjust below zero | Client error; API `BALANCE_TOO_LOW` shown if reached |
| 9 | Lens history dialog | Rows and paging |
| 10 | Settings → AI: feature edit with invalid lenses, valid save; model picker shows prices; a money-losing model asks for confirmation | Error; saved; margin indicator recomputed; confirmation shown |
| 11 | Configs with an invalid `Lens_Price_USD` | API message next to the form |
| 12 | Overview billing cards | Figures from the mocked summary |
| 13 | Translator test (`translatePage`) on the new pages | No React crash |
| 14 | axe; 375 px width without horizontal page scroll; light and dark | Pass |
| 15 | `tests/live-api.spec.ts` (opt-in) | Approve a seeded pending request against a real local backend and see the balance change |

## Exit criteria

- [x] `bun run typecheck`, `bun run lint`, `bun run build` and `bun run test` pass in `apps/dashboard`.

## Docs and instructions

- `docs/dashboard.md` "What it manages": Billing requests, gifts and adjustments, the Settings page (Configs and AI tabs), the new configs.
- `apps/dashboard/AGENTS.md`: approvals always confirm and say to approve only after payment; rejections require a reason; the Billing requests page always shows the reader's contact and current email (and the snapshot when it differs); contact links are built only from the normalized handle; money through `src/lib/money.ts`.
- `apps/dashboard/README.md`: page list.

## Risks

| Risk | Mitigation |
| --- | --- |
| Approving the wrong request | Confirm dialog names the reader, email, lenses and total; adjustments can undo it with a reason |
| Two admins act at once | API compare-and-set; the second gets a clear "already handled" message |
| Owner tunes prices on too little data | Show the number of actions behind each average; hide the margin indicator under 20 actions |

## Implementation notes

- The AI pricing page became the **AI** tab of a new **Settings** page (with **Configs**), and the tab chooses the OpenRouter models (D24). `/configs` and `/ai-pricing` redirect.
- Text-only tables (the cost table, the lens history) stack into label and value rows on phones (`data-table-stack`), because a scroll area without focusable content fails keyboard access (axe `scrollable-region-focusable`).
- `package.json` was reformatted (whitespace only) because the 3.3.1 release bump left it failing `bun run lint`.

## Verification log

| Date | Check | Result | Evidence |
| --- | --- | --- | --- |
| 2026-10-02 | `bun run typecheck`, `bun run lint`, `bun run build` | Pass | |
| 2026-10-02 | `bun run test` (Playwright + axe, desktop and mobile) | Pass after the stacked-table fix (`tests/billing.spec.ts` 32/32) | the first full run failed two mobile axe checks |
