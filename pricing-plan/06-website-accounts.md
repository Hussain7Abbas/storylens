# Phase 6 — Website: standalone sign-in and registration

[Global tracker](main.md) · **Status: Done (not committed; the end-to-end check with a real extension build waits for phase 10)** · **Estimate: 5 points** · **Depends on: phase 5; D13, D14** · **Ships in: 3.4.0**

## Goal

The account pages (`/{locale}/profile/`, `login/`, `register/`, `password/`, `email/`, `oauth/`) work **without the extension**. The website signs itself in with the web cookie from phase 5, then keeps an installed extension in step through the existing bridge ([flow E](architecture.md#e-website-session-and-extension-handoff)). A reader can register on the website today, install the extension next week, and find it already signed in.

## Current state (for reference)

- `src/components/account/AccountApp.tsx` asks the extension for its session through `src/lib/account/bridge.ts`. Without an answer within 1.5 s it renders `MissingExtension` instead of any form.
- Sessions come back from the API in the response body and go straight into the extension (`saveSession` → bridge `set`); the website keeps nothing.
- `src/lib/account/api.ts` calls `/api/user/auth/*` with the bearer token held by the extension.

## Tasks

### 6.1 API client (`src/lib/account/api.ts`)

- [x] A `webCall` variant of `call`: `credentials: "include"` and `X-Storylens-Web: 1` on every request.
- [x] New functions: `webLogin`, `webVerifyRegistration` (sends the extension guest's token as bearer when there is one), `webCompleteOAuth`, `webLogout`, `getWebMe` (`GET /api/user/auth/me` through the cookie; 401 means signed out), `createExtensionSession(guestToken?)`, `adoptExtensionSession(token)`.
- [x] `updateProfile`, `changePassword`, `verifyPasswordChange`, `changeEmail` and `verifyEmailChange` use the cookie instead of a token parameter.
- [x] `register` (step 1) is unchanged: it sends the guest token when the extension holds a guest.

### 6.2 Session state

- [x] `src/lib/account/web-session.ts`: a small store (React context in `AccountApp`) with `loading | signed-out | signed-in(user)` from `getWebMe()`, and `refresh()`.
- [x] Bridge state stays as today (`detecting | missing | ready(session)`), but it no longer blocks rendering.

### 6.3 Reconciliation (`src/lib/account/reconcile.ts`)

- [x] A pure function `decide(web, bridge)` returning one of `none | offer-install | hand-off | hand-off-merging-guest | refresh-extension-user | ask-which-account | adopt | show-forms`, exactly the table in [flow E](architecture.md#e-website-session-and-extension-handoff). Unit-tested on its own.
- [x] An effect in `AccountApp` runs it on load, after every sign-in, registration or OAuth return, and whenever the extension pushes a session change (`subscribeSession`). Each automatic action runs at most once per state pair, so a failing call cannot loop.
- [x] `hand-off`: `createExtensionSession(guestToken?)` then bridge `set`. `adopt`: `adoptExtensionSession(bridge token)` then `refresh()`. `refresh-extension-user`: bridge `set` with the fresh user and the extension's existing token.
- [x] `ask-which-account`: a card "The extension is signed in as B." with **Use A in the extension** and **Switch this site to B**. Choosing A replaces the extension's session; B's unsent offline changes stay in the extension as "made while signed in as another account" (the offline engine already holds them, decision D10 of the offline plan).

### 6.4 Views

- [x] Render forms and pages from the web session, not the bridge:
  - signed out: `login` and `register` show their forms (with **Continue with Google** when enabled); `profile`, `password`, `email` and `balance` (phase 7) redirect to `login/?next=<view>`;
  - signed in: `login` and `register` show `SignedIn` with a link to the profile.
- [x] `MissingExtension` becomes a non-blocking card on the profile: "Install Story Lens to use your account while reading", with the Chrome Web Store link (`data-analytics-cta="profile"`).
- [x] The profile shows the extension status: connected as this account, not installed, signed in as another account (with the choice above), or a guest that will be merged.
- [x] `?next=` accepts only relative paths under `/{locale}/profile/` or `/{locale}/pricing/`; anything else falls back to the profile (no open redirect).
- [x] Sign-out: `webLogout()`, then bridge `clear` when the extension holds the same account (today's behavior). When it holds a different account, only the website signs out.
- [x] Registration from a guest: step 1 sends the guest token (keeps its username), step 2 `webVerifyRegistration` upgrades the guest in place, then reconciliation sees "same user, stale" and refreshes the extension's stored user. A `gift` in the response is celebrated on the next page (phase 7).
- [x] Google: `/profile/oauth/` calls `webCompleteOAuth`, then reconciliation hands the session to the extension, merging its guest.

### 6.5 Header

- [x] `src/components/layout/Shell.tsx`: a **Sign in** link in the header, replaced by an account link with the reader's name once `getWebMe()` resolves. Render a fixed-width placeholder first, so the static header does not shift. The footer's account link stays.
- [x] This adds one `GET /auth/me` per page view for signed-in readers only when the cookie exists; signed-out visitors get a cheap 401. If that is too chatty, cache the result in `sessionStorage` for 5 minutes (user payload only, never a token).

### 6.6 Content and i18n

- [x] New and changed strings in `src/i18n/messages/en.json` and `ar.json` (extension status card, account switch prompt, install card, header sign-in).
- [x] `design-system/copy-deck.md`: the account copy changes.

## Tests (`tests/account.spec.ts` and a new `tests/account-reconcile.spec.ts`)

The API is mocked with Playwright routes, as today; the fake bridge stands in for the extension.

| # | Test | Expected |
| --- | --- | --- |
| 1 | No extension: sign in with email and password | Profile shows the reader; install card visible; no "install the extension" blocker |
| 2 | No extension: two-step registration | Code step, then profile; `sign_up` analytics event (when the analytics build is used) |
| 3 | No extension: Google sign-in round trip | `/web/oauth/session` called; profile shows the reader |
| 4 | Signed-out visit to `profile/`, `password/`, `email/` | Redirect to `login/?next=…`; after sign-in, back to the page |
| 5 | `?next=https://evil.example` | Ignored; profile |
| 6 | Each row of the reconciliation table with the fake bridge | The expected API call and bridge message, once |
| 7 | Different accounts: choose each option | Correct call; extension or website switches |
| 8 | Sign-out with the same account in the extension; with another account | Bridge `clear`; no bridge message |
| 9 | Password and email change with the cookie | Same flows as today, without a token |
| 10 | `decide()` unit cases | Every state pair maps as in the table |
| 11 | Header | "Sign in" signed out, name signed in, no layout shift |
| 12 | RTL, mobile viewport, axe on every account view | Pass |

## Exit criteria

- [x] `make website-typecheck`, `make website-lint`, `make build-website` and `make website-test` pass (Chromium, Firefox, WebKit, mobile).
- [ ] Manual check against a local backend: register on the website with no extension, then load a development extension build (`WXT_WEBSITE_URL` set) and see it signed in after opening the profile.

## Docs and instructions

- `docs/website.md` "Account pages": rewrite for the web session, reconciliation table and the non-blocking install card.
- `apps/website/AGENTS.md`: replace "never persist the session token in website storage" with "the website's session is the API's HttpOnly cookie; JavaScript never stores a token; bearer tokens only pass through the bridge to the extension"; keep `autocomplete` hints and `noindex`.
- `apps/website/design-system/data-inventory.md`: the website now has a first-party API cookie (session, 30 days); the privacy text changes in phase 11.

## Risks

| Risk | Mitigation |
| --- | --- |
| Reconciliation loops between two tabs | One automatic action per state pair; the extension pushes changes and the decision is idempotent |
| A reader is surprised that the extension switched accounts | Only signed-out or guest extensions switch automatically; another member is always asked |
| Cookie blocked by browser settings | `getWebMe` stays signed out; forms show an error explaining that cookies for the Story Lens API are needed |

## Implementation notes

- The session store lives in `AccountApp` state (`WebState`/`BridgeState` types in `src/lib/account/reconcile.ts`) rather than a separate `web-session.ts` module.
- After an explicit sign-out with another account in the extension, a `sessionStorage` flag (no token) stops automatic adoption until the reader signs in again; otherwise the website would sign itself straight back in as the extension's account.
- The header link (`HeaderAccount.tsx`) caches only the display name in `sessionStorage` for 5 minutes; account pages update it through a window event.
- Sign-out marks the website signed out before clearing the extension, so the hand-off rule cannot re-sign the extension during sign-out.

## Verification log

| Date | Check | Result | Evidence |
| --- | --- | --- | --- |
| 2026-10-02 | `bun run typecheck`, `biome check`, `bun run build` | Pass | |
| 2026-10-02 | `bun run test` (Chromium, Firefox, WebKit, mobile) | Pass after making two header assertions use the accessible name (phones show the icon only) | 248 passed in the full run before that fix; the fixed tests then passed on every project |
| 2026-10-02 | `tests/account.spec.ts` on Chromium, `--repeat-each=3` | Pass (120) | flakiness check |
