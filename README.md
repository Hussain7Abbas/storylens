# Story Lens

<p align="center">
  A browser extension for novel reading, backed by an Elysia.js API — built as a Turbo + Bun monorepo.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#development-commands">Development Commands</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#contributing">Contributing</a>
</p>

## Features

- 🏎️ **Turborepo** — High-performance monorepo build system
- 🔄 **Full TypeScript** — End-to-end type safety across packages and apps
- 🐎 **Bun** — Fast JavaScript runtime and package manager
- 🔌 **Browser Extension** — WXT + React extension for Chrome and Firefox
- ⚡ **Backend API** — Elysia.js with OpenAPI/Swagger documentation
- 🗄️ **Database** — Prisma ORM with PostgreSQL
- 📦 **API Client** — Orval-generated React Query hooks
- 🔍 **Code Quality** — Biome for formatting and linting
- 🌍 **i18n** — Internationalization for the extension
- 🐳 **Docker** — Docker Compose for local PostgreSQL

## Getting Started

All setup and day-to-day tasks are run through **Make** from the monorepo root. Run `make help` anytime to see the full list of targets.

### Prerequisites

- [Bun](https://bun.sh/) (v1.2.22 or later)
- [Docker](https://www.docker.com/) and Docker Compose
- [Make](https://www.gnu.org/software/make/) (usually pre-installed on macOS/Linux)

### First-time setup

1. **Clone the repository**

```bash
git clone <repository-url>
cd storylens
```

2. **Configure environment variables**

```bash
make init-env
```

This runs the interactive env setup script and creates the `.env` files needed by the backend, database, and other packages.

3. **Run the full setup**

```bash
make setup
```

This single command:

- Starts PostgreSQL via Docker (`make docker-up`)
- Installs dependencies (`make install`)
- Generates the Prisma client (`make db-generate`)
- Applies database migrations (`make db-migrate-deploy`)
- Seeds the database (`make db-seed`)

4. **Seed storage (optional)**

```bash
make storage-seed
```

5. **Start development**

```bash
make dev
```

This starts all apps via Turbo (backend API + browser extension).

### Manual setup (step by step)

If you prefer to run each step yourself:

```bash
make init-env
make install
make docker-up
make db-generate
make db-migrate-deploy
make db-seed
make storage-seed   # optional
make dev
```

If dependencies are already installed and you only need the database:

```bash
make db-setup
```

## Development Commands

Run these from the **monorepo root**. Each app also has its own Makefile — see [apps/backend/Makefile](apps/backend/Makefile), [apps/extension/Makefile](apps/extension/Makefile), and [packages/db/Makefile](packages/db/Makefile).

### Development servers

| Command | Description |
| --- | --- |
| `make dev` | Start all apps (backend + extension) via Turbo |
| `make dev-backend` | Start the API only (also starts Postgres via Docker) |
| `make dev-extension` | Start the Chrome extension dev server |
| `make dev-firefox` | Start the Firefox extension dev server |

Aliases: `make backend` and `make extension` work the same as `make dev-backend` and `make dev-extension`.

### Database

| Command | Description |
| --- | --- |
| `make db-migrate-dev` | Create and apply a migration in development |
| `make db-migrate-deploy` | Apply pending migrations (production/CI) |
| `make db-reset` | Reset the database and re-apply all migrations |
| `make db-seed` | Seed the database with initial data |
| `make db-studio` | Open Prisma Studio |
| `make db-generate` | Regenerate the Prisma client |

### Build & release

| Command | Description |
| --- | --- |
| `make build` | Build all workspaces |
| `make build-backend` | Build the API for production |
| `make build-extension` | Build the Chrome extension |
| `make build-firefox` | Build the Firefox extension |
| `make zip` | Build and zip the Chrome extension |
| `make zip-firefox` | Build and zip the Firefox extension |
| `make start-backend` | Build and run the production API |

### Code quality

| Command | Description |
| --- | --- |
| `make typecheck` | Type-check all workspaces |
| `make check` | Format, lint, and check with Biome |
| `make lint` | Lint with Biome |
| `make format` | Format with Biome |
| `make test` | Run tests across the monorepo |

### Other

| Command | Description |
| --- | --- |
| `make orval` | Regenerate the API client from the backend OpenAPI spec |
| `make i18n-parse` | Extract translatable strings from the extension |
| `make docker-up` | Start PostgreSQL |
| `make docker-down` | Stop PostgreSQL |
| `make docker-logs` | Tail Docker Compose logs |
| `make help` | Show all available Make targets |

## Project Structure

```
storylens/
├── apps/
│   ├── backend/            # Elysia.js API server
│   └── extension/          # WXT + React browser extension
├── packages/
│   ├── api/                # Orval-generated API client
│   ├── db/                 # Prisma schema, migrations, and seed
│   ├── storage/            # File storage client
│   └── utils/              # Shared utilities and schemas
├── configs/                # Shared TypeScript configurations
├── scripts/                # Development and maintenance scripts
├── Makefile                # Root Make targets (start here)
└── docker-compose.yml      # Local PostgreSQL
```

## Environment Variables

Use `make init-env` to set up environment files interactively. Typical locations:

- **Backend**: `apps/backend/.env`
- **Database**: `packages/db/.env`

## Contributing

Contributions are welcome! Please follow conventional commit format and run `make typecheck` and `make check` before opening a pull request.
