# Development and submodules

[Documentation index](intro.md)

The umbrella repository has no application dependencies of its own. `apps/backend` and `apps/extension` are separate Git repositories, each with a `package.json`, lockfile, and `Makefile`. The root `Makefile` delegates commands. See [backend](backend.md) and [extension](extension.md) for each project's design.

## Local setup

1. Initialize the submodules with `make submodules-init` after a clone that omitted them.
2. Run `make install` to install both submodules with Bun.
3. Copy `apps/backend/.env.example` and `apps/extension/.env.example` to `.env` files in their respective submodules, then fill in credentials and connection values.
4. Run `make setup` for Docker Postgres, Prisma generation, migration deployment, and seed data. This needs Docker and a valid backend environment.
5. Start `make dev-backend` and `make dev-extension` in separate terminals. `make dev-firefox` starts the Firefox build instead.

The backend's `PORT` defaults to 3000. The extension's checked-in development `WXT_API_URL` example and WXT fallback use port 7001, so configure one side to match the other before testing API calls or running `make orval`. Better Auth's base URL should also match the backend's listening address.

## Commands

`make help` is the complete root target list. Common targets are `make build`, `make typecheck`, `make test` (backend tests), `make orval` (extension client from the running backend's OpenAPI spec), `make i18n-parse`, and `make zip` / `make zip-firefox`. Database targets such as `make db-migrate-dev` and `make db-seed` delegate to the backend. Run `make backend-<target>` or `make extension-<target>` to pass a target to a submodule Makefile.

The backend's current `build` script runs Prisma generation, and its `start` script runs `src/main.ts`. It does not produce the `dist/index.js` bundle mentioned in some older guidance. Consult the submodule scripts before changing deployment behavior.

## Git workflow

Make source changes inside the relevant submodule, commit and push there when ready, then commit the changed submodule pointer in the umbrella repository. Changes to root instructions or docs can be committed in the umbrella independently. `make pull` updates the umbrella and pulls each submodule; `make update` advances the submodule checkout to remote commits. Review local work before invoking either command.
