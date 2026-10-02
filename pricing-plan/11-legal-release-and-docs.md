# Phase 11 — Legal, release and documentation

[Global tracker](main.md) · **Status: Drafts, documentation and assets prepared; owner approval and launch pending** · **Estimate: 3 points** · **Depends on: phases 1–10; D2, D19** · **Ships in: 3.4.0**

## Goal

Ship 3.4.0 safely: legal texts that match the new data flows and the lens terms, the owner's OpenRouter and config setup, a deploy order that never leaves the website pointing at missing endpoints, an end-to-end check, and documentation with no stale guidance.

## Tasks

### 11.1 Privacy policy and data inventory (owner reviews before publication)

Legal bodies live in `apps/website/src/content/legal/{en,ar}`; update both languages, the version, `lastUpdated` and `design-system/legal-changelog.md` together, after checking every claim against the code.

- [x] **Cloud AI**: when a reader uses Story Lens Cloud, the extension sends the page text (summaries), chapter text and nearby text (suggestions and extraction), names, descriptions and chapter passages (images), the novel's title, slugs and description (research), and the reader's own AI prompts, to the Story Lens API, which forwards them to OpenRouter and from there to Google (Gemini) and ByteDance (Seedream). State the D18 outcome: Story Lens asks OpenRouter for providers that do not keep or train on data, but falls back to other providers when a model has none, and those providers may keep data under their own terms. State also that Story Lens stores no prompts, answers or images from these requests, only usage records (feature, model, token counts, cost, time, success). Generated images are stored only if the reader saves them, as uploads already are.
- [x] **Billing**: lens balance and history; top-up requests (amount, price, the **WhatsApp number or Telegram username/number** the reader gives so the owner can contact them about payment, optional note, the email at the time, status, reviewer, rejection reason, timestamps); the emails sent about requests (Resend); payment is arranged directly with the owner outside Story Lens (D9, D21), and Story Lens does not process or store payment details. Say how long requests and their contact details are kept and that readers can ask for deletion.
- [x] **Website session**: a first-party, HttpOnly cookie from the Story Lens API that keeps the reader signed in on the website for up to 30 days.
- [x] **Analytics**: the new events (`lens_request_submitted` on the website; `lens_balance_opened`, `lens_increase_celebrated`, `ai_source_changed` and the `provider` parameter in the extension), none carrying content or identifiers.
- [x] `design-system/data-inventory.md` and `design-system/store-privacy-answers.md` match the policy.
- [ ] Chrome Web Store privacy practices form (owner): website content is now transmitted to the developer's server when Cloud is used; usage stays within the stated purpose. Update the listing text from `apps/extension/CHROMEWEBSTORE.md`.

### 11.2 Terms of use (D19)

- [x] A "Lenses" section in both languages: lenses are a prepaid credit for Story Lens Cloud features; no cash value; not transferable; they do not expire; prices of features and lenses can change (changes do not affect lenses already in the account or a request already made); a failed AI action is refunded automatically; other refunds at the operator's discretion; the operator may refuse or cancel a request; misuse can lead to suspension.
- [ ] The owner approves the text before publication (website rule: public legal decisions need the owner's review).

### 11.3 Language review

- [ ] A native Arabic review of every new string: extension `public/locales/ar.json`, website `src/i18n/messages/ar.json`, the Arabic pricing record names and descriptions, email templates, and legal text. Check the six Arabic plural forms of "lens" (عدسة).

### 11.4 Owner setup (before turning Cloud on)

- [ ] OpenRouter: create a dedicated key for production with a **monthly credit limit**. With no daily cap in Story Lens (D16), this limit is the main protection against runaway costs. Keep the account's data-policy settings compatible with D18 (prefer no-training providers, allow fallback). Set `OPENROUTER_API_KEY` in the server's `.env`.
- [ ] Resend: confirm `RESEND_API_KEY` and `EMAIL_FROM`, so billing emails go out.
- [ ] Dashboard **Configs**: check `Lens_Price_USD` (0.01), `Lens_Trial_Gift` (10) and the request limits (min 100), and set `Billing_Notify_Email` to the address that should receive each request with the reader's WhatsApp or Telegram contact. Leave `AI_Daily_Spend_Cap_USD` empty (D16) and `AI_Cloud_Enabled=false` for now.
- [ ] Dashboard **Settings → AI**: confirm the six records (D7) and the two models (D24); no loss warnings.
- [ ] Custom dashboard roles (if any) get the new billing and AI pricing permissions in the role editor, if they should see them.
- [ ] Server Postgres is 11 or newer (the `lensBalance` default does not rewrite `User`).

### 11.5 Release runbook

The xeploy release publishes every submodule's `main` at once. The website deploys on that push, but the backend normally deploys only after the store publishes the extension, so it must be deployed by hand right away.

1. [ ] All phases merged to `develop` in every submodule; root `make typecheck` and `make test`; backend `make test-live` on a disposable database; `make deprecations` clean.
2. [ ] Migrations rehearsed on a copy of production data (`lenses`, `session_kind`); `make lens-audit` clean on the copy.
3. [ ] `docs/changelog/v3.4.0.md` written (below).
4. [ ] Owner runs `make deploy` (xeploy: bump to 3.4.0, tag, publish to each `main`). The extension's publish workflow submits it to the store and dispatches `extension-submitted`.
5. [ ] Immediately, on the server: `cd /srv/storylens-backend && make sync && make notify-dashboard`. This applies the migrations, restarts the API and deploys the dashboard. Old extensions keep working: every API change is additive.
6. [ ] Check `GET /api/user/billing/pricing` in production, then the website: register without the extension, see the trial celebration, request lenses; the dashboard shows the request with the email; approve it; the email arrives.
7. [ ] On the server: `make ai-smoke`. Record the routed providers and costs in phase 4's log. Resolve D18 if a model cannot be routed with `deny`.
8. [ ] Set `AI_Cloud_Enabled=true` in Configs.
9. [ ] D2 (decided): `make grant-trial-gifts` (dry run), then `CONFIRM=1 make grant-trial-gifts`, so readers registered before the launch get the trial and see the celebration.
10. [ ] When the store publishes 3.4.0, the review-version watcher runs `make sync` again (nothing new to apply) and notifies the dashboard. Verify with the published extension: install → website opens and signs it in → prices on buttons → an action charges and returns → running out opens the Balance page.

**Rollback:** turn `AI_Cloud_Enabled` off (instant, stops spending). Website: switch `/var/www/storylens/current` to the previous release. Backend: redeploy the previous commit; the migrations are additive, so the old code ignores the new tables and columns. Never drop the new tables while lenses exist.

### 11.6 End-to-end checklist (local or staging, before step 4)

- [ ] Website without the extension: register (trial celebration), sign out, sign in, Google sign-in, password and email change.
- [x] Install a development extension build: the website opens, the extension signs in; a guest created earlier merges. Verified against the real local API/database and extension bridge.
- [x] Extension signed in as another account: the website asks; both choices work. Verified in the isolated local browser rehearsal.
- [ ] Each Cloud feature: summary, suggestion, extraction, image, novel research (on a novel without context), selector detection; prices on the buttons; balance updates; language retry costs nothing; cancelling refunds.
- [ ] Not enough lenses: Balance page opens with the need banner; request with a WhatsApp contact and with a Telegram username; the owner email and the dashboard show working wa.me and t.me links; dashboard approve; the extension celebrates the purchase with confetti on its next open, even if the website already showed the notice; the website history shows the purchase.
- [ ] Navbar: the balance chip shows the balance, says "Add more" on hover and opens the request form; a guest's chip opens registration; the ⋮ menu items all work; Sync status and Back stay visible.
- [ ] Selection panel: **Use AI** starts off with both the Cloud and the Desktop source.
- [ ] Reject with a reason: the reader sees the reason on the website and in the email.
- [ ] Gift from the dashboard: one celebration in the extension and one on the website, never twice in the same app; a refund or a balance correction celebrates nothing.
- [ ] `Lens_Trial_Gift=0`: a new registration gets nothing and sees no celebration.
- [ ] Desktop source: free, no prices, unchanged behavior.
- [ ] An extension 3.3.1 build against the new backend: everything works as before, including the legacy selector route (with deprecation headers).
- [ ] Arabic and RTL across the new website pages, dashboard pages and extension surfaces; dark mode; reduced motion.

### 11.7 Documentation sweep

- [x] `docs/changelog/v3.4.0.md`: Story Lens Cloud and lenses, the new website pages, the dashboard pages, compatibility (no client floor raised; legacy selector route deprecated with its date).
- [x] `docs/backend.md`, `docs/extension.md`, `docs/website.md`, `docs/dashboard.md`, `docs/client.md`, `docs/compatibility.md`, `docs/development.md` (new env variables and Make targets), `docs/branding/README.md`: check each section the phases added against the shipped code.
- [x] Root `AGENTS.md`: mention Story Lens Cloud and lenses in the opening description and the repository map (backend owns billing and cloud AI; the website owns the Balance and Pricing pages; the dashboard owns Billing requests and the Settings page with Configs and AI).
- [x] App `AGENTS.md` files: the rules each phase listed are present and accurate; every `CLAUDE.md` is still only `@AGENTS.md`.
- [x] `README.md`: features list and the free desktop alternative.
- [x] `docs/intro.md`: mark this tracker as implemented, like the offline-first tracker line.
- [x] Refresh the store screenshots and the website's extension screenshots if the AI buttons or settings changed visibly (`docs/chrome-store/README.md` workflow).

### 11.8 After launch

- [ ] Two weeks after launch: review the dashboard's per-feature average cost and margins; adjust prices or caps.
- [ ] Watch `DEPRECATED POST /api/user/ai/chapter-selectors` log lines; remove the route after its date once they stop (phase 4.8).
- [ ] Monthly `make lens-audit`.

## Exit criteria

- [ ] Legal texts published with the owner's approval; store form updated.
- [ ] Release steps 1–10 done; checklist 11.6 passed and recorded in the verification log.
- [ ] Documentation sweep done; the tracker's phases all marked done with their evidence.

## Risks

| Risk | Mitigation |
| --- | --- |
| Website live before the backend | Step 5 immediately after `make deploy`; the website shows errors (not broken pages) if the API answers 404 meanwhile |
| Costs spike at launch | OpenRouter key credit limit (there is no daily cap, D16), per-reader limits, the kill switch, and the dashboard's daily cost figures |
| Store review rejects the new data use | Disclosures and the store form updated before submission; Settings → AI explains what Cloud sends; the desktop source still works without it |
| Legal text promises more than the code does | Every claim checked against the code and the data inventory before publication |

## Implementation notes

Privacy 1.3.0 and Terms 1.2.0 are bilingual drafts dated 2026-10-02. Inventory/store drafts match current sources, including the 400-day completed AI usage cleanup and separately retained ledger/contact data. Listing/privacy exports are mirrored in the extension and umbrella. Changelog, instructions, setup/compatibility docs and both locale store/website media are updated. No versions were bumped, commits made, store forms submitted or releases deployed. Owner legal/native Arabic review, provider credit limit/smoke, production-copy migration/audit, live account/extension/payment checks and the release sequence remain open. Lighthouse performance/accessibility/SEO and CLS/LCP budgets pass; its strict best-practices budget remains failed because the live API returns expected anonymous 401 and pre-release billing 404 console entries.

The [local browser rehearsal](../docs/lenses-local-e2e.md) now passes 11 scenario groups using real apps, HTTP routes and a fresh PostgreSQL database, with a simulated provider and development email logs. It establishes cookie/extension account handoff, both account choices, shared sign-out, trial/purchase/gift acknowledgement per app, WhatsApp approval, Telegram rejection, all six Cloud background routes, free second attempts, cancellation/refund and ledger consistency. It caught and fixed the worker's incorrectly invoked native `fetch`. The website also tags balances by account and resets account-owned billing/celebration state; a delayed-response regression passes all four browser projects. Google OAuth/account changes, feature-specific reading UI, Desktop, real provider/email/payment, old packaged clients and production-data rehearsal remain open. Production artifacts were rebuilt with normal configuration after the local run.

## Verification log

| Date | Check | Result | Evidence |
| --- | --- | --- | --- |

| 2026-10-02 | Backend full live suite on disposable `storylens_lenses_test`; dated deprecations | Pass | 178 tests; one deprecation, removal 2027-01-31 |
| 2026-10-02 | Website production build, Biome, complete Playwright suite | Pass | 370 passed / 18 explicit skips; final media checks 12 passed / 4 skips |
| 2026-10-02 | Dashboard lint/build and complete Playwright suite | Pass | 84 passed / 2 live-API skips |
| 2026-10-02 | Lighthouse: home en/ar, privacy en, pricing en/ar | Partial | Performance/accessibility/SEO 100; CLS 0–0.0153, LCP 1141–1168 ms; best practices 96 from live API 401/404 console errors, budgets unchanged |
| 2026-10-02 | Legal and store drafts, synchronized docs/changelog/media | Prepared | Owner approval, native Arabic review and production release remain pending |
| 2026-10-02 | Local extension/website/dashboard/API/PostgreSQL rehearsal | Pass with simulated AI and local email logs | `node scripts/lenses-e2e.mjs`: 11 scenario groups; 7 actions, 13 calls; zero ledger mismatches; disposable database/services cleaned up |
| 2026-10-02 | Website account/billing follow-up and account-switch regression | Pass | 59 Chromium checks; delayed new-account balance/gift regression passes Chromium, Firefox, WebKit and mobile |
| 2026-10-02 | Follow-up quality checks | Pass | All five typechecks; extension 354 tests and Chrome/Firefox builds; client 33 tests; backend 73 tests / 105 explicit live-test skips; website/dashboard production artifacts restored |
