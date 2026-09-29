<p align="center">
  <img src="https://i.ibb.co/FkBkMNJ9/icon.png" alt="Story Lens logo" width="96" />
</p>

<h1 align="center">Story Lens</h1>

<p align="center">
  A browser extension, API, and desktop client for reading web novels with keyword highlighting, text replacements, AI-assisted chapter detection, and page summaries.
</p>

---

This is the umbrella repository for Story Lens. The backend API, browser extension, desktop client, website, and admin dashboard are Git submodules. The root `Makefile` delegates commands to each app.

## Repositories

| Path             | Repository                                                                  | Description                                                                 |
| ---------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `apps/backend`   | [storylens-backend](https://github.com/Hussain7Abbas/storylens-backend)     | Elysia.js API, PostgreSQL (Prisma), file storage, AI                        |
| `apps/extension` | [storylens-extension](https://github.com/Hussain7Abbas/storylens-extension) | WXT + React browser extension                                               |
| `apps/client`    | [storylens-client](https://github.com/Hussain7Abbas/storylens-client)       | Electron desktop companion for Claude/Codex prompts                         |
| `apps/website`   | [storylens-website](https://github.com/Hussain7Abbas/storylens-website)     | Static English/Arabic Next.js landing and legal pages                       |
| `apps/dashboard` | [storylens-dashboard](https://github.com/Hussain7Abbas/storylens-dashboard) | Vite + React admin dashboard: users, roles and permissions, novels, configs |

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
# 1. Install dependencies in all five submodules
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

The API defaults to `http://localhost:3000`. OpenAPI docs are available in development mode.
Set the extension's `WXT_API_URL` to the backend address before using API features;
its checked-in development example points to port 7001. See the
[development guide](docs/development.md) for details.

For page summaries, install and sign in to Claude Code and/or Codex CLI, then run `make dev-client`. Pair the extension with the token shown in the desktop window. See the [desktop client guide](docs/client.md).

## Makefile Reference

Run `make help` to see targets for all five apps. Client commands are also available through `make client-<target>` or directly in `apps/client`.

### Submodules

| Command                | Description                                                         |
| ---------------------- | ------------------------------------------------------------------- |
| `make submodules-init` | Initialize submodules after clone                                   |
| `make init`            | Alias for `submodules-init`                                         |
| `make pull`            | Pull umbrella repo, sync submodule pointers, pull each submodule    |
| `make update`          | Bump submodules to their latest remote commits                      |
| `make deploy`          | Interactive `xeploy` release: bump versions, tag, publish to `main` |

### Setup

| Command        | Description                                     |
| -------------- | ----------------------------------------------- |
| `make install` | `bun install` in all five apps                  |
| `make setup`   | Backend setup: Docker Postgres + migrate + seed |

### Development

| Command              | Description                                  |
| -------------------- | -------------------------------------------- |
| `make dev-backend`   | Start API in watch mode                      |
| `make dev-extension` | Start Chrome extension dev server            |
| `make dev-website`   | Start the website development server         |
| `make dev-dashboard` | Start the admin dashboard development server |
| `make dev-client`    | Start Electron desktop client                |
| `make dev-firefox`   | Start Firefox extension dev server           |

### Build

| Command                | Description                              |
| ---------------------- | ---------------------------------------- |
| `make build`           | Build all five apps                      |
| `make build-backend`   | Production backend build                 |
| `make build-extension` | Chrome extension build                   |
| `make build-website`   | Export the static website and CSP hashes |
| `make build-dashboard` | Build the static admin dashboard         |
| `make build-client`    | Desktop client build                     |
| `make build-firefox`   | Firefox extension build                  |
| `make start-backend`   | Build and run the production API         |
| `make zip`             | Build and zip Chrome extension           |
| `make zip-firefox`     | Build and zip Firefox extension          |

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

| Command          | Description                   |
| ---------------- | ----------------------------- |
| `make typecheck` | Typecheck all five submodules |
| `make test`      | Run backend and client tests  |

### Pass-Through Targets

Run any submodule Make target directly from the root:

```bash
make backend-dev
make backend-db-studio
make extension-typecheck
make extension-orval
make client-pack
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
├── docs/              # development and architecture guides
├── apps/
│   ├── backend/       # git submodule — Elysia.js API
│   ├── extension/     # git submodule — WXT + React extension
│   ├── client/        # git submodule — Electron desktop companion
│   ├── website/       # git submodule — static Next.js website
│   └── dashboard/     # git submodule — Vite + React admin dashboard
└── .gitmodules
```

## License

Source available under the [PolyForm Noncommercial License 1.0.0](LICENSE.md).

You may use, modify, and share this project for **non-commercial purposes** only. Commercial use requires separate permission from the author.

## Further Reading

- [Documentation index](docs/intro.md)
- [Backend README](apps/backend/README.md)
- [Extension README](apps/extension/README.md)
- [Client README](apps/client/README.md)
- [Website README](apps/website/README.md)
- [Dashboard README](apps/dashboard/README.md)

## Website

[Story Lens website](https://storylens.iscoded.com) · [Website source](https://github.com/Hussain7Abbas/storylens-website) · [Privacy](https://storylens.iscoded.com/en/privacy/) · [Terms](https://storylens.iscoded.com/en/terms/)

The fourth submodule, `apps/website`, contains the English/Arabic Next.js static website. Use `make dev-website`, `make build-website`, and `make website-lint`. Bun and Biome provide its tooling. The root quality and build targets include it. See [Website deployment](docs/website.md) for the separate server checkout and Nginx configuration.

## Dashboard

[Story Lens dashboard](https://storylens-dashboard.iscoded.com) · [Dashboard source](https://github.com/Hussain7Abbas/storylens-dashboard)

The fifth submodule, `apps/dashboard`, is the admin dashboard for the API's `/api/admin` routes. One account can have reader access (the extension, website and desktop client through `/api/user`), dashboard access, or both, with a role for each. There is no dashboard sign-up: dashboard access is granted on its Users page, and the backend seed gives the first super admin. Every endpoint has its own permission, grouped into roles that the dashboard edits. See [Dashboard](docs/dashboard.md) and the [backend permission model](docs/backend.md#portals-roles-and-permissions).
