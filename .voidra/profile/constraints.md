---
{
  block: constraints,
  title: "Priorities, limits and references",
  answers:
    [
      {
          id: priorities,
          question: Which qualities matter most?,
          answer:
            [
              offline,
              cost,
              accessibility,
              Backward compatibility for supported installed clients,
              English/Arabic reading and consistent light/dark interfaces
            ],
          status: confirmed,
          source: "apps/extension/src/lib/offline/db.ts:19; README.md:15;
            docs/website.md:7; AGENTS.md:22; docs/website.md:5 (observed
            priorities, with no ranking established)",
          updatedAt: 2026-10-18T14:02:09.521Z,
          confirmedBy: You
        },
      {
          id: limits,
          question: Which constraints or fixed decisions must the work respect?,
          answer: "Keep the five independent submodule boundaries and use Bun per app.
            Preserve supported API/offline data contracts through additive
            changes, dated deprecations and expand/migrate/contract migrations;
            do not use deprecated generated APIs in new client code. Validate at
            API boundaries, preserve exact/idempotent billing arithmetic and
            shared error codes, and respect provider/prompt limits instead of
            silently truncating or switching providers. Run typecheck in all
            five apps after each task and backend tests for backend behavior
            changes. Maintain affected docs/instructions, keep CLAUDE.md as
            @AGENTS.md, and commit app changes in their submodule before
            umbrella pointers when a future task authorizes commits. Source is
            PolyForm Noncommercial 1.0.0; commercial use requires separate
            permission. Inspected sources establish no project-wide budget or
            delivery deadline.",
          status: confirmed,
          source: AGENTS.md:18; AGENTS.md:22; AGENTS.md:23; AGENTS.md:24;
            docs/compatibility.md:51; apps/backend/AGENTS.md:15;
            docs/client.md:37; docs/extension.md:13; README.md:205,
          updatedAt: 2026-10-18T14:05:29.416Z,
          confirmedBy: You
        },
      {
          id: references,
          question: "Which existing documents, examples or source materials should guide
            the work?",
          answer:
            [
              "AGENTS.md and
                apps/{backend,extension,client,website,dashboard}/AGENTS.md:
                repository boundaries, conventions and maintenance
                requirements.",
              "docs/intro.md: documentation entry point and current product
                surfaces.",
              "docs/development.md: setup, Make commands, generated API
                clients and submodule workflow.",
              "docs/backend.md and apps/backend/prisma/schema.prisma:
                API/auth/billing/AI/sync behavior and domain data.",
              "docs/compatibility.md: supported-client contracts, dated
                deprecations and database evolution.",
              "docs/extension.md and apps/extension/src/lib/offline/: browser
                behavior, source selection, local storage and synchronization.",
              "docs/client.md: pairing, provider execution, wiki crawling,
                privacy and native distribution.",
              "docs/website.md and docs/dashboard.md: bilingual
                account/pricing and administration interfaces and deployment.",
              "docs/branding/README.md: approved Lensbook identity, canonical
                palette and lens coin rules.",
              "docs/publishing.md and docs/lenses-local-e2e.md: publication
                and isolated cross-app browser rehearsal.",
              "apps/*/package.json: app-local dependencies, scripts and
                current checked-out versions; older tracker release-state
                wording may be historical."
            ],
          status: confirmed,
          source: docs/intro.md:5; docs/intro.md:20; AGENTS.md:7;
            apps/backend/package.json:4; apps/extension/package.json:4;
            apps/client/package.json:3; apps/website/package.json:3;
            apps/dashboard/package.json:3,
          updatedAt: 2026-10-18T14:05:31.146Z,
          confirmedBy: You
        }
    ]
}
---
