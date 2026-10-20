---
{
  block: technology,
  title: Technologies and libraries,
  answers:
    [
      {
          id: stack,
          question: Which technologies are already chosen?,
          answer: TypeScript and Bun; Elysia with Prisma/PostgreSQL backend; WXT and React
            extension; Electron with a Fastify loopback service for the desktop
            companion; static Next.js App Router/React website; Vite/React
            dashboard. Each app has an independent manifest and toolchain; the
            website pins Bun 1.3.6.,
          status: confirmed,
          source: apps/backend/package.json:8; apps/backend/package.json:28;
            apps/extension/package.json:25; apps/client/package.json:23;
            apps/website/package.json:17; apps/website/package.json:46;
            apps/dashboard/package.json:19; apps/backend/prisma/schema.prisma:5,
          updatedAt: 2026-10-18T14:05:48.331Z,
          confirmedBy: You
        },
      {
          id: libraries,
          question: Which libraries or tools must be used or avoided?,
          answer:
            [
              Use Bun for dependency management and package scripts in each
                submodule; retain root Make delegation instead of introducing a
                shared workspace.,
              Use explicit TypeScript types instead of any; prefer named
                exports except framework-required entry points; do not add
                eslint-disable comments.,
              "Follow each app's formatter and TypeScript configuration;
                extension, website and dashboard use Biome.",
              "Keep existing UI/data libraries: extension React, Mantine,
                TanStack Query, Jotai, i18next and Dexie; dashboard React
                Router, TanStack Query and Tailwind; website next-intl and
                Tailwind.",
              "Preserve Elysia boundary validation, Prisma transactions,
                existing error/permission helpers, Better Auth integration and
                Zod validation where already used.",
              Use Orval for generated extension/dashboard API clients and the
                app-specific Bun or Playwright test tools.
            ],
          status: confirmed,
          source: AGENTS.md:18; apps/extension/package.json:25;
            apps/dashboard/package.json:19; apps/website/package.json:17;
            apps/backend/package.json:28,
          updatedAt: 2026-10-18T14:05:49.878Z,
          confirmedBy: You
        }
    ]
}
---
