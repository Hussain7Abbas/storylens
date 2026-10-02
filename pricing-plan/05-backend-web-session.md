# Phase 5 — Backend: website session and extension handoff

[Global tracker](main.md) · **Status: Done (not committed)** · **Estimate: 4 points** · **Depends on: D13, D14** · **Ships in: 3.4.0**

## Goal

Today the website's account pages work only through the extension: they store the session in the extension and show "install the extension" without it. This phase gives the website its own session, so readers can sign in and register before installing anything, and lets the website hand that session to an extension installed later ([flow E](architecture.md#e-website-session-and-extension-handoff)).

- The web session is an HttpOnly cookie on the API host. Page JavaScript never sees it (D13).
- `setup.ts` accepts it only from the website's origin, with a CSRF header on writes.
- New routes sign in, register, finish Google sign-in and sign out with the cookie; mint a bearer session for the extension from it (merging a guest); and adopt the extension's session into the website.

Existing routes and their contracts do not change. Older website builds keep working until the website deploys.

## Tasks

### 5.1 Schema

- [x] Own migration `session_kind`: enum `SessionKind { bearer web }` and `Session.kind SessionKind @default(bearer)`. Existing rows (extension, desktop, dashboard, and Better Auth's OAuth sessions) become `bearer`.
- [x] `getSessionFromBearerToken` (`src/lib/auth/session.ts`) accepts only `kind = bearer`. Add `getSessionFromWebToken` for `kind = web`. `createSessionToken` takes the kind (default `bearer`).

### 5.2 Cookie and origin helpers (`src/lib/auth/web-session.ts`)

- [x] Cookie: `__Host-sl_web` with `Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=2592000` (the session TTL). When `WEB_SESSION_INSECURE_COOKIE=true` (allowed only outside production; `src/env.ts` refuses it in production), use `sl_web` without `Secure` for local HTTP development.
- [x] `isWebOrigin(origin)`: the origin of `WEBSITE_URL`, plus `WEBSITE_DEV_ORIGINS` (comma-separated, ignored in production).
- [x] `isWebRequest(request)`: `isWebOrigin(Origin)` and, for methods other than GET and HEAD, `X-Storylens-Web: 1`.
- [x] `setWebSessionCookie(set, token)` and `clearWebSessionCookie(set)`. Several `Set-Cookie` headers must survive together (the OAuth route also forwards Better Auth's sign-out cookies), so append, as `/oauth/session` already does with `getSetCookie()`.

### 5.3 Resolving the current user (`src/setup.ts`)

- [x] Bearer first, unchanged. With no bearer token, read the web cookie, but only when `isWebRequest` holds; then `currentUser = toAuthUser(session.user, 'user')`. Requests from other origins carrying the cookie are treated as signed out (invariant 7).
- [x] Expose `sessionKind` (`'bearer' | 'web' | null`) in the context for the web routes below.
- [x] `authorize('user')` needs no change: permissions apply to web sessions exactly as to bearer sessions.

### 5.4 Shared auth helpers (refactor before adding routes)

- [x] `src/lib/auth/reader-auth.ts` (implemented as one module): `verifyLogin(prisma, email, password, translate)` with the checks of `POST /auth/login` (credential match, `assertReaderPortal`); `/login` and `/web/login` both use it.
- [x] `completeRegistration(prisma, { email, code, currentUser, translate })` in the same module: the body of `/register/verify`, including the in-place guest upgrade and the trial gift; `/register/verify` and `/web/register/verify` both use it.
- [x] OAuth exchange: `/oauth/session` and `/web/oauth/session` share the Better Auth session read and sign-out; the guest merge (`mergeGuestInto`, `src/lib/auth/oauth.ts`) now moves any lens balance in its transaction.
- [x] Behavior of the existing routes is unchanged (their tests in `test/public-auth.test.ts`, `test/oauth.test.ts` and `test/password.test.ts` must keep passing).

### 5.5 Web routes (`src/routes/web-session.ts`, prefix `/auth/web`, mounted in `userApi`)

All of them answer 403 `WEB_ORIGIN_REQUIRED` unless `isWebRequest` holds.

- [x] `POST /login` (public) `{ email, password }` → web session, cookie, `{ user }`.
- [x] `POST /register/verify` (public) `{ email, code }`. An `Authorization` header with the extension's guest token upgrades that guest in place, as `/register/verify` does today (the website sends it when the extension holds a guest, which also keeps the guest's username available). → web session, cookie, `{ user, gift }`.
- [x] `POST /oauth/session` (public) → web session from the Better Auth cookie, `{ user }`. No guest merge here: the website merges through `/extension-session`.
- [x] `POST /logout` → deletes the web session and clears the cookie. Add it to `GUEST_WRITES`, so it never fails on permissions.
- [x] `POST /extension-session` (web session required, `sessionKind === 'web'`) `{ guestToken?: string (≤200) }`. When the token belongs to a guest other than the current user, `mergeGuestInto(guest, user)` (phase 2 made it lens-safe). Creates a **bearer** session → `{ user, token }`.
- [x] `POST /adopt` (bearer session required, `sessionKind === 'bearer'`, not a guest → 403 `REGISTERED_ACCOUNT_REQUIRED`) → creates a web session for that user, cookie, `{ user }`.
- [x] `PUBLIC_ENDPOINTS`: the first three. `USER_ENDPOINT_DESCRIPTIONS` for all six.
- [x] Existing cookie-capable routes keep working with the web cookie through `setup.ts`: `GET /auth/me`, `PUT /auth/me`, the password and email change routes, and the billing routes.

### 5.6 Sessions elsewhere

- [x] `DELETE /api/admin/users/:id/sessions` ("sign out everywhere") deletes web sessions too (it deletes all of the user's sessions; confirm with a test).
- [x] A verified password change signs out the user's other web sessions, keeping the current one; extension and desktop (bearer) sessions stay as before (decided in implementation; `test/web-session.test.ts`).
- [x] CORS (`src/plugins/cors.ts`): `allowedHeaders: true` already reflects `X-Storylens-Web`; `credentials: true` stays. No origin allow-list is needed for bearer requests, because the cookie is ignored from other origins.

### 5.7 Environment

- [x] `src/env.ts` and `.env.example`: `WEBSITE_DEV_ORIGINS` (optional), `WEB_SESSION_INSECURE_COOKIE` (optional, refused in production).

## Tests (`test/web-session.test.ts`)

| # | Test | Expected |
| --- | --- | --- |
| 1 | `POST /auth/web/login` from the website origin with the header | 200 `{ user }`; `Set-Cookie` has `__Host-sl_web`, `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, no `Domain` |
| 2 | Same request from another origin, or without `X-Storylens-Web` | 403 `WEB_ORIGIN_REQUIRED` |
| 3 | `GET /auth/me` with the cookie from the website origin; from another origin | 200; 401 |
| 4 | `PUT /auth/me` with the cookie but no CSRF header | 401 or 403 (treated as signed out) |
| 5 | The web token sent as `Authorization: Bearer` | 401 |
| 6 | A bearer token sent as the cookie | Signed out |
| 7 | `POST /web/register/verify` without and with a guest bearer | New account; guest upgraded in place; both get the trial gift once and the cookie |
| 8 | `POST /web/oauth/session` after a stubbed Google callback | Web cookie set; Better Auth cookie cleared |
| 9 | `POST /web/extension-session` with no guest, with a guest, with the user's own former guest token | Bearer token returned; guest merged and deleted; no merge |
| 10 | `POST /web/adopt` with a member bearer; with a guest bearer | Cookie set; 403 `REGISTERED_ACCOUNT_REQUIRED` |
| 11 | `POST /web/logout` | Session row deleted; cookie cleared |
| 12 | Admin "sign out everywhere" | Web and bearer sessions gone |
| 13 | Existing `/auth/login`, `/auth/register/verify`, `/auth/oauth/session` | Unchanged responses (existing tests pass) |
| 14 | `WEB_SESSION_INSECURE_COOKIE=true` with `NODE_ENV=production` | Env validation fails at startup |
| 15 | `test/permissions.test.ts` | Passes; three new public endpoints |

## Exit criteria

- [x] Backend tests and typecheck in all five submodules pass; `make orval` regenerated (the website uses hand-written calls, but the extension's generated client should stay current).

## Docs and instructions

- `docs/backend.md`: "Website sessions" section under the auth sections (cookie, origin and CSRF rules, the six routes, handoff and adopt).
- `apps/backend/AGENTS.md`: web sessions are cookie-only and bearer sessions header-only; web routes check the website origin and CSRF header; never accept the web cookie from other origins; never return the web token in a body.
- `apps/backend/.env.example`: the two variables.

## Risks

| Risk | Mitigation |
| --- | --- |
| CSRF from another `*.iscoded.com` subdomain (same site) | Origin allow-list plus the custom header; `SameSite=Strict` blocks cross-site requests |
| XSS on the website mints extension tokens | Same exposure as today (the website already receives bearer tokens to pass to the extension); the website's hashed CSP stays |
| Merging a different person's guest on a shared computer | Same behavior as today's Google sign-in; the website asks before replacing another *member* (phase 6) |
| `__Host-` cookies rejected in local HTTP development | Development flag with an unprefixed name, refused in production |

## Implementation notes

- Login and registration are shared through `src/lib/auth/reader-auth.ts`; the OAuth exchange shares the Better Auth read in `src/routes/web-session.ts`.
- A verified password change ends the account's other web sessions and keeps the current one; bearer sessions (extension, desktop) stay.

## Verification log

| Date | Check | Result | Evidence |
| --- | --- | --- | --- |
| 2026-10-02 | `test/web-session.test.ts` with the live test database | Pass (12 tests) | includes the password-change sign-out test |
