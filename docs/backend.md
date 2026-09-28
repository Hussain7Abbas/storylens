# Backend API

[Documentation index](intro.md) · [Development](development.md)

`apps/backend` is a Bun and Elysia service backed by PostgreSQL through Prisma. `src/main.ts` starts the app defined in `src/server.ts`, which mounts plugins and resource routes. `src/setup.ts` supplies the Prisma client, current authenticated user, and an English/Arabic translation helper to route context.

## Main areas

- `src/routes/` handles accounts, novels, chapters, keywords and their aliases/versions, replacements, categories and natures (each with an optional `description` that tells the extension's AI keyword suggestion when to choose it), configuration, website selectors and biases, uploads, and AI operations.
- `src/middleware/authorize.ts` defines authenticated guest, user, and admin guards, plus ownership checks. Routes enforce permissions server side.
- `src/lib/auth/` combines Better Auth with bearer session handling; `src/lib/db/` supplies Prisma, `src/lib/storage/` handles image storage, and `src/lib/ai/` supports chapter selector detection.
- `prisma/schema.prisma` defines users, sessions, novels, chapters, keywords, aliases, versions, replacements, selectors, and related records. `prisma/migrations/` tracks schema changes; `prisma/seed/` populates development data.

The server centralizes expected HTTP errors with `HttpError` and `AuthError`. Routes validate inputs with Elysia schemas and use Prisma for persistence. The development OpenAPI UI is at `/docs`, with `/openapi.json` feeding the extension's Orval client. The OpenAPI plugin returns 404 in production mode.

Environment variables are validated in `src/env.ts`. Copy `.env.example` and supply a database URL, Better Auth secret, and storage key. `BETTER_AUTH_URL` must be the API's public origin and `WEBSITE_URL` the website origin (default `https://storylens.iscoded.com`); `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` enable Google sign-in; seed and AI features need their respective values. `PORT` defaults to 3000. The local Docker database is defined by `docker-compose.yml`.

## Health checks

`GET /health` is a public liveness check that returns `{ status: "ok", timestamp }`. `GET /health/ready` is a public readiness check. It reports `backend` (with uptime), `database`, and `chromeStore`, each with a `status` and `latencyMs`, plus `versions.review` (the pending `Review_Version`, or `null`) and `versions.store` (the published Chrome Web Store version). Each check times out after 5 seconds.

The overall status is `down` with HTTP 503 when the database check fails. It is `degraded` with HTTP 200 when the store check fails or `CHROME_EXTENSION_ID` is unset, and `ok` otherwise. Failure details are logged on the server, not returned. Logic lives in `src/lib/health.ts` and the routes in `src/routes/health.ts`.

## Deployment and review version

Production runs under PM2 and deploys with `make sync`, which stops the API, pulls, generates the Prisma client, applies migrations, builds, and restarts. `make pm2-start`, `pm2-stop`, `pm2-restart`, and `pm2-delete` manage the process.

Backend deploys wait for the matching extension release. After a store submission, the extension's publish workflow dispatches `extension-submitted` to the backend repository. The backend's `set-review-version.yml` workflow then runs `make set-review-version VERSION=x.y.z` on the server over SSH, which upserts the `Review_Version` config through `src/scripts/set_review_version.ts`. That job uses the backend repository's `production` environment secrets `DEPLOY_SSH_HOST`, `DEPLOY_SSH_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_SSH_PASSPHRASE` (the key's passphrase), optional `DEPLOY_SSH_PORT` (default 22), and `BACKEND_PATH`. In production, the `review-version-watcher` cron (every 10 minutes) compares that value with the version the public Chrome update endpoint reports for `CHROME_EXTENSION_ID`. When they match, it deletes the config and starts `make sync` outside the PM2 process tree, logging to `sync.log`. Without `CHROME_EXTENSION_ID`, the cron logs a warning and leaves the config in place.

For local API and database commands, see [Development](development.md) and the [backend instructions](../apps/backend/AGENTS.md). The [backend README](../apps/backend/README.md) has standalone setup details.

`POST /auth/login` and `POST /auth/register` are public: they sit before the `shouldBeGuest()` guard in `src/routes/accounts.ts` because the website's account pages call them with no session after sign-out. Register still upgrades the guest in place when a guest bearer token is sent. The CORS plugin reflects requested headers (`allowedHeaders: true`), since a literal `*` never covers `Authorization` for the website's cross-origin calls.

## Google sign-in (OAuth)

Better Auth (`src/lib/auth/index.ts`) serves only OAuth. Its handler is mounted at `basePath: '/auth'` through the `/auth/*` catch-all in `src/routes/accounts.ts`. That route sits before the `shouldBeGuest()` guard because OAuth starts signed out; Elysia still matches the static custom routes first. Better Auth's email/password, `update-user`, email, password, delete, and account-linking endpoints are listed in `disabledPaths`, and `username`, `role`, and `password` are `input: false`, so request bodies can never set them. Custom routes remain the only credential and profile path.

Google turns on when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set; `GET /auth/providers` reports `{ google }` so the website shows the button without a rebuild. Register `{BETTER_AUTH_URL}/auth/callback/google` (production: `https://storylens-api.iscoded.com/auth/callback/google`) as the authorized redirect URI in Google Cloud, and add `https://storylens.iscoded.com` as an authorized JavaScript origin. `trustedOrigins` contains `WEBSITE_URL`, so callbacks can only return to the website.

The flow: the website calls `POST /auth/sign-in/social`; Google returns to the API callback, which creates or finds the user and sets a Better Auth session cookie on the API domain. It then redirects to the website's `/profile/oauth/` page, which calls `POST /auth/oauth/session` with that cookie. That route issues a bearer session for the extension and signs the cookie session out. If the page also sends a guest token from the same browser, `mergeGuestInto()` moves the guest's novels, keywords, aliases, versions, replacements, and files to the account and deletes the guest; registered users are never merged. The user-create hook gives OAuth sign-ups the `user` role, a username derived from the display name (not the email), and a random bcrypt password so the credential routes stay consistent. `User.image` stores the provider picture URL. Google accounts whose verified email matches an existing account link to it, per Better Auth's defaults.

Password and email changes are two-step, like registration, and reject guests. `POST /auth/change-password` accepts `currentPassword` and `newPassword`, verifies the current credential, validates the new password at 8–72 characters, and emails a six-digit code to the account address; `POST /auth/change-password/verify` accepts `{ code }` and atomically updates both the user password and credential account hash. `POST /auth/change-email` accepts a new `email`, rejects the current or another account's address, and emails the code to the new address; `POST /auth/change-email/verify` rechecks availability, updates `User.email` (marked verified) and the credential account ID in one transaction, returns the updated user, and sends a notice to the previous address. `src/lib/auth/account-change.ts` stores each pending change in the `verification` table (`change-password:<userId>` or `change-email:<userId>`) with an HMAC of the code and the same 10-minute expiry, 60-second resend cooldown, and five-attempt limit as registration; a code for one kind cannot confirm the other. Existing sessions remain valid. Backend tests cover these flows, guards, and validation, plus session-less sign-in and registration, the OAuth exchange, guest merging, route precedence, and OAuth usernames, with isolated database mocks.
