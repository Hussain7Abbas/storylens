# Backend API

[Documentation index](intro.md) · [Development](development.md)

`apps/backend` is a Bun and Elysia service backed by PostgreSQL through Prisma. `src/main.ts` starts the app defined in `src/server.ts`, which mounts plugins and resource routes. `src/setup.ts` supplies the Prisma client, current authenticated user, and an English/Arabic translation helper to route context.

## Main areas

- `src/routes/` handles accounts, novels, chapters, keywords and their aliases/versions, replacements, categories and natures, configuration, website selectors and biases, uploads, and AI operations.
- `src/middleware/authorize.ts` defines authenticated guest, user, and admin guards, plus ownership checks. Routes enforce permissions server side.
- `src/lib/auth/` combines Better Auth with bearer session handling; `src/lib/db/` supplies Prisma, `src/lib/storage/` handles image storage, and `src/lib/ai/` supports chapter selector detection.
- `prisma/schema.prisma` defines users, sessions, novels, chapters, keywords, aliases, versions, replacements, selectors, and related records. `prisma/migrations/` tracks schema changes; `prisma/seed/` populates development data.

The server centralizes expected HTTP errors with `HttpError` and `AuthError`. Routes validate inputs with Elysia schemas and use Prisma for persistence. The development OpenAPI UI is at `/docs`, with `/openapi.json` feeding the extension's Orval client. The OpenAPI plugin returns 404 in production mode.

Environment variables are validated in `src/env.ts`. Copy `.env.example` and supply a database URL, Better Auth secret, and storage key; seed and AI features need their respective values. `PORT` defaults to 3000. The local Docker database is defined by `docker-compose.yml`.

For local API and database commands, see [Development](development.md) and the [backend instructions](../apps/backend/AGENTS.md). The [backend README](../apps/backend/README.md) has standalone setup details.
