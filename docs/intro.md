# Story Lens documentation

Story Lens pairs a browser extension for novel reading with an API for novels, keywords, replacements, selectors, accounts, storage, and chapter detection. A local desktop client runs optional Claude/Codex page summaries. The umbrella repository holds all three apps as Git submodules and delegates their commands through its root `Makefile`.

- [Development and submodules](development.md): setup, commands, API client generation, and Git workflow.
- [Backend API](backend.md): service organization, data, auth, and OpenAPI.
- [Browser extension](extension.md): entry points, UI, localization, API access, and offline behavior.
- [Desktop client](client.md): Claude/Codex execution, pairing, page summaries, and packaging.
- [Desktop implementation tracker](../plan/main.md): phases and validation record.

Agent rules and maintenance requirements live in the [root instructions](../AGENTS.md), with [backend](../apps/backend/AGENTS.md), [extension](../apps/extension/AGENTS.md), and [client](../apps/client/AGENTS.md) instructions for local work. The [README](../README.md) covers user-facing quick start and licensing.
