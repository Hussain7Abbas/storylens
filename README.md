# Story Lens

Umbrella repository for [Story Lens](https://github.com/Hussain7Abbas/storylens) — a browser extension and API for reading and annotating web novels with keyword highlighting, replacements, and AI-assisted chapter detection.

This repo does not contain application source directly. It links the two app repos as Git submodules and exposes a root `Makefile` to run common tasks across them.

## Repositories

| Path | Repository | Description |
|------|------------|-------------|
| `apps/backend` | [storylens-backend](https://github.com/Hussain7Abbas/storylens-backend) | Elysia.js API, PostgreSQL (Prisma), file storage, AI |
| `apps/extension` | [storylens-extension](https://github.com/Hussain7Abbas/storylens-extension) | WXT + React browser extension |

## Prerequisites

- [Bun](https://bun.sh/) 1.2+
- [Docker](https://www.docker.com/) (for local Postgres)
- [Make](https://www.gnu.org/software/make/)
- Git with SSH access to GitHub

## Clone

```bash
git clone --recurse-submodules git@github.com-personal:Hussain7Abbas/storylens.git
cd storylens
```

If you already cloned without submodules:

```bash
make submodules-init
```

## Quick start

```bash
# 1. Install dependencies in both submodules
make install

# 2. Configure backend env (see apps/backend/README.md)
cp apps/backend/.env.example apps/backend/.env

# 3. Configure extension env
cp apps/extension/.env.example apps/extension/.env

# 4. Start Postgres, migrate, and seed the database
make setup

# 5. Run the API and extension (separate terminals)
make dev-backend
make dev-extension
```

The API runs at `http://localhost:3000` by default. OpenAPI docs are available when the backend is running.

## Root Makefile

All commands delegate to the Makefiles inside each submodule. Run `make help` for the full list.

### Submodules

| Command | Description |
|---------|-------------|
| `make submodules-init` | Initialize submodules after clone |
| `make init` | Alias for `submodules-init` |
| `make pull` | Pull umbrella repo, sync submodule pointers, pull each submodule |
| `make update` | Bump submodules to latest remote commits (may diverge from umbrella pins) |

### Setup

| Command | Description |
|---------|-------------|
| `make install` | `bun install` in backend and extension |
| `make setup` | Backend setup: Docker Postgres + migrate + seed |

### Development

| Command | Description |
|---------|-------------|
| `make dev-backend` | Start API in watch mode |
| `make dev-extension` | Start Chrome extension dev server |
| `make dev-firefox` | Start Firefox extension dev server |

### Build

| Command | Description |
|---------|-------------|
| `make build` | Build backend and extension |
| `make build-backend` | Production backend build |
| `make build-extension` | Chrome extension build |
| `make build-firefox` | Firefox extension build |
| `make start-backend` | Build and run production API |
| `make zip` | Build and zip Chrome extension |
| `make zip-firefox` | Build and zip Firefox extension |

### Database & storage

These targets run in `apps/backend`:

| Command | Description |
|---------|-------------|
| `make docker-up` | Start Postgres container |
| `make docker-down` | Stop Postgres container |
| `make db-generate` | Generate Prisma client |
| `make db-migrate-dev` | Create/apply dev migrations |
| `make db-migrate-deploy` | Apply migrations (production) |
| `make db-seed` | Seed database |
| `make db-studio` | Open Prisma Studio |
| `make storage-seed` | Upload seed assets to storage |

### Extension tooling

| Command | Description |
|---------|-------------|
| `make orval` | Regenerate API client from backend OpenAPI spec |
| `make i18n-parse` | Extract i18n keys from extension source |

### Quality

| Command | Description |
|---------|-------------|
| `make typecheck` | Typecheck both submodules |
| `make test` | Run backend tests |

### Pass-through targets

Run any submodule Make target from the root:

```bash
make backend-dev
make backend-db-studio
make extension-typecheck
make extension-orval
```

## Working with submodules

Sync the umbrella repo and all submodules to their remotes:

```bash
make pull
```

Bump submodules to the latest remote commit (without pulling the umbrella):

```bash
make update
```

Make changes inside a submodule, commit there, then bump the pointer in this repo:

```bash
cd apps/backend
git add . && git commit -m "your message"
git push

cd ../..
git add apps/backend
git commit -m "chore: bump backend submodule"
```

## Project layout

```
storylens/
├── Makefile           # delegates to submodule Makefiles
├── README.md
├── apps/
│   ├── backend/       # git submodule
│   └── extension/     # git submodule
└── .gitmodules
```

## License

This project is source available under the [PolyForm Noncommercial License 1.0.0](LICENSE.md).

You may use, modify, and share it for **non-commercial purposes** only. Commercial use requires separate permission from the author.

## Further reading

- [Backend README](apps/backend/README.md)
- [Extension README](apps/extension/README.md)
