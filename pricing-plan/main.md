# Lenses and cloud AI — global tracker

**Status: In progress (2026-10-02).** Phases 1–8 and 12 are done in the working tree (not committed yet; see the completion checklist). Next: extension phases 9 and 10, then 11 (release). Handoff for the next agent: `review-handoff-lenses-phases-1-7.md` at the umbrella root. The owner answered the open questions on 2026-10-02 (D1–D3, D7–D9, D12, D14, D16–D26); the other decisions use the recommended defaults and can still be changed before their phase starts. Target release: **3.4.0** for all five apps.

## Goal

Readers can use AI features without the desktop companion and pay for them with **lenses**, a virtual coin:

- The backend runs AI through OpenRouter: `google/gemini-2.5-flash` for text and `bytedance-seed/seedream-5-0-flash` for character images.
- Each AI feature costs a whole number of lenses. The cost lives in a new pricing record per feature (`AiFeaturePrice`), editable from the dashboard. The dollar price of one lens is a config value (`Lens_Price_USD`, a decimal such as `0.01`).
- New registered readers get a trial gift (`Lens_Trial_Gift`, default 10), and readers registered before the launch get it once at launch (D2). With 0, nothing is granted and no confetti or congratulations appear.
- The owner can gift lenses to any reader from the dashboard.
- A reader without enough lenses is sent to the website's profile **Balance** page. There they **request lenses** and give a WhatsApp or Telegram contact; the page computes the price in the browser from the configured lens price. The owner contacts the reader to arrange payment (D9, D21), then approves or rejects the request (rejection needs a reason) on the dashboard's new **Billing requests** page, which shows the reader's email and contact.
- The website gets standalone sign-in and registration. An extension installed later signs in from the website session automatically.
- The website lists the price of every AI feature. Every AI button in the extension shows its price with the new lens coin icon.
- The extension's navbar moves its buttons into a ⋮ menu and shows the lens balance beside it; hovering says "Add more" and clicking opens the website's request form (D22).

The desktop companion stays as a free alternative for readers who use their own Claude/Codex subscription (D3).

## Documents

- [Architecture](architecture.md): data model, money rules, flows, API catalogue, error codes, config keys and invariants. Phases refer to it instead of repeating it.
- [Lens coin drafts](assets/): `lens-coin.svg` (24 px and up), `lens-coin-small.svg` (16–20 px), `lens-coin-mono.svg` (line icon in `currentColor`, for filled buttons), `lens-coin-gold.svg` (the alternative not chosen in D17), with [size](assets/preview-sizes.png) and [variant](assets/preview-variants.png) previews in light and dark themes.

## Scope

| In scope | Out of scope (this release) |
| --- | --- |
| Lens ledger, trial gift, admin gifts and adjustments | Card or online payment processing (the owner arranges payment with each reader, D9) |
| Top-up requests: website form, dashboard review, emails | Subscriptions, discounts, coupons, refunds of lenses to money |
| Cloud AI for summaries, keyword suggestions, chapter extraction, novel context, selector detection and character images | Moving the desktop wiki crawler or the dashboard's Match translations to the cloud |
| Pricing records editable in the dashboard; lens price and trial in Configs | Per-reader custom prices or volume tiers |
| Website: standalone sign-in, registration, Balance page, Pricing page | Server-side rendering on the website (it stays a static export) |
| Extension: AI source setting, prices on every AI button, ⋮ navbar menu with the balance chip, top-up redirect, gift celebration | Offline AI (cloud AI needs a connection, like today's desktop flow needs the companion) |
| Lens coin icon in all three UIs | Changing the Lensbook logo |
| Privacy policy, terms and store disclosures for cloud AI and billing | |

## Cost model

OpenRouter list prices on 2026-10-02: Gemini 2.5 Flash costs $0.30 per million input tokens and $2.50 per million output tokens. Seedream 5.0 Flash costs about $0.018 per image (4,175 image tokens). Exa web search costs $0.007 per request with up to 10 results. Token counts are estimates (Arabic uses roughly 1.5–2× the tokens of English). Reasoning is turned off for every text feature (phase 4), otherwise Gemini's thinking tokens are billed as output.

| Feature | Key | Typical cost | Worst case within the caps | Price (D7, decided) | Value at $0.01 per lens |
| --- | --- | ---: | ---: | ---: | ---: |
| Summarize page | `page_summary` | ~$0.004 | ~$0.010 | 2 | $0.02 |
| Keyword suggestion (Use AI) | `keyword_suggestion` | ~$0.0015 | ~$0.010 (with the free retry) | 1 | $0.01 |
| Extract chapter characters | `chapter_extraction` | ~$0.007 | ~$0.08 (200k characters, both attempts) | 4 | $0.04 |
| Character image | `character_image` | ~$0.020 (image plus a short brief) | ~$0.023 | 3 | $0.03 |
| Novel context research (web search) | `novel_context` | ~$0.011 | ~$0.02 | 0 (free) | — |
| Website selector detection | `selector_detection` | ~$0.003 | ~$0.02 | 0 (free) | — |

The trial (10 lenses) covers about 5 summaries, 10 suggestions or 3 images, and costs the owner at most about $0.07 per new reader. OpenRouter adds about 5.5% when credits are bought; the dashboard's cost figures (phase 8) include it. The extraction worst case can lose money; its typical case does not, and the dashboard shows the real average cost per feature so prices can be tuned.

## Decisions (owner input)

Asked and answered in the planning session on 2026-10-02 (four rounds of questions). Rows marked *Default* were not asked; they use the recommendation and stay open to change.

| # | Decision | Outcome | Needed by | Status |
| --- | --- | --- | --- | --- |
| D1 | Who gets the trial gift | Every newly registered reader, once: verified email registration (including a guest upgrading) and Google sign-up. Never guests, who can be created again by reinstalling. Accounts created from the dashboard get none. The ledger key `trial:<userId>` makes it exactly-once. | Phase 2 | **Decided** |
| D2 | Readers registered before the launch | They get the same trial once at launch with `make grant-trial-gifts`, and see the celebration | Phase 11 | **Decided** |
| D3 | Desktop companion | Kept as a free option. **Settings → AI** chooses *Story Lens Cloud* (uses lenses) or *Desktop companion* (free, own Claude/Codex). Installs already paired stay on Desktop; others start on Cloud. Prices appear only for Cloud. The wiki crawler and the dashboard's Match translations stay desktop-only. | Phase 9 | **Decided** |
| D4 | Who builds cloud prompts | The extension, with the same prompt builders the desktop path uses, so the reader's **AI prompts** keep working. The backend fixes the model, caps prompt size and output per feature, adds its own system rules and charges once per action. | Phase 4 | Default |
| D5 | When lenses are charged | Debited atomically when an action starts (never below zero). Refunded automatically if no attempt delivers a result: provider error, timeout, empty answer, cancellation, or a server restart (a sweeper refunds stuck actions). A second attempt inside the same action (language correction or unreadable answer) is free; text actions get at most 2 attempts, images 1. | Phase 4 | Default |
| D6 | Lens units and money | Whole lenses for balances, prices and requests. `Lens_Price_USD` has up to 6 decimals. Money is integer micro-dollars, totals rounded half-up to cents, with the same function in the API, website and dashboard. USD only. | Phase 2 | Default |
| D7 | Starting prices | `Lens_Price_USD = 0.01`. Summary 2, keyword suggestion 1, chapter extraction 4, character image 3, novel context 0, selector detection 0. All editable later. | Phase 2 (seed) | **Decided** |
| D8 | Request limits | Minimum 100 lenses ($1) per request. Maximum 50,000; at most 3 pending per reader; readers can cancel a pending request. | Phase 3 | **Decided** (minimum); rest Default |
| D9 | How readers pay | The owner contacts each reader to arrange payment; the website shows no payment instructions. The owner gets an email for each new request (`Billing_Notify_Email`); the reader gets an email when it is approved or rejected, in the language they requested in. | Phase 3 | **Decided** |
| D10 | Price changes and pending requests | A request stores the price it was quoted; approval credits the requested lenses whatever the current price; a stale quote is refused (`409 PRICE_CHANGED`) and the page shows the new total. | Phase 3 | Default |
| D11 | Gifts and corrections | **Gift** adds lenses with an optional note the reader sees and a celebration. **Adjust** adds or removes lenses (never below zero), needs a reason and shows no celebration. Separate permissions. Guests receive neither. | Phase 3 | Default |
| D12 | Celebrations | **Extension:** confetti and a congratulations dialog every time the balance grows from a gift (the trial or an admin gift) or a purchase (an approved request), once per increase. **Website:** confetti for gifts, a plain notice for purchases. Each app remembers separately what it has shown, so a purchase first seen on the website still celebrates in the extension. Refunds and balance corrections never celebrate; reduced motion shows the dialog without confetti; a trial of 0 creates nothing to celebrate. | Phases 3, 7, 10 | **Decided** (extension); website part Default |
| D13 | Website session | An HttpOnly API cookie (`__Host-` prefix, `Secure`, `SameSite=Strict`), accepted only from the website's origin with a CSRF header. Page JavaScript never sees it. | Phase 5 | Default |
| D14 | Signing in the extension from the website | Automatic. The extension opens the website's profile once on install; the website hands its session to an extension that is signed out or a guest (the guest's data merges into the account); it asks when the extension holds a different account. Signing out on the website still signs out the extension. | Phases 6, 10 | **Decided** |
| D15 | Selector detection | Free and for registered readers through the cloud route; the old `POST /api/user/ai/chapter-selectors` stays for older extensions with a dated deprecation (removal at least 90 days after 3.4.0 is live). | Phase 4 | Default |
| D16 | Cost protection | **No daily spend cap at launch**: `AI_Daily_Spend_Cap_USD` exists but stays empty (off) until the owner sets it. Kept: per-reader limits (3 running, 30 started per 10 minutes) and the kill switch (`AI_Cloud_Enabled`). A credit limit on the OpenRouter key is the main protection (owner task, phase 11). | Phase 4 | **Decided** |
| D17 | Coin artwork | The iris violet coin in `assets/` (`lens-coin.svg`, `lens-coin-small.svg`, `lens-coin-mono.svg`); no new palette color | Phase 1 | **Decided** |
| D18 | Privacy routing | Prefer providers that do not keep or train on data (`provider.data_collection: "deny"`). When a model has no such route, fall back to any provider and record which policy each call used; the privacy policy says providers may keep data under their own terms. The reader's opaque ID goes as `user`; prompts and answers are never stored or logged by Story Lens. | Phase 4 | **Decided** |
| D19 | Terms for lenses | Lenses **never expire**. No cash value; not transferable; prices may change; failed AI actions are refunded automatically; other refunds at the owner's discretion. The owner reviews the English and Arabic text before publication. | Phase 11 | **Decided** (expiry); text pending review |
| D20 | **Use AI** switch in the selection panel | **Off by default for both sources** (Cloud and Desktop companion); readers turn it on each time. With Cloud its label shows the price ("◎ 1"). | Phase 10 | **Decided** |
| D21 | Contact for payment | Each request requires a channel the reader picks, **WhatsApp or Telegram**, plus the WhatsApp number (international format) or the Telegram username or number. Stored on the request, prefilled from the reader's previous request, and shown on the dashboard next to the email with a `wa.me` or `t.me` link. | Phases 3, 7, 8 | **Decided** |
| D22 | Extension navbar | A ⋮ menu holds Refresh page highlights, Theme, Language, Profile and Settings. Sync status and Back (on sub-pages) stay visible. The lens balance (coin and number) sits beside ⋮: tooltip "Add more", click opens the website's request form. Guests see ◎ 0 with "Create a free account to get 10 lenses", and clicking opens registration. The chip shows for every AI source. | Phase 10 | **Decided** |
| D23 | Staff and moderators | Everyone pays for cloud AI, moderators included; the owner can gift lenses to staff | Phase 4 | **Decided** |
| D24 | Choosing models | No model environment variable (`OPENROUTER_MODEL` removed). The models are two configs, `AI_Text_Model` and `AI_Image_Model`, chosen in the dashboard's new **Settings** page (tabs **Configs** and **AI**) from lists fetched from OpenRouter. A selected model shows its prices and each feature's estimated cost against its lenses, with how far the lens price must rise and a warning (and confirmation) when a model would lose money. Pricing records keep lenses and caps only. | Phases 2, 4, 8 | **Decided**, implemented |
| D25 | AI keyword suggestion from a text pick | The main popup does not open while AI works: the form loads in a hidden launcher tab, a card under the launcher circle shows progress, and the tab opens by itself when the answer is in, unless the reader is using a popup (then the card waits to be clicked). | Phase 12 | **Decided**, implemented |
| D26 | Arabic diacritics (حركات) | Matching always ignores them (keywords, aliases, replacements, searches, AI name comparisons) and keyword and alias names are saved without them (API, offline outbox, forms; migration `arabic_diacritics` cleans stored names unless that would duplicate a name). Hamza and madda marks stay; tatweel is ignored. | Phase 12 | **Decided**, implemented |

## Phases

Estimates are relative points (the offline-first phases used the same scale).

| # | Phase | Apps | Depends on | Estimate | Status |
| --- | --- | --- | --- | ---: | --- |
| 1 | [Lens coin icon and price chip](01-lens-coin-design.md) | umbrella, extension, website, dashboard | D17 | 2 | Done (not committed) |
| 2 | [Backend: ledger, pricing records and config](02-backend-ledger-and-config.md) | backend | D1, D6, D7 | 5 | Done (not committed) |
| 3 | [Backend: billing API](03-backend-billing-api.md) | backend | 2; D8–D12, D21 | 5 | Done (not committed) |
| 4 | [Backend: cloud AI through OpenRouter](04-backend-cloud-ai.md) | backend | 2; D4, D5, D15, D16, D18, D23 | 8 | Done (not committed) |
| 5 | [Backend: website session and extension handoff](05-backend-web-session.md) | backend | D13, D14 | 4 | Done (not committed) |
| 6 | [Website: standalone sign-in and registration](06-website-accounts.md) | website | 5 | 5 | Done (not committed) |
| 7 | [Website: balance and pricing pages](07-website-balance-and-pricing.md) | website | 1, 3, 6; D12, D21 | 5 | Done (not committed) |
| 8 | [Dashboard: billing requests, gifts, and Settings (Configs and AI)](08-dashboard-billing.md) | dashboard | 1, 3; D21 | 5 | Done (not committed) |
| 9 | [Extension: AI source and cloud transport](09-extension-cloud-ai.md) | extension | 4; D3 | 6 | Implemented, verified (not committed) |
| 10 | [Extension: navbar menu, prices, balance, top-up redirect and celebrations](10-extension-lens-ux.md) | extension | 1, 3, 7, 9; D12, D14, D20, D22 | 6 | Implemented, verified (not committed) |
| 12 | [Background AI forms and diacritic-free Arabic matching](12-launcher-ai-and-arabic-matching.md) | backend, extension | D25, D26 | 3 | Done (not committed) |
| 11 | [Legal, release and documentation](11-legal-release-and-docs.md) | all | 1–10; D2, D19 | 3 | Drafts/docs/assets ready; owner launch pending |

Total: 57 points.

### Completion checklist

Ticked when a phase's tasks are done and verified (its file has the details and what remains for the owner).

- [x] Phase 1 — Lens coin icon and price chip (chip placement on extension buttons: phase 10)
- [x] Phase 2 — Backend: ledger, pricing records and config
- [x] Phase 3 — Backend: billing API
- [x] Phase 4 — Backend: cloud AI through OpenRouter (owner: run `make ai-smoke`)
- [x] Phase 5 — Backend: website session and extension handoff
- [x] Phase 6 — Website: standalone sign-in and registration (open: end-to-end check with a phase 10 extension build)
- [x] Phase 7 — Website: balance and pricing pages (Lighthouse performance/accessibility/SEO pass; best-practices 96 from live API 401/404)
- [x] Phase 8 — Dashboard: billing requests, gifts, and Settings (Configs and AI)
- [x] Phase 9 — Extension: AI source and cloud transport
- [x] Phase 10 — Extension: navbar menu, prices, balance, top-up redirect and celebrations
- [x] Phase 12 — Background AI forms and diacritic-free Arabic matching
- [ ] Phase 11 — Legal, release and documentation

### Parallel tracks

```text
Track A (money)     2 ──► 3 ──► 4
Track B (accounts)  5 ──► 6
Track C (design)    1
                          ┌──────────────► 8 (needs 1, 3)
After A, B and C:  3,6,1 ─┴──► 7 ─┐
                   4 ──► 9 ───────┴──► 10 ──► 11
```

Phases 1, 2 and 5 can start at once. The extension phases come last because they need the API contract from phases 3 and 4, and the website's Balance page from phase 7.

## Release order (details in phase 11)

Everything in this plan is additive for the API, so older extensions and desktop clients keep working and no client floor is raised. Two deploy facts drive the order:

1. A push to the website's `main` deploys the website immediately, but the backend normally deploys only after the Chrome Web Store publishes the new extension (review-version watcher). The new website pages need the new API.
2. Therefore, right after `make deploy` publishes 3.4.0, deploy the backend by hand on the server (`make sync && make notify-dashboard`, which also deploys the dashboard), then check the website. The extension goes live later, after store review; the watcher's own `make sync` then has nothing new to apply.

Until the owner sets `AI_Cloud_Enabled=true`, cloud AI answers `503 AI_UNAVAILABLE` and the extension shows Cloud as unavailable, so the backend can go out before the owner finishes the OpenRouter setup. With no daily spend cap (D16), set a credit limit on the OpenRouter key before turning it on.

## Working rules for every phase

- Follow the root, backend, extension, website and dashboard `AGENTS.md` files. The API changes are additive. The only deprecation (D15) carries a removal date. Run `bun run typecheck` in all five submodules after every phase, the backend tests for backend changes, and each app's browser or unit tests for UI changes.
- Money and lens changes go through one backend function (`applyLensChange`, phase 2). No route updates `lensBalance` directly.
- Never store or log prompts, page text, AI answers or generated images on the server. Usage rows hold the feature, model, token counts, cost and timing only.
- New reader routes get `USER_ENDPOINT_DESCRIPTIONS` entries, and dashboard routes get `detail.summary`. After API changes, run `make orval` and `make dashboard-orval` and commit both generated clients.
- Commit in each submodule first, then the submodule pointers in the umbrella. Other agent sessions may be editing the same tree: check `git status` and `git log` before committing, and never reformat or revert hunks that are not yours.
- At the end of each phase, write `review-handoff-lenses-<phase>.md` at the umbrella root for the Codex review, and fill in the phase's *Implementation notes* and *Verification log*.
- Keep documentation in the same change as the code (each phase lists the docs it touches). Phase 11 checks that nothing was missed.

## Implementation status

| Phase | Branches and commits | Notes |
| --- | --- | --- |
| 2–5 | Backend working tree, not committed | Ledger, billing API, cloud AI, web sessions; models from configs (D24); `arabic_diacritics` migration (D26). 178 backend tests pass with the live database. |
| 8 | Dashboard working tree, not committed | Billing requests, lens dialogs, overview card, Settings page with Configs and AI tabs (D24); 16 billing browser tests pass. |
| 1, 6, 7 | Website, extension, backend and umbrella working trees, not committed | Coin components in three apps and coin PNGs for emails; standalone website accounts with reconciliation; balance and pricing pages. |
| 12 (D25, D26) | Backend and extension working trees, not committed | Launcher background tab for AI suggestions; diacritic-free matching and names. 354 extension tests pass after the continuation. |

## Verification log

| Date | Check | Result | Evidence |
| --- | --- | --- | --- |
| 2026-10-02 | OpenRouter model list: `google/gemini-2.5-flash` ($0.30 / $2.50 per million tokens) and `bytedance-seed/seedream-5-0-flash` (about $0.0000043 per image token) are listed | Pass | `GET https://openrouter.ai/api/v1/models` and `?output_modalities=image` |
| 2026-10-02 | OpenRouter image API shape: `POST /api/v1/images` returns `data[].b64_json`, `media_type` and `usage.cost`; failed or cancelled generations are not billed | Pass | OpenRouter image generation documentation |
| 2026-10-02 | `@openrouter/sdk` 0.12.35 in the backend has chat but no images client | Confirmed | `apps/backend/node_modules/@openrouter/sdk/esm/sdk/` |
| 2026-10-02 | Coin drafts are legible at 16, 20, 24, 32, 48 and 96 px in light and dark themes | Pass (visual check) | `assets/preview-sizes.png`, `assets/preview-variants.png` |

| 2026-10-02 | Codex continuation: phases 9/10 and phase 11 drafts/docs/assets | Implemented; owner launch pending | [Continuation handoff](../review-handoff-lenses-codex.md); 354 extension tests, both builds; backend 178 live tests; website 370 and dashboard 84 browser checks |
| 2026-10-02 | Local integration follow-up | Pass; real provider/email/release pending | `node scripts/lenses-e2e.mjs`: 11 scenario groups with real apps/API/PostgreSQL and simulated AI/local email; zero ledger mismatches. Fixed native worker fetch and account-scoped website billing state. New website regression passes all four browser projects; all five typechecks pass. |
