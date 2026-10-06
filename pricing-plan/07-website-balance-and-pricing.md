# Phase 7 — Website: balance and pricing pages

[Global tracker](main.md) · **Status: Done (not committed; Lighthouse run pending)** · **Estimate: 5 points** · **Depends on: phases 1, 3, 6; D8, D9, D10, D12, D21** · **Ships in: 3.4.0**

## Goal

- `/{locale}/profile/balance/`: the reader's balance, a **Request lenses** form (amount and a required WhatsApp or Telegram contact) whose price is computed in the browser, their requests (status and rejection reasons), their lens history, and the celebration for gifts. The extension sends readers here when they run out, and its navbar balance chip opens the form directly (`#request`, [flow F](architecture.md#f-not-enough-lenses)).
- `/{locale}/pricing/`: a public page listing every AI feature's price, the lens price, the trial, and how to buy lenses.

## Tasks

### 7.1 Billing client and money

- [x] `src/lib/billing/api.ts`: `getPricing()` (no credentials), and with the web cookie `getBalance()`, `markNoticesSeen(ids)`, `getTransactions(page)`, `getRequests(page)`, `createRequest({ id, lenses, quotedLensPriceUsd, note })`, `cancelRequest(id)`. Errors keep the API `code` and details (extend `AccountApiError` with `code` and `details`).
- [x] `src/lib/billing/money.ts`: `priceCents` and formatting, with the [shared test vectors](architecture.md#money-rules-d6). Display uses `Intl.NumberFormat(locale, { style: "currency", currency: "USD" })`.

### 7.2 Balance page (`src/app/[locale]/profile/balance/page.tsx`)

- [x] Static route rendering `AccountApp view="balance"` (noindex, like the other account pages; absent from the sitemap). Signed out → `login/?next=balance/`.
- [x] Profile navigation: **Profile · Balance** links at the top of the account card; the profile shows the balance with a link to this page.
- [x] **Balance card**: large color coin, the balance, "≈ $X at the current price" (muted), and a link to the pricing page.
- [x] **Need banner** when opened with `?need=<n>&feature=<key>&from=extension`: "Character image needs 3 lenses. You have 1." Feature names come from `getPricing()`. The request amount preselects the smallest preset that covers the shortfall.
- [x] **Request lenses form** (`id="request"`; opening the page with `#request` scrolls to it and focuses the amount field):
  - amount: number input (integer, `min`/`max` from pricing, step 1) plus presets (`min`, 500, 1,000, 5,000 within the limits);
  - contact (required, D21): a **WhatsApp / Telegram** choice and one text field. WhatsApp asks for the number with the country code (`+964…`, `autocomplete="tel"`, `inputmode="tel"`); Telegram accepts `@username` or a number. Prefilled from `lastContact`. Validated in the browser with the same rules as the API (`CONTACT_INVALID` from the API is shown on the field). The hint says why: "We'll message you here to arrange payment."
  - live total "500 lenses = $5.00" from `priceCents` and the unit price "($0.01 per lens)";
  - optional note (≤500 characters), for anything the reader wants the owner to know;
  - submit sends a fresh client UUID for each new request (and the same UUID if the reader presses submit again after a network error), plus the quoted price string from `getPricing()`;
  - `PRICE_CHANGED`: refresh pricing, show "The price changed to $… per lens; check the new total", keep the amount;
  - `LENS_AMOUNT_OUT_OF_RANGE`, `TOO_MANY_PENDING_REQUESTS`, `REQUEST_RATE_LIMITED`: inline messages with the limits;
  - `BILLING_UNAVAILABLE` (or `available: false` in pricing): the form is replaced by "Buying lenses is not available right now".
- [x] **After submitting**: a confirmation panel with the request summary and "We'll contact you on WhatsApp at +964… to arrange payment. Your lenses are added once the payment is confirmed." (the channel and handle from the response). No payment instructions are shown (D9).
- [x] **Your requests**: newest first, paged; status chips (Pending, Approved, Rejected, Cancelled); the contact each was sent with; the rejection reason under rejected ones; **Cancel** on pending ones (confirm first).
- [x] **History**: the ledger, paged, with localized labels: "Free trial", "Gift from Story Lens" (with the note), "Balance correction", "Purchase approved", "Summarize page" (AI charges use the feature name), "Refund: Summarize page". Positive amounts in success color, negative in the default text color, each with the coin.
- [x] **Install card** when no extension answers: "Install Story Lens to use your lenses while reading".

### 7.3 Notices and celebration (D12)

- [x] `src/components/billing/GiftCelebration.tsx`: when `getBalance()` (always `surface=website`) returns notices on any signed-in account page (profile or balance):
  - gifts (`TRIAL_GIFT`, `ADMIN_GIFT`): a native `<dialog>` (focus moved in, Escape closes, focus returned) with the large coin, "Congratulations!" and "You received 10 free lenses to try Story Lens Cloud" or "Story Lens sent you 50 lenses" plus the gift note; a short CSS sparkle burst behind it (`SparkBurst.tsx`; originally `canvas-confetti`, removed 2026-10-07);
  - top-ups (`TOP_UP`): a plain success notice, "Your 500 lenses have arrived", with no burst;
  - after showing, `markNoticesSeen(ids, "website")`; several gifts are summed into one dialog. This marks them only for the website: the extension celebrates the same increases on its own (D12).
- [x] Confetti: `canvas-confetti` (ISC, bundled, about 10 KB) loaded with `import()` only when a gift exists, with `useWorker: false` (the CSP has no `worker-src blob:`), `disableForReducedMotion: true`, the palette colors and a sparkle shape (`shapeFromPath` with the coin's four-point star). One burst, under 2 s, no loop.
- [x] `Lens_Trial_Gift = 0` means the API creates no gift, so no dialog and no confetti appear. Nothing on the website checks the config itself.
- [x] After registration (phase 6), the reader lands on the profile, so the trial celebration appears right away.

### 7.4 Pricing page (`src/app/[locale]/pricing/page.tsx`)

- [x] Static page with server-rendered copy (indexable; in the sitemap and both languages' `alternates`) and a client `PricingTable` that loads `getPricing()`:
  - one row per enabled feature: name, short description, lens price with the coin ("Free" for 0), and the dollar equivalent at the current lens price;
  - the lens price, the trial ("New accounts get 10 free lenses"; hidden when 0), and request limits;
  - loading skeleton; on failure, "Prices are unavailable right now" with **Try again**. No numbers are hard-coded in the static HTML.
- [x] Explanatory sections (native `<details>` for FAQ):
  - how lenses work (charged when an action starts, refunded automatically when it fails);
  - how to buy (request on the Balance page, the owner confirms after payment);
  - the free alternative: the desktop companion with your own Claude or Codex subscription, linking to the setup guide;
  - what is sent to AI providers when you use Story Lens Cloud, linking to the privacy policy.
- [x] Header navigation: add **Pricing** (`/{locale}/pricing/`) to the desktop nav and the footer links. On the landing page's AI or companion section, add a link to the pricing page.
- [x] Metadata: localized title and description; Open Graph like the other pages.

### 7.5 Content, analytics and privacy inventory

- [x] Strings in `src/i18n/messages/en.json` and `ar.json` (plural forms for lenses in Arabic). Copy in `design-system/copy-deck.md`; every claim must match the backend behavior.
- [x] Analytics (only in builds with GA): one new event, `lens_request_submitted`, with no parameters; page views already cover the pricing page. Update `design-system/data-inventory.md`; the privacy text changes in phase 11.

## Tests (`tests/billing.spec.ts`, `tests/pricing.spec.ts`)

| # | Test | Expected |
| --- | --- | --- |
| 1 | Balance page signed out | Redirect to `login/?next=balance/` |
| 2 | Balance 0, no requests | Balance card, form, empty history |
| 3 | Amount 500 at `0.010000`; 333 at `0.015000` | "$5.00"; "$5.00" (half-up), in English and Arabic formatting |
| 4 | Amount below min and above max | Inline error; submit disabled |
| 5 | Submit; API answers `PRICE_CHANGED` | New price shown; amount kept; second submit uses the new quote |
| 6 | Submit succeeds | Confirmation naming the channel and handle; the request listed as Pending |
| 6b | Contact: missing, WhatsApp without a country code, Telegram `@ab`, prefilled `lastContact` | Field errors in both languages; prefill used |
| 6c | Open `balance/#request` | Form scrolled into view, amount focused |
| 7 | Resubmit after a simulated network error | Same request UUID sent |
| 8 | Cancel a pending request | Confirmation dialog; status Cancelled |
| 9 | Rejected request | Reason shown |
| 10 | `?need=3&feature=character_image&from=extension` | Banner with the feature name; preset covers the shortfall |
| 11 | Notices: trial gift; admin gift with note; top-up | Dialog with confetti; dialog with note; plain notice; `notices/seen` called once with all IDs and `surface: "website"` |
| 12 | Reduced motion | Dialog without confetti |
| 13 | No notices (trial 0) | No dialog, `canvas-confetti` never loaded |
| 14 | Pricing page with mocked pricing | Rows in `sortOrder`, Free for 0, dollar equivalents; trial line hidden when 0 |
| 15 | Pricing API failure | Error message and Try again; no numbers |
| 16 | Navigation | Pricing link in header and footer, both locales; sitemap contains `/en/pricing/` and `/ar/pricing/` |
| 17 | RTL, mobile viewport, axe on both pages | Pass |

## Exit criteria

- [ ] Website typecheck, Biome, build and browser tests pass; Lighthouse on the pricing page has no regressions against the recorded budgets (`make website-lhci`), with actual results recorded under `design-system/validation/`.

## Docs and instructions

- `docs/website.md`: "Balance page" and "Pricing page" sections.
- `apps/website/AGENTS.md`: billing pages use the web cookie; prices only from `GET /api/user/billing/pricing`, never hard-coded; money through `src/lib/billing/money.ts`; confetti respects reduced motion and is loaded only when a gift exists.
- `apps/website/design-system/MASTER.md`: balance card, request form, celebration, pricing table.

## Risks

| Risk | Mitigation |
| --- | --- |
| The total shown differs from what the owner sees | One rounding rule with shared vectors; the API stores the total it computed and the website shows the API's figure after submitting |
| Readers mistype their contact | Format checks on both sides; the reader's email is always available to the owner as a fallback |
| Confetti hurts performance or accessibility | Loaded on demand, one short burst, none with reduced motion, dialog is fully usable without it |

## Implementation notes

- Billing calls reuse `call` from `src/lib/account/api.ts` with `web: true`; `AccountApiError` carries `code` and the error body (the API spreads details into it).
- The balance view lives in `AccountApp` (`view="balance"`) with `src/components/billing/BalancePage.tsx`; profile and balance share **Profile · Balance** tabs, and the profile lists the balance with a link.
- The cancel confirmation is inline (two buttons under the request) rather than a dialog.
- `canvas-confetti` 1.9.4 (ISC) is a website dependency; the default (non-worker) API is used.
- Emails already link to `/{lang}/profile/balance/` (phase 3), which is this page's path.
- Open: `make website-lhci` on the pricing page with results under `design-system/validation/`.

## Verification log

| Date | Check | Result | Evidence |
| --- | --- | --- | --- |
| 2026-10-02 | Website typecheck, Biome, build | Pass | `package.json` reformatted (whitespace) with the two new dependencies |
| 2026-10-02 | `tests/billing.spec.ts` + `tests/pricing.spec.ts` (Chromium) | Pass (28) | |
| 2026-10-02 | Full `bun run test`, all projects | 356 passed; 6 failed: 5 WebKit site timeouts under full parallel load (19/19 alone) and a flaky Firefox header test, made robust (16/16 on all projects, 4 repeats) | |
