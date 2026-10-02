# Phase 10 — Extension: navbar menu, prices, balance, top-up redirect and celebrations

[Global tracker](main.md) · **Status: Implemented and automatically verified (not committed); live provider check pending** · **Estimate: 6 points** · **Depends on: phases 1, 3, 7, 9; D12, D14, D20, D22** · **Ships in: 3.4.0**

## Goal

Readers always know what an action costs and what they have:

- every AI button shows its lens price with the coin (with the Cloud source);
- the navbar moves its buttons into a ⋮ menu and shows the lens balance beside it; hovering says "Add more" and clicking opens the website's request form (D22);
- not enough lenses opens the website's Balance page with what is missing; guests are sent to registration with the trial offer;
- every lens increase from a gift or a purchase is celebrated with confetti and a congratulations dialog, once (D12; nothing when the trial is 0);
- a fresh install opens the website once, so a website session signs the extension in (D14).

## Tasks

### 10.1 Pricing and balance caches (background)

- [x] `refreshAiPricing()`: `GET /api/user/billing/pricing` → `storylens-ai-pricing` `{ data, fetchedAt }`. Runs on browser start, on install and update, on popup open when older than 10 minutes, and before an AI action when older than 30 minutes. Failures keep the last copy (and `aiAvailability` reports `cloud-off` only when there has never been one, or `cloudAi.enabled` is false).
- [x] `refreshLensBalance()`: `GET /api/user/billing/balance?surface=extension` → `storylens-lens-balance` `{ userId, balance, updatedAt }`, plus the notices for 10.5. Runs on popup open, on `storylens-auth` changes, and after each website handoff. Cloud action frames update the balance too (phase 9).
- [x] Hooks `useAiPricing()`, `useFeaturePrice(feature)` (lenses, or `null` when unknown) and `useLensBalance()`, reacting to storage changes. Content scripts read the same keys. A cached balance from another `userId` is ignored.

### 10.2 Prices on every AI button

Shown only when the source is Cloud and the price is above 0 (free features show nothing on buttons; D3). Use `LensPrice` (phase 1): the mono coin on filled buttons, the color coin elsewhere; the accessible name and tooltip include the price ("Generate image, 3 lenses").

| Entry point | File | Treatment |
| --- | --- | --- |
| Launcher **Summarize page** action (icon only) | `content/page-popup-launcher.ts` | Price badge on the action's end-top corner (mirrored in RTL); `aria-label` and title "Summarize page, 2 lenses" |
| Launcher **Extract chapter characters** action | same | Badge and label as above |
| Summary panel **Retry** | `lib/desktop-client/page-summary.ts` | "Retry · ◎ 2" (vanilla node in the shadow root) |
| Selection panel **Use AI** switch | `popup/selection-view.tsx` | **Off by default for both sources** (D20; today it starts on): readers turn it on each time. With Cloud the label reads "Use AI ◎ 1" |
| Keyword form suggestion status | `popup.home/tabs/coloring/coloring-tab.tsx` | "Writing a suggestion… (1 lens)"; a failure says the lens was refunded when `refunded` is true |
| Extraction **Retry** | `popup.extract/extraction-view.tsx` | "Retry · ◎ 4"; the panel header shows "4 lenses" while the first run starts automatically |
| **Generate image** | `components/generate-image-button.tsx` | "Generate image ◎ 3"; when the novel has no context and `novel_context` costs more than 0, the tooltip adds "+N lenses to research this novel first" |
| Website selector **Auto-detect** | `components/node-selector/node-selector-form.tsx` | Free by default (nothing shown); a chip if the owner prices it |
| **Settings → AI**, Cloud panel | `popup.settings/ai-tab.tsx` | Balance, **Get lenses** link, and a table of every feature with its price ("Free" for 0) |

- [x] Prices update live when `storylens-ai-pricing` changes; an unknown price (no cache yet) shows no chip but does not block the action.

### 10.2a AI suggestion from a text pick runs out of sight (D25, already implemented)

The launcher now loads an AI-assisted form in a hidden tab (`openInBackground` in `content/page-popup-launcher.ts`) and opens it when the request ends, unless the reader is using a popup. Keep it working with cloud AI:

- [x] The cloud keyword suggestion keeps reporting through `useKeywordSuggestion`'s `useAiTask`/`useLauncherWork` (`working`, then done or failed); the launcher opens the tab when that task ends.
- [x] An `INSUFFICIENT_LENSES` or guest refusal counts as a failed request, so the form opens with the top-up message instead of waiting.
- [x] The **Use AI** switch's default turns off (D20); with it off the form opens at once as before.

### 10.3 Navbar: ⋮ menu and lens balance (D22)

Today's navbar (`components/navbar/navbar.tsx`) has the brand, then a horizontally scrolling row (Sync status, Refresh page, Theme, Language, Profile) and a pinned Settings or Back button. It becomes:

```text
LTR   [logo] Story Lens.             ◎ 128   [⟳ 3]   [⋮]   [←]
RTL   [→]   [⋮]   [⟳ 3]   ◎ 128             .عدسة القصة [logo]
                                                    [←]/[→] only on sub-pages and Settings
```

- [x] **Balance chip** (`components/navbar/lens-balance-button.tsx`): a compact button with the small color coin (`LensCoin`) and the balance (`Intl.NumberFormat` of the UI language; 10,000 and above in compact form, such as "12.5K", with the full number in the label). It reads `storylens-lens-balance` and updates live (after cloud actions, website handoffs and notices).
  - Registered reader: tooltip **"Add more"** ("إضافة المزيد"); accessible name "128 lenses. Add more"; click opens `websitePageUrl(locale, "profile/balance/?from=extension#request")` in a new tab, which lands on the request form (phase 7).
  - Guest: shows 0; tooltip "Create a free account to get 10 lenses" (the trial size from pricing; "Create a free account to buy lenses" when the trial is 0); click opens `profile/register/`.
  - No balance loaded yet: the coin and "—"; clicking still works. A failed refresh keeps the last cached number.
  - Shown for every AI source: lenses belong to the account (D22). Signed-out popups (between sign-out and the new guest) show nothing.
  - A short pulse when the balance grows (gift or approved top-up), skipped with reduced motion.
- [x] **Sync status**: `SyncStatusButton` stays visible, unchanged (icon, count and popover).
- [x] **⋮ menu** (`components/navbar/navbar-menu.tsx`): Mantine `Menu`, `position="bottom-end"` (mirrors in RTL), trigger `ActionIcon` with Lucide `EllipsisVertical` at 1.75 stroke and the localized name "More actions"; keyboard support from Mantine (Enter or Space opens, arrows move, Escape closes and returns focus). Items, each with its icon and a text label:
  1. **Refresh page highlights** (`RefreshCw`): closes the menu, runs `refreshContentScript()` with a loading toast, and keeps today's failure toast (`navbar.refreshContentFailed`).
  2. **Dark theme** / **Light theme** (`Moon` / `Sun`): the label names the theme it switches to.
  3. **العربية** / **English** (`Languages`): hidden for moderators, as today's `!isModerator` rule does.
  4. **Profile** (`UserRound`, with an external-link hint): opens the website's `profile/` in a new tab; now also available on the Settings page.
  5. **Settings** (`Settings2`): `go("settings")`; hidden while Settings is open.
- [x] **Back** stays a visible icon button at the end, shown when `canGoBack || isOnSettings` (today's rule). The Settings icon no longer appears in the bar; it is in the menu.
- [x] Remove `NavbarActionsScroll` and its fade gradients, `ResizeObserver` and `MutationObserver`: three or four controls never overflow, even in the 24rem toolbar popup with the Arabic wordmark. Check both languages at 24rem and in the launcher frame's fluid width.
- [x] Strings: `navbar.more`, `navbar.addLenses`, `navbar.lensBalance` (plural forms), `navbar.guestLenses`, and the menu item labels, in both languages.
- [x] Analytics: `lens_balance_opened` with `reason` `navbar` (or `guest` for guests). Menu items are not tracked.

### 10.4 Not enough lenses, and guests

- [x] `src/lib/cloud-ai/top-up.ts`: `openLensPage({ need, have, feature })` sends a background message that opens `{website}/{locale}/profile/balance/?need=<need>&feature=<key>&from=extension` with `browser.tabs.create` (no new permission needed).
- [x] Before starting a cloud action: when the cached balance is known and below the price, do not send the request; show "You need 3 lenses (you have 1). Opening your balance…" and call `openLensPage`. When the cache is unknown or stale, send the request and handle 402 the same way (the server is the authority).
- [x] Guest (or a 403 `REGISTERED_ACCOUNT_REQUIRED`): "Create a free account to get 10 lenses" (the trial size from pricing; without the number when it is 0) and open `profile/register/`.
- [x] In the launcher (vanilla): the notice uses the existing `showNotice`; in popup frames, an inline alert next to the button that started it.
- [x] The selection panel with **Use AI** on and not enough lenses: continue to the form manually (as when AI is unavailable today) and show the notice with a **Get lenses** link instead of failing.
- [x] Track `lens_balance_opened` with `reason` (`insufficient`, `navbar`, `settings`, `guest`).

### 10.5 Celebrating every lens increase (D12)

Every time the balance grows from a **gift** (the trial or an admin gift) or a **purchase** (an approved request), the extension celebrates it once with confetti and a congratulations dialog. Refunds and balance corrections never celebrate. The website tracks what it has shown separately, so a purchase already noted on the website still celebrates here.

- [x] **When it checks:** `refreshLensBalance()` calls `GET /api/user/billing/balance?surface=extension` on popup open, when a kept launcher popup is shown again (`storylens-popup-shown`, at most once per 30 s, like the stale sync), on `storylens-auth` changes, and after a website handoff. Notices are persisted in account-scoped extension storage until a main popup view can show and acknowledge them.
- [x] **Where it shows:** the toolbar popup or the launcher popup's main view; never in `view=selection` or `view=extract` (too small), which leave the notices for the next main view.
- [x] **Dialog** (Mantine `Modal`, focus moved in, Escape and the button close it, focus returned), the large color coin, the new balance, and one line per kind:
  - trial: "Congratulations! You received 10 free lenses to try Story Lens Cloud.";
  - admin gift: "Story Lens sent you 50 lenses." plus the gift note when there is one;
  - purchase: "Your purchase is complete: 500 lenses were added.";
  - several notices at once: "You received 560 lenses" with one line per notice (most recent first).
- [x] **Confetti** behind the dialog: `canvas-confetti` bundled (no remote code, MV3-safe), `useWorker: false`, `disableForReducedMotion: true`, palette colors and the coin's sparkle shape, one burst under 2 s on a canvas inside the popup document. Reduced motion shows the dialog alone.
- [x] After the dialog opens, `POST /billing/notices/seen` with the IDs and `surface: "extension"`; a failed call retries on the next check and the dialog may then show once more (better than missing one).
- [x] The navbar balance chip pulses once with the new number (skipped with reduced motion).
- [x] Trial 0: the API created no gift, so nothing shows. The extension never reads the config itself.
- [x] Track `lens_increase_celebrated` with `type` (`trial`, `gift`, `purchase`, or `mixed` for several kinds at once).

### 10.6 Sign-in from the website on install (D14)

- [x] `background/index.ts` `runtime.onInstalled` with `reason === "install"`: open `websitePageUrl(locale, "profile/?from=install")` once, with the browser UI language. The website then hands over its session (phase 6), or offers sign-in and registration. Updates do not open anything.
- [x] Opening the popup before the website answers still creates a guest as today; the website merges it when it hands over the session.

### 10.7 Strings and catalog

- [x] New strings in `public/locales/{en,ar}.json` through `bun run i18n:parse`, with Arabic plurals for lenses (`_zero`, `_one`, `_two`, `_few`, `_many`, `_other`).
- [x] The launcher's `labels()` gains the price-aware labels in both languages.
- [x] Analytics catalog in `apps/extension/AGENTS.md`: `lens_balance_opened`, `lens_increase_celebrated` (and phase 9's `provider` parameters).

### 10.8 Store listing

- [x] `apps/extension/CHROMEWEBSTORE.md` and `apps/extension/store/`: describe Story Lens Cloud, lenses and the free desktop alternative; the data disclosure gains website content and chapter text sent to the developer's server and AI providers when Cloud is used (owner updates the store form in phase 11).

## Tests

| # | Test | Expected |
| --- | --- | --- |
| 1 | Pricing cache: fresh, stale, failing refresh | Refreshed when stale; last copy kept on failure |
| 2 | Balance cache from another user | Ignored |
| 3 | `LensPrice` in each entry point (UI tests with happy-dom) for prices 0, 1 and 3, Cloud and Desktop | Chip only for Cloud and price above 0; accessible names include the price |
| 4 | Launcher badge (vanilla) from storage; price change while shown | Badge and label update |
| 5 | Balance 1, image price 3, cached | No request sent; notice; `tabs.create` with `need=3&feature=character_image&from=extension` |
| 6 | Unknown cache, API answers 402 | Same redirect with the server's numbers |
| 7 | Guest clicks an AI action | Registration page with the trial number; without the number when the trial is 0 |
| 8 | Selection panel with Use AI on and too few lenses | Manual form opens; notice with Get lenses |
| 9 | Notices: trial gift; admin gift with note; purchase; all three at once | Modal with confetti for each (the note shown; one combined modal with three lines); `notices/seen` once with `surface: "extension"` |
| 9b | A purchase the website already showed | Still celebrated in the extension (the request asks for `surface=extension`) |
| 9c | Notices arrive while only `view=selection` or `view=extract` is open | Nothing shown there; the next main view celebrates them |
| 9d | A refund after a failed action | No celebration |
| 10 | Reduced motion | Modal without confetti |
| 11 | No notices | No modal; `canvas-confetti` not loaded |
| 12 | `onInstalled` install vs update | Website opened only on install |
| 13 | Navbar balance chip: reader, guest, no balance yet, failed refresh, Desktop source | Number with tooltip "Add more" and click to `profile/balance/?from=extension#request`; 0 with the trial tooltip and click to `profile/register/`; "—"; last cached number; shown for Desktop too |
| 13b | ⋮ menu | Items in order; Language hidden for moderators; Settings hidden on Settings; Profile opens the website; Refresh shows its toasts; keyboard open, arrows and Escape with focus return |
| 13c | Back button | Visible on sub-pages and Settings only; direction mirrors in RTL |
| 13d | Layout at 24rem and in the launcher frame, English and Arabic | No overflow; no horizontal scroll |
| 13e | Selection panel Use AI default | Off with both Cloud and Desktop; the Cloud label shows the price |
| 14 | Full suite and both builds | `bun run test`, `bun run build`, `bun run build:firefox` pass |

## Exit criteria

- [x] Extension typecheck, tests and both builds pass; `rg "trackEvent\(|trackAnalyticsEvent\(" src` matches the catalog.
- [ ] Manual end-to-end on Chrome against a local backend, website and dashboard: install (website opens and signs the extension in), trial celebration, prices on each button, an action, running out, the Balance page, a dashboard approval, the purchase celebration.

## Docs and instructions

- `docs/extension.md`: the navbar (⋮ menu, balance chip, Sync status, Back), prices on buttons, the top-up redirect, celebrations, the install handoff; replace "the popup's profile button opens that page" with the Profile menu item.
- `apps/extension/AGENTS.md`: the navbar layout rule (balance chip, Sync status, ⋮ menu and Back only; new navbar actions go into the menu); prices only through `LensPrice` or the launcher badge and only for Cloud; the redirect helper; every gift and purchase notice is celebrated once with confetti (never refunds or corrections, never with reduced motion) and marked seen with `surface: "extension"`; the selection panel's Use AI starts off.

## Risks

| Risk | Mitigation |
| --- | --- |
| Opening a tab on install feels intrusive | Only on first install; it is the sign-in page the reader needs anyway |
| A stale cached balance blocks an affordable action | Only a known, recent balance blocks; otherwise the server decides |
| Too much visual noise on the launcher | Badges only for priced features and only with Cloud; small mono coin |

## Implementation notes

Pricing/balance caches, all action prices, navbar menu/chip, redirects, install handoff and main-popup celebrations are implemented. Notices use a short background lease across simultaneous popups; failed acknowledgement retries on a later refresh. Purchases are distinct from refunds/adjustments. Use AI starts off. Store drafts and both language captures show the current UI, including the Cloud image price. Real local website/extension account handoff and billing/notice checks now pass; real payment/email/provider and the broader reading UI checks remain in phase 11.

## Verification log

| Date | Check | Result | Evidence |
| --- | --- | --- | --- |

| 2026-10-02 | Extension typecheck, full suite, Chrome and Firefox production builds | Pass | 354 tests; `test/cloud-ai.test.ts`, `test/ui/components.test.tsx`; WXT Chrome MV3 / Firefox MV2 builds |
| 2026-10-02 | Isolated production-build capture, both languages | Pass | `docs/chrome-store/capture.mjs`; 17 English / Arabic highlighted matches, replacement and queued offline edit verified; updated PNG/video and website media |
| 2026-10-02 | Local account handoff, billing approvals/rejections and notices | Pass | `node scripts/lenses-e2e.mjs`: first install, guest/account handoff, both account choices, shared sign-out, one trial/purchase/gift per app and corrections without celebration. Email is logged locally; no actual payment. |
