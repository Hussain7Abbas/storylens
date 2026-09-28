# Backend API

[Documentation index](intro.md) · [Development](development.md)

`apps/backend` is a Bun and Elysia service backed by PostgreSQL through Prisma. `src/main.ts` syncs permissions from the routes (see below) and starts the app defined in `src/server.ts`, which mounts plugins, `/health`, Better Auth at `/auth/*`, the reader API at `/api/user` (`src/routes/user.ts`) and the dashboard API at `/api/admin` (`src/routes/admin/`). `src/setup.ts` supplies the Prisma client, current authenticated user, and an English/Arabic translation helper to route context.

## Main areas

- `src/routes/` handles reader accounts (`accounts.ts`), novels, chapters, keywords and their aliases/versions, replacements, categories and natures (each with an optional `description` that tells the extension's AI keyword suggestion when to choose it), website selectors and biases, uploads, and AI operations. `src/routes/admin/` holds the dashboard API: sign-in, overview stats, users, roles, permissions, novels, configs and image upload.
- `src/middleware/authorize.ts` defines `authorize(portal)`, which checks the session's portal and route permission, plus `canModerate` and ownership checks. `src/lib/permissions/` holds the permission catalog and route sync.
- `src/lib/auth/` combines Better Auth with bearer session handling; `src/lib/db/` supplies Prisma, `src/lib/storage/` handles image storage, and `src/lib/ai/` supports chapter selector detection.
- `prisma/schema.prisma` defines users (with `portal`, `isGuest` and `roleId`), roles, permissions, sessions, novels, chapters, keywords, aliases, versions, replacements, selectors, and related records. `prisma/migrations/` tracks schema changes; `prisma/seed/` populates development data.

The server centralizes expected HTTP errors with `HttpError` and `AuthError`. Routes validate inputs with Elysia schemas and use Prisma for persistence. The development OpenAPI UI is at `/docs`, with `/openapi.json` feeding the extension's and dashboard's Orval clients (the extension excludes `Admin: …` tags; the dashboard generates only them). The OpenAPI plugin returns 404 in production mode.

Environment variables are validated in `src/env.ts`. Copy `.env.example` and supply a database URL, Better Auth secret, and storage key. `BETTER_AUTH_URL` must be the API's public origin and `WEBSITE_URL` the website origin (default `https://storylens.iscoded.com`); `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` enable Google sign-in; the seed needs `DASHBOARD_ADMIN_EMAIL`, `DASHBOARD_ADMIN_USERNAME` and `DASHBOARD_ADMIN_PASSWORD`; AI features need their values. `PORT` defaults to 3000. The local Docker database is defined by `docker-compose.yml`.

## Health checks

`GET /health` is a public liveness check that returns `{ status: "ok", timestamp }`. `GET /health/ready` is a public readiness check. It reports `backend` (with uptime), `database`, and `chromeStore`, each with a `status` and `latencyMs`, plus `versions.review` (the pending `Review_Version`, or `null`) and `versions.store` (the published Chrome Web Store version). Each check times out after 5 seconds.

The overall status is `down` with HTTP 503 when the database check fails. It is `degraded` with HTTP 200 when the store check fails or `CHROME_EXTENSION_ID` is unset, and `ok` otherwise. Failure details are logged on the server, not returned. Logic lives in `src/lib/health.ts` and the routes in `src/routes/health.ts`.

## Deployment and review version

Production runs under PM2 and deploys with `make sync`, which stops the API, pulls, generates the Prisma client, applies migrations, builds, and restarts. `make pm2-start`, `pm2-stop`, `pm2-restart`, and `pm2-delete` manage the process.

Backend deploys wait for the matching extension release. After a store submission, the extension's publish workflow dispatches `extension-submitted` to the backend repository. The backend's `set-review-version.yml` workflow then runs `make set-review-version VERSION=x.y.z` on the server over SSH, which upserts the `Review_Version` config through `src/scripts/set_review_version.ts`. That job uses the backend repository's `production` environment secrets `DEPLOY_SSH_HOST`, `DEPLOY_SSH_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_SSH_PASSPHRASE` (the key's passphrase), optional `DEPLOY_SSH_PORT` (default 22), and `BACKEND_PATH`. In production, the `review-version-watcher` cron (every 10 minutes) compares that value with the version the public Chrome update endpoint reports for `CHROME_EXTENSION_ID`. When they match, it deletes the config and starts `make sync` outside the PM2 process tree, logging to `sync.log`. Without `CHROME_EXTENSION_ID`, the cron logs a warning and leaves the config in place.

For local API and database commands, see [Development](development.md) and the [backend instructions](../apps/backend/AGENTS.md). The [backend README](../apps/backend/README.md) has standalone setup details.

## Portals, roles and permissions

Every user has a **portal**: `admin` accounts use the [dashboard](dashboard.md) through `/api/admin`; `user` accounts (readers) use the extension, website account pages and desktop client through `/api/user`. A session only works on its own portal: `authorize(portal)` answers 403 for the other one, and each login route rejects the other portal's accounts. `isGuest` marks anonymous extension installs; verified registration or Google sign-in clears it.

Each user has one **role**, and a role holds **permissions**. A permission's key is the route's method and template, e.g. `GET /api/user/novels/:id`, so every endpoint has its own permission. `syncPermissions()` runs at startup: it creates a row for every non-public `/api/{portal}` route (descriptions come from the route's `detail.summary` for dashboard routes and `USER_ENDPOINT_DESCRIPTIONS` for reader routes), deletes rows for removed routes, and gives new permissions to the system roles by default. Dashboard edits to existing grants are kept. `user:moderate` is a capability, not an endpoint: it lets reader-portal routes edit other readers' content, set version chapter ranges, rename novels and replace a filled novel context (`canModerate`).

System roles are created by migration `20260928201239_add_portals_roles_permissions`, which also mapped the old enum (guest → Guest, user → Reader, admin → Moderator, all on the reader portal):

| Role | Portal | Default permissions |
| --- | --- | --- |
| Super Admin (`super-admin`) | admin | Every dashboard permission, re-granted on each startup; read-only in the dashboard |
| Guest (`guest`) | user | Reader-API reads plus profile, sign-out and AI selector detection |
| Reader (`reader`) | user | Guest permissions plus writes to own keywords, aliases, versions and replacements, novel creation, uploads and credential changes |
| Moderator (`moderator`) | user | Every reader permission plus `user:moderate` and catalogue management (categories, natures, chapters, selectors, biases, novel deletion) |

Public endpoints (`PUBLIC_ENDPOINTS` in `src/lib/permissions/catalog.ts`): reader guest creation, registration and verification, login, providers and OAuth session exchange, and dashboard login. Dashboard accounts are never self-registered: `POST /api/admin/users` creates them, and the seed (or `make seed-dashboard-admin`) creates or resets the one super admin. The dashboard API refuses to change the caller's own portal or role, delete the caller, or remove the last super admin; roles in use or marked system can't be deleted.

Reader login, registration and the OAuth exchange live under `/api/user/auth` and are public because the website's account pages call them with no session after sign-out. Register still upgrades the guest in place when a guest bearer token is sent. The CORS plugin reflects requested headers (`allowedHeaders: true`), since a literal `*` never covers `Authorization` for the website's cross-origin calls.

## Google sign-in (OAuth)

Better Auth (`src/lib/auth/index.ts`) serves only OAuth. Its handler stays at `basePath: '/auth'` through the `/auth/*` catch-all in `src/routes/better-auth.ts`, outside `/api`, so the Google redirect URI is unchanged. It is unguarded because OAuth starts signed out. Better Auth's email/password, `update-user`, email, password, delete, and account-linking endpoints are listed in `disabledPaths`, and `username`, `portal`, `isGuest`, `roleId`, and `password` are `input: false`, so request bodies can never set them. Custom routes remain the only credential and profile path.

Google turns on when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set; `GET /api/user/auth/providers` reports `{ google }` so the website shows the button without a rebuild. Register `{BETTER_AUTH_URL}/auth/callback/google` (production: `https://storylens-api.iscoded.com/auth/callback/google`) as the authorized redirect URI in Google Cloud, and add `https://storylens.iscoded.com` as an authorized JavaScript origin. `trustedOrigins` contains `WEBSITE_URL`, so callbacks can only return to the website.

The flow: the website calls `POST /auth/sign-in/social`; Google returns to the API callback, which creates or finds the user and sets a Better Auth session cookie on the API domain. It then redirects to the website's `/profile/oauth/` page, which calls `POST /api/user/auth/oauth/session` with that cookie. Dashboard accounts are refused there. That route issues a bearer session for the extension and signs the cookie session out. If the page also sends a guest token from the same browser, `mergeGuestInto()` moves the guest's novels, keywords, aliases, versions, replacements, and files to the account and deletes the guest; registered users are never merged. The user-create hook gives OAuth sign-ups the reader portal and `reader` role, a username derived from the display name (not the email), and a random bcrypt password so the credential routes stay consistent. `User.image` stores the provider picture URL. Google accounts whose verified email matches an existing account link to it, per Better Auth's defaults.

Reader password and email changes (`POST /api/user/auth/change-password`, `/change-email` and their `/verify` routes) reject guests and apply only after an emailed code matches; both credential stores update atomically. Dashboard users change their password with `PUT /api/admin/auth/password`, which checks the current password (no email flow) and signs out their other sessions. Backend tests cover these guards and validation, plus session-less sign-in and registration, the OAuth exchange, guest merging, route precedence, and OAuth usernames, with isolated database mocks. `test/permissions.test.ts` checks against the real routes that every endpoint sits under a portal, has a permission and description (or is public), keeps the old default access, and returns 401 without a session; `test/authorize.test.ts` covers the portal and permission guard.
