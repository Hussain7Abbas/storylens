# AGENTS.md — Storylens Umbrella Repo

Generic AI agent rules for the **Storylens** monorepo. Tool-specific config files (CLAUDE.md, .cursor/rules/) defer to this file.

## Self-Maintenance Rule

**Whenever you make a change that affects architecture, commands, submodule layout, tooling, or conventions, update this AGENTS.md (and the relevant submodule AGENTS.md) to reflect the new state before finishing the task.**

---

## Repository Overview

This is an umbrella repo that links two Git submodules via a root `Makefile`. Source code lives entirely inside the submodules.

```
storylens/
├── Makefile              # delegates to submodule Makefiles
├── apps/
│   ├── backend/          # git submodule → storylens-backend (Elysia.js API)
│   └── extension/        # git submodule → storylens-extension (WXT + React)
└── .cursor/rules/        # Cursor AI rules (reference this file)
```

There is **no shared `package.json`** or Turbo config at the umbrella root — each submodule is a self-contained repo with its own `bun install`.

---

## Common Commands (run from repo root)

```bash
# Setup
make submodules-init      # initialize submodules after fresh clone
make install              # bun install in both submodules
make setup                # Docker Postgres + migrate + seed

# Development
make dev-backend          # start API in watch mode (port 3000)
make dev-extension        # start Chrome extension dev server
make dev-firefox          # start Firefox extension dev server

# Build
make build                # build both
make zip                  # build + zip Chrome extension
make zip-firefox          # build + zip Firefox extension

# Database
make docker-up            # start Postgres container
make db-migrate-dev       # create/apply dev migrations
make db-seed              # seed database
make db-studio            # open Prisma Studio

# Quality
make typecheck            # typecheck both submodules
make test                 # run backend tests
make orval                # regenerate API client from OpenAPI spec
make i18n-parse           # extract i18n keys from extension source
```

---

## Submodule Workflow

Changes always happen **inside a submodule**. Then bump the pointer in the umbrella:

```bash
cd apps/backend           # or apps/extension
git add . && git commit -m "feat: ..."
git push

cd ../..
git add apps/backend      # bump pointer
git commit -m "chore: bump backend submodule"
```

To pull everything in sync:
```bash
make pull                 # umbrella + all submodule pointers + each submodule remote
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Backend | Elysia.js, Prisma ORM, PostgreSQL, JWT (`jose`), `bcryptjs` |
| Extension | WXT framework, React 19, Mantine UI, Jotai, React Router |
| API client | Orval-generated React Query hooks from backend OpenAPI spec |
| Build | Bun (package manager), Turbo (within each submodule) |
| Code quality | Biome (lint + format), TypeScript strict mode |

---

## Universal Coding Rules

These apply in **both** submodules:

- **Never use `any` type** — use proper TypeScript types or generics
- **Always run `bun run typecheck` after completing a task** and fix all errors before finishing
- **Never use eslint-disable comments** — fix the underlying issue
- **Always use Bun** for all package management (`bun add`, `bun install`, `bun run`)
- Use named exports, not default exports (except WXT entry points which require `export default`)
- Biome enforces formatting: single quotes, 2-space indent, 86-char line width

---

## Submodule-Specific Rules

See each submodule's own AGENTS.md for domain-specific rules:

- [`apps/backend/AGENTS.md`](apps/backend/AGENTS.md) — Elysia.js patterns, RBAC, database, auth
- [`apps/extension/AGENTS.md`](apps/extension/AGENTS.md) — WXT patterns, React/Mantine, offline mode, API hooks
