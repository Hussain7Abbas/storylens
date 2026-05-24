# Story Lens

Meta-repository for the Story Lens project. Application code lives in Git submodules:

- [storylens-backend](https://github.com/Hussain7Abbas/storylens-backend) — Elysia.js API, Prisma, storage, AI
- [storylens-extension](https://github.com/Hussain7Abbas/storylens-extension) — WXT browser extension

## Quick start

```bash
# First clone (includes submodules)
git clone --recurse-submodules git@github.com-personal:Hussain7Abbas/storylens.git
cd storylens

# Or, if already cloned without submodules
make init

# Install dependencies and set up the backend database
make install
make setup

# Run services
make dev-backend      # API on http://localhost:3000
make dev-extension    # Chrome extension dev server
```

## Commands

Run `make help` for the full list. Common targets:

| Command | Description |
|---------|-------------|
| `make init` | Initialize/update submodules |
| `make update` | Pull latest submodule commits |
| `make install` | `bun install` in both submodules |
| `make setup` | Docker Postgres + migrations + seed |
| `make dev-backend` | Start API in watch mode |
| `make dev-extension` | Start extension dev server |
| `make typecheck` | Typecheck both submodules |
| `make orval` | Regenerate extension API client |

Pass-through targets are also available, e.g. `make backend-test`, `make extension-build`.
