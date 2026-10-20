---
{
  block: scope,
  title: Features and boundaries,
  answers:
    [
      {
          id: features,
          question: What are the first useful features?,
          answer:
            [
              "Read novels with keyword coloring, bilingual names and
                descriptions, aliases, chapter-specific versions, tooltips and
                word VFX.",
              Apply text replacements and detect novel/chapter content with
                website selectors.,
              "Download novel data, edit through a local outbox and
                synchronize changes with the API.",
              "Choose Cloud or Desktop independently for AI summaries, keyword
                suggestions and extraction, selector suggestions, novel research
                and character images.",
              Share chapter artwork and structured chapter context for visual
                continuity; crawl a novel wiki through the desktop companion and
                review characters before saving.,
              "Use website accounts, view feature prices and lens balances,
                and request lenses.",
              "Administer users, portal-specific roles and permissions, novels
                and keywords, billing requests, gifts, AI models, prices and
                shared prompts."
            ],
          status: confirmed,
          source: docs/intro.md:3; docs/extension.md:7; docs/dashboard.md:9;
            apps/extension/src/lib/offline/db.ts:25;
            apps/backend/prisma/schema.prisma:289,
          updatedAt: 2026-10-18T14:05:45.067Z,
          confirmedBy: You
        },
      {
          id: modules,
          question: "Which modules or boundaries must be preserved, and what is outside
            the first version?",
          answer: "Preserve five independent Git submodules: backend owns the API, auth,
            Prisma/PostgreSQL, storage, billing and Cloud AI; extension owns the
            WXT reader UI, content/background scripts and offline store; client
            owns the Electron companion, local prompt service, CLI adapters and
            wiki crawler; website owns the static bilingual
            marketing/legal/account/balance/pricing surfaces; dashboard owns
            administration. The umbrella delegates commands and contains no root
            package.json or shared workspace packages. Preserve reader /api/user
            and dashboard /api/admin contracts and generated clients. No new
            first-version exclusions are established by the inspected material.",
          status: confirmed,
          source: AGENTS.md:3; AGENTS.md:7; AGENTS.md:21; docs/compatibility.md:13,
          updatedAt: 2026-10-18T14:05:46.657Z,
          confirmedBy: You
        }
    ]
}
---
