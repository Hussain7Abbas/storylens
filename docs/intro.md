# Story Lens documentation

Story Lens pairs a browser extension for novel reading with an API for novels, keywords, replacements, selectors, accounts, storage, chapter detection, billing and Cloud AI. Readers choose lens-funded Story Lens Cloud or the free local desktop companion for summaries, keyword suggestions and extraction, selectors, novel research and character images. The desktop client runs Claude/Codex and can also crawl a novel's wiki into a character list. A bilingual static website explains the product and its legal policies and provides standalone accounts and lens requests. The admin dashboard manages accounts, roles, novels, configs, billing requests and AI pricing. The umbrella repository holds all five apps as Git submodules and delegates their commands through its root `Makefile`.

- [Development and submodules](development.md): setup, commands, API client generation, and Git workflow.
- [Version changelogs](changelog/): release notes for each prepared version, starting with the upcoming 3.2.0 minor update.
- [Backend API](backend.md): service organization, data, auth, and OpenAPI.
- [API and data compatibility](compatibility.md): additive API changes, dated deprecations, client version floors, and expand/contract migrations.
- [Browser extension](extension.md): entry points, UI, localization, API access, and offline behavior.
- [Publishing runbook](publishing.md): set up Chrome Web Store publishing, GitHub environments, the server, and the first automated release on new accounts.
- [Chrome Web Store assets](chrome-store/README.md): real extension screenshots, a demonstration video, and a reproducible original sample chapter.
- [Desktop client](client.md): Claude/Codex execution, pairing, page summaries, the AI wiki crawler, and packaging.
- [Website](website.md): static bilingual landing site, legal content, Bun/Biome checks, and Nginx deployment.
- [Dashboard](dashboard.md): admin dashboard for users, roles and permissions, novels and configs, and its deployment.
- [Branding](branding/README.md): approved Lensbook logo, light/dark palette and platform icon exports.
- [Website implementation tracker](../website-plan/main.md): scope, decisions, evidence, and remaining owner launch checks.
- [Offline-first refactor tracker](../offline-first-refactor-plan/main.md): implemented and merged to `develop` locally (not yet released); remaining owner checks (browser end-to-end matrix, staging migrations, coordinated release) are listed in phase 10.
- [Lenses and cloud AI tracker](../pricing-plan/main.md): implemented in uncommitted working trees; legal approval, live checks and release are pending. Paid AI through OpenRouter with lens coins, top-up requests reviewed on the dashboard (the owner contacts readers on WhatsApp or Telegram), standalone website sign-in, a ⋮ navbar menu with the balance, and prices in every AI button; owner decisions are recorded in the tracker.

Agent rules and maintenance requirements live in the [root instructions](../AGENTS.md), with [backend](../apps/backend/AGENTS.md), [extension](../apps/extension/AGENTS.md), [client](../apps/client/AGENTS.md), [website](../apps/website/AGENTS.md), and [dashboard](../apps/dashboard/AGENTS.md) instructions for local work. The [README](../README.md) covers user-facing quick start and licensing.
