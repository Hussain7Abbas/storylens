# Story Lens glossary draft

These definitions are inferred from the checked-out code and documentation. They remain a draft for human review. Source locations are project-relative.

| Term | Observed meaning | Evidence |
| --- | --- | --- |
| Story Lens | Novel-reading extension and its backend, desktop companion, website and dashboard. | docs/intro.md:3 |
| Novel | Shared bilingual catalogue entry with slugs, global context, keywords, chapters and replacements. | apps/backend/prisma/schema.prisma:259 |
| Keyword / character | A named novel entity highlighted by the extension; it can have aliases and chapter-specific versions. The UI often calls a keyword a character. | docs/dashboard.md:13; apps/backend/prisma/schema.prisma:391 |
| Alias | Another bilingual name for a keyword, with its own optional description, image and style/matching values. | apps/backend/prisma/schema.prisma:427 |
| Keyword version | Chapter-ranged information and appearance for a keyword, including its base version; not a separate named entity. | apps/backend/prisma/schema.prisma:470; docs/backend.md:9 |
| Category / nature | Shared keyword classification records used by descriptions, AI suggestions and reading styles. | apps/backend/prisma/schema.prisma:325; apps/backend/prisma/schema.prisma:349 |
| Word VFX | Visual effect and optional color used by categories, keywords and aliases. | apps/backend/prisma/schema.prisma:30; apps/backend/AGENTS.md:29 |
| Replacement | Novel-scoped text substitution rule applied while reading. | apps/backend/prisma/schema.prisma:518; docs/extension.md:7 |
| Website selector | A saved rule used to locate novel/chapter content on a reading site. | apps/backend/prisma/schema.prisma:554; docs/extension.md:13 |
| Novel context | A novel's global AI background, distinct from per-chapter structured context. | docs/extension.md:67; apps/backend/prisma/schema.prisma:259 |
| Chapter context | Validated structured chapter observations and summary used for visual continuity, stored on Chapter with generation metadata. | apps/backend/prisma/schema.prisma:289; docs/backend.md:155 |
| Chapter artwork / chapter cover | Shared chapter image stored on Chapter; legacy cover contracts remain behind compatibility adapters. | apps/backend/prisma/schema.prisma:303; docs/compatibility.md:91 |
| Chapter mention | Historical entity observation index used to find last-seen chapter information for continuity. | apps/backend/prisma/schema.prisma:776; docs/backend.md:159 |
| Story Lens Cloud | Backend-mediated paid AI source, with feature pricing and provider calls through OpenRouter. | docs/backend.md:11; docs/extension.md:9 |
| Desktop companion | Electron app exposing a paired loopback prompt service and invoking the reader's Claude/Codex/Gemini CLIs. | docs/client.md:5; apps/client/src/server.ts:20 |
| Pairing token | Random bearer credential required to call the desktop service; distinct from the Story Lens account session. | docs/client.md:27; apps/client/src/server.ts:52 |
| Lens / lenses | Non-expiring virtual credits spent on Cloud AI; Desktop remains a free Story Lens alternative using the reader's provider account. | README.md:15 |
| Lens transaction / ledger | Append-only record of a signed balance change with a unique idempotency key and resulting balance. | apps/backend/prisma/schema.prisma:614 |
| Billing request | Reader request to buy lenses, reviewed by an administrator; approval credits the ledger. | apps/backend/prisma/schema.prisma:654; docs/dashboard.md:16 |
| AI action / AI call | A feature-level generation/charge lifecycle and its individual provider usage records. | apps/backend/prisma/schema.prisma:719; apps/backend/prisma/schema.prisma:745 |
| Portal | User or admin API boundary; one account can access either or both with separate roles and session scope. | apps/backend/prisma/schema.prisma:23; apps/backend/prisma/schema.prisma:95 |
| Role / permission | A portal-specific permission set; endpoint permissions use method plus route-template keys. | apps/backend/prisma/schema.prisma:138; apps/backend/prisma/schema.prisma:163 |
| Guest | Anonymous extension account that can be upgraded to a registered reader. | apps/backend/prisma/schema.prisma:103 |
| Snapshot / outbox | Extension server-row copies and queued local mutations held in the shared Dexie database. | apps/extension/src/lib/offline/db.ts:19 |
| Sync change | Commit-ordered server change-feed record for synchronized entities. | apps/backend/prisma/schema.prisma:599; apps/backend/AGENTS.md:13 |
| Base revision / baseUpdatedAt | Server revision precondition used to reject stale updates with a conflict. | docs/backend.md:64; apps/backend/AGENTS.md:13 |
| Ink & Iris / Lensbook | Existing visual identity and approved book/lens logo, shared across product surfaces. | docs/website.md:5; docs/branding/README.md:3 |

The profile records the scope of this intake. This glossary does not confirm product decisions or establish new release commitments.
