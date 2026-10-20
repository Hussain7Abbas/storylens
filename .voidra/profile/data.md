---
{
  block: data,
  title: Data and protection,
  answers:
    [
      {
          id: model,
          question: What information does the project store or manage?,
          answer:
            [
              "Users have credentials, sessions, user/admin portal access and
                portal-specific roles; roles grant endpoint and capability
                permissions.",
              "Novels own bilingual metadata, global AI context, chapters,
                keywords and replacements; chapters own structured context,
                shared artwork, generation leases and mention history.",
              "Keywords have bilingual names, aliases and chapter-ranged
                versions; descriptions, category, nature and image can vary by
                version or alias. Words and categories carry style/VFX settings,
                with personal reader color records.",
              Website selectors and novel biases map third-party reading pages
                to content and novel/chapter detection.,
              Files reference stored media; Config holds runtime settings and
                shared AI templates.,
              "Lens balances change through an append-only, idempotent
                LensTransaction ledger. BillingRequest, AiFeaturePrice, AiAction
                and AiCall track requests, prices, charges/refunds and provider
                usage.",
              "SyncChange records server-side changes; the extension's
                Dexie/IndexedDB stores server snapshots, queued mutations and
                files, per-novel sync state and metadata."
            ],
          status: confirmed,
          source: apps/backend/prisma/schema.prisma:81;
            apps/backend/prisma/schema.prisma:259;
            apps/backend/prisma/schema.prisma:289;
            apps/backend/prisma/schema.prisma:391;
            apps/backend/prisma/schema.prisma:518;
            apps/backend/prisma/schema.prisma:541;
            apps/backend/prisma/schema.prisma:599;
            apps/backend/prisma/schema.prisma:615;
            apps/extension/src/lib/offline/db.ts:25,
          updatedAt: 2026-10-18T14:05:32.263Z,
          confirmedBy: You
        },
      {
          id: protection,
          question: "Which privacy, security or data-retention rules must it respect?",
          answer: "Enforce authorization, portal isolation, ownership and resource
            permissions in the backend. Keep bearer and website cookie sessions
            separate; website writes require the approved origin and web header.
            Desktop requires a pairing token and validates loopback Host/allowed
            Origin; account credentials remain in its private settings/main
            process. AI work starts through explicit actions and cleans source
            content before sending it to the selected provider; do not log
            prompts, page text, responses or images. Cloud request bodies are
            transient except explicitly saved image prompts and validated
            published chapter context/mention records. Desktop providers run
            with restricted execution settings, while Gemini may retain its own
            CLI session history. Keep stored text plain and avoid inserting it
            as HTML. Analytics require opt-in. Do not infer a general retention
            period from these rules.",
          status: confirmed,
          source: apps/backend/AGENTS.md:11; apps/backend/AGENTS.md:16;
            apps/backend/AGENTS.md:17; apps/backend/AGENTS.md:25;
            docs/client.md:41; docs/client.md:43; apps/client/src/server.ts:26;
            docs/website.md:57,
          updatedAt: 2026-10-18T14:05:33.770Z,
          confirmedBy: You
        }
    ]
}
---
