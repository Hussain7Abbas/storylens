# Story Lens repository instructions

Story Lens is a browser extension for reading web novels with keyword highlighting, text replacement, chapter detection, and local AI summaries, supported by an Elysia API and desktop companion. This repository coordinates three independent Git submodules; it has no root `package.json` or shared workspace packages. Start with [the documentation index](docs/intro.md) for design and workflow details.

## Repository map

- `apps/backend/`: API, auth, Prisma schema and migrations, seeds, storage, and AI features. Follow [backend instructions](apps/backend/AGENTS.md).
- `apps/extension/`: WXT extension, popup and content scripts, generated API client, localization, and offline storage. Follow [extension instructions](apps/extension/AGENTS.md).
- `apps/client/`: Electron desktop companion, local prompt service, provider adapters, and packaging. Follow [client instructions](apps/client/AGENTS.md).
- `Makefile`: delegates setup, development, build, and quality targets to the submodules.
- `.cursor/rules/`: Cursor guidance; `AGENTS.md` files are the source of truth for agent rules.

## Shared rules and workflow

- Use Bun for dependency management and package scripts. Install in each app (`make install` delegates all three); do not assume a root Bun workspace.
- Use TypeScript types instead of `any`. Do not add `eslint-disable` comments. Prefer named exports except where a framework entry point requires a default export.
- Follow the formatter and TypeScript configuration of the submodule being edited. The extension has Biome configuration; there is no root Biome configuration.
- Keep code in the relevant submodule. Follow local imports and naming patterns, validate inputs at API boundaries, and use the backend's error and permission helpers for routes. Test behavior at the affected scope.
- After every task, run `bun run typecheck` in all three submodules and fix errors. Run backend tests for backend behavior changes.
- Changes in a submodule are committed there first; then commit the updated submodule pointer in this umbrella repository. Keep each app's source in its own submodule.

## Commands from the repository root

```bash
make help                 # full target list
make submodules-init      # initialize all three submodules after cloning
make install              # Bun install in each submodule
make setup                # backend Docker Postgres, migrations, and seed
make dev-backend          # API in watch mode (PORT defaults to 3000)
make dev-extension        # Chrome extension development
make dev-client           # Electron desktop client development
make dev-firefox          # Firefox extension development
make build                # delegate builds to all three submodules
make typecheck            # typecheck all three submodules
make test                 # backend and client tests
make orval                # regenerate extension API client; backend must run
make i18n-parse           # extract extension translation keys
```

The root also provides database, zip, and `backend-<target>` / `extension-<target>` / `client-<target>` pass-through targets. See `make help`, the [development guide](docs/development.md), and each submodule's `Makefile`. `make pull` updates the umbrella and pulls submodules; `make update` advances submodules to remote commits. Use them deliberately because they change checkout state.

## Documentation maintenance

As part of every task, keep project instructions and documentation synchronized with user-requested changes and relevant changes already made by the user. Before finishing, review the affected `AGENTS.md` files and `docs/` pages and update any rules, directory descriptions, code conventions, commands, architecture, interfaces, configuration, or behavior that changed. Add, move, or remove scoped instructions and documentation when project scopes change, and repair their indexes and links. Update affected documentation in the same task as the code changes; do not leave known stale guidance. Preserve unrelated user edits and document the current intended state without reverting code to match old documentation. If a change has no documentation or instruction impact, leave those files unchanged. Keep every `CLAUDE.md` as only `@AGENTS.md`, with the actual rules in its sibling `AGENTS.md`.
