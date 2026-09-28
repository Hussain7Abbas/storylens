# Development and submodules

[Documentation index](intro.md)

The umbrella repository has no application dependencies of its own. `apps/backend`, `apps/extension`, `apps/client`, `apps/website`, and `apps/dashboard` are separate Git submodules, each with a `package.json`, lockfile, and `Makefile`. The root `Makefile` delegates their commands. See [backend](backend.md), [extension](extension.md), [client](client.md), [website](website.md), and [dashboard](dashboard.md) for each project's design.

## Local setup

1. Initialize the submodules with `make submodules-init` after a clone that omitted them.
2. Run `make install` to install all five submodules with Bun.
3. Copy `apps/backend/.env.example` and `apps/extension/.env.example` to `.env` files in their respective submodules, then fill in credentials and connection values.
4. Run `make setup` for Docker Postgres, Prisma generation, migration deployment, and seed data. This needs Docker and a valid backend environment.
5. Start `make dev-backend` and `make dev-extension` in separate terminals. `make dev-firefox` starts the Firefox build instead.
6. For AI summaries, install/sign in to Claude Code and/or Codex CLI, run `make dev-client`, and pair the extension with the token in its window. The summary feature does not need the backend.

The backend's `PORT` defaults to 3000. The extension's checked-in development `WXT_API_URL` example and WXT fallback use port 7001, so configure one side to match the other before testing API calls or running `make orval`. Better Auth's base URL should also match the backend's listening address. To use the website's account pages locally, set the extension's `WXT_WEBSITE_URL` to the website's origin (development builds default to `http://localhost:3000`) and the website's `NEXT_PUBLIC_API_URL` to the backend. Note that `next dev` also defaults to port 3000.

## Commands

`make help` lists the root targets. `make install`, `make build`, and `make typecheck` cover all five apps; `make test` runs backend, client, website, and dashboard tests. `make dev-client` starts the desktop app. `make client-pack`, `make client-dist-mac`, and `make client-dist-win` delegate its packaging commands. Other root targets include `make orval` (extension client from the running backend's OpenAPI spec; `make dashboard-orval` for the dashboard's admin client, with `ORVAL_API_URL` pointing at the backend), `make i18n-parse`, and `make zip` / `make zip-firefox`. Database targets such as `make db-migrate-dev` and `make db-seed` delegate to the backend. Run `make backend-<target>`, `make extension-<target>`, `make client-<target>`, `make website-<target>`, or `make dashboard-<target>` to pass a target to a submodule Makefile.

The backend's current `build` script runs Prisma generation, and its `start` script runs `src/main.ts`. It does not produce the `dist/index.js` bundle mentioned in some older guidance. Production deploys use `make sync` in the backend (or `make backend-sync` from the root); see [Backend](backend.md#deployment-and-review-version). Consult the submodule scripts before changing deployment behavior.

## Git workflow

Make source changes inside the relevant submodule, commit and push there when ready, then commit the changed submodule pointer in the umbrella repository. Changes to root instructions or docs can be committed in the umbrella independently. `make pull` updates the umbrella and pulls each submodule; `make update` advances the submodule checkout to remote commits. Review local work before invoking either command.

## Releases

`make deploy` runs the globally installed `xeploy` CLI (`bun add -g xeploy`) with the settings in `.xeploy.json`. It bumps each app's version, creates `v<version>` tags, and publishes `develop` to `main` in each submodule. The extension's tag starts the Chrome Web Store publish workflow ([Extension](extension.md#chrome-web-store-release)). That workflow signals the backend repository, and the backend deploys once the store publishes the new version ([Backend](backend.md#deployment-and-review-version)). The production server must track `main`. Backend-only releases, where the extension version does not change, need `make backend-sync` on the server. For first-time setup, see the [publishing runbook](publishing.md).

## Website

The fourth submodule is `apps/website`, tracked on `develop`. Run `make dev-website`, `make build-website`, `make website-lint`, `make website-test`, or `make website-lhci`. Root install/build/typecheck/test include it. Production has its own `main` checkout at `/srv/storylens-website` on `ssh raseen`; `make website-deploy` is a server-side command, not a local SSH wrapper. See [Website](website.md).

## Dashboard

The fifth submodule is `apps/dashboard` (`storylens-dashbaord`), tracked on `develop`. Run `make dev-dashboard` (port 3040, API from `VITE_API_URL`), `make build-dashboard`, `make dashboard-lint`, or `make dashboard-test`. Sign in with the super admin the backend seed creates from `DASHBOARD_ADMIN_*`. Production has its own `main` checkout at `/srv/storylens-dashbaord` on `ssh raseen`; see [Dashboard](dashboard.md).
