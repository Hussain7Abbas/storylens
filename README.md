<p align="center">
  <img src="https://i.ibb.co/FkBkMNJ9/icon.png" alt="Story Lens logo" width="96" />
</p>

<h1 align="center">Story Lens</h1>

<p align="center">
  A browser extension and API for reading web novels with keyword highlighting, text replacements, and AI-assisted chapter detection.
</p>

---

This is the umbrella repository for Story Lens. Application source lives in two Git submodules — a backend API and a browser extension. The root `Makefile` exposes a unified set of commands that delegate to each submodule.

## Repositories

| Path             | Repository                                                                  | Description                                          |
| ---------------- | --------------------------------------------------------------------------- | ---------------------------------------------------- |
| `apps/backend`   | [storylens-backend](https://github.com/Hussain7Abbas/storylens-backend)     | Elysia.js API, PostgreSQL (Prisma), file storage, AI |
| `apps/extension` | [storylens-extension](https://github.com/Hussain7Abbas/storylens-extension) | WXT + React browser extension                        |

## Prerequisites

- [Bun](https://bun.sh/) 1.2+
- [Docker](https://www.docker.com/) (for local Postgres)
- [Make](https://www.gnu.org/software/make/)
- Git with SSH access to GitHub

## Getting Started

### Clone

```bash
git clone --recurse-submodules git@github.com-personal:Hussain7Abbas/storylens.git
cd storylens
```

Already cloned without submodules?

```bash
make submodules-init
```

### Quick Start

```bash
# 1. Install dependencies in both submodules
make install

# 2. Configure environment files
cp apps/backend/.env.example apps/backend/.env
cp apps/extension/.env.example apps/extension/.env

# 3. Start Postgres, run migrations, and seed the database
make setup

# 4. Start the API and extension (open two terminals)
make dev-backend
make dev-extension
```

The API runs at `http://localhost:3000`. OpenAPI docs are available while the backend is running.

## Makefile Reference

Run `make help` to see all available targets. All commands delegate to the Makefiles inside each submodule.

### Submodules

| Command                | Description                                                      |
| ---------------------- | ---------------------------------------------------------------- |
| `make submodules-init` | Initialize submodules after clone                                |
| `make init`            | Alias for `submodules-init`                                      |
| `make pull`            | Pull umbrella repo, sync submodule pointers, pull each submodule |
| `make update`          | Bump submodules to their latest remote commits                   |

### Setup

| Command        | Description                                     |
| -------------- | ----------------------------------------------- |
| `make install` | `bun install` in backend and extension          |
| `make setup`   | Backend setup: Docker Postgres + migrate + seed |

### Development

| Command              | Description                        |
| -------------------- | ---------------------------------- |
| `make dev-backend`   | Start API in watch mode            |
| `make dev-extension` | Start Chrome extension dev server  |
| `make dev-firefox`   | Start Firefox extension dev server |

### Build

| Command                | Description                      |
| ---------------------- | -------------------------------- |
| `make build`           | Build backend and extension      |
| `make build-backend`   | Production backend build         |
| `make build-extension` | Chrome extension build           |
| `make build-firefox`   | Firefox extension build          |
| `make start-backend`   | Build and run the production API |
| `make zip`             | Build and zip Chrome extension   |
| `make zip-firefox`     | Build and zip Firefox extension  |

### Database & Storage

| Command                  | Description                     |
| ------------------------ | ------------------------------- |
| `make docker-up`         | Start Postgres container        |
| `make docker-down`       | Stop Postgres container         |
| `make db-generate`       | Generate Prisma client          |
| `make db-migrate-dev`    | Create and apply dev migrations |
| `make db-migrate-deploy` | Apply migrations (production)   |
| `make db-seed`           | Seed database                   |
| `make db-studio`         | Open Prisma Studio              |
| `make storage-seed`      | Upload seed assets to storage   |

### Extension Tooling

| Command           | Description                                         |
| ----------------- | --------------------------------------------------- |
| `make orval`      | Regenerate API client from the backend OpenAPI spec |
| `make i18n-parse` | Extract i18n keys from extension source             |

### Quality

| Command          | Description               |
| ---------------- | ------------------------- |
| `make typecheck` | Typecheck both submodules |
| `make test`      | Run backend tests         |

### Pass-Through Targets

Run any submodule Make target directly from the root:

```bash
make backend-dev
make backend-db-studio
make extension-typecheck
make extension-orval
```

## Working with Submodules

Sync the umbrella repo and all submodules to their remotes:

```bash
make pull
```

Bump submodules to the latest remote commit without pulling the umbrella:

```bash
make update
```

To make changes inside a submodule, commit there, then update the pointer in this repo:

```bash
cd apps/backend
git add . && git commit -m "your message"
git push

cd ../..
git add apps/backend
git commit -m "chore: bump backend submodule"
```

## Project Layout

```
storylens/
├── Makefile           # delegates to submodule Makefiles
├── README.md
├── apps/
│   ├── backend/       # git submodule — Elysia.js API
│   └── extension/     # git submodule — WXT + React extension
└── .gitmodules
```

## License

Source available under the [PolyForm Noncommercial License 1.0.0](LICENSE.md).

You may use, modify, and share this project for **non-commercial purposes** only. Commercial use requires separate permission from the author.

## Further Reading

- [Backend README](apps/backend/README.md)
- [Extension README](apps/extension/README.md)
