# Story Lens documentation

Story Lens pairs a browser extension for novel reading with an API for novels, keywords, replacements, selectors, accounts, storage, and chapter detection. A local desktop client runs optional Claude/Codex AI actions: page summaries, keyword suggestions and extraction, novel context research, and Codex character images. A bilingual static website explains the product and its legal policies. The umbrella repository holds all four apps as Git submodules and delegates their commands through its root `Makefile`.

- [Development and submodules](development.md): setup, commands, API client generation, and Git workflow.
- [Backend API](backend.md): service organization, data, auth, and OpenAPI.
- [Browser extension](extension.md): entry points, UI, localization, API access, and offline behavior.
- [Publishing runbook](publishing.md): set up Chrome Web Store publishing, GitHub environments, the server, and the first automated release on new accounts.
- [Chrome Web Store assets](chrome-store/README.md): real extension screenshots, a demonstration video, and a reproducible original sample chapter.
- [Desktop client](client.md): Claude/Codex execution, pairing, page summaries, and packaging.
- [Website](website.md): static bilingual landing site, legal content, Bun/Biome checks, and Nginx deployment.
- [Branding](branding/README.md): approved Lensbook logo, light/dark palette and platform icon exports.
- [Website implementation tracker](../website-plan/main.md): scope, decisions, evidence, and remaining owner launch checks.

Agent rules and maintenance requirements live in the [root instructions](../AGENTS.md), with [backend](../apps/backend/AGENTS.md), [extension](../apps/extension/AGENTS.md), and [client](../apps/client/AGENTS.md) instructions for local work. The [README](../README.md) covers user-facing quick start and licensing.
