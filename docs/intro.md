# Story Lens documentation

Story Lens pairs a browser extension for novel reading with an API for novels, keywords, replacements, selectors, accounts, storage, and chapter detection. The umbrella repository holds the two projects as Git submodules and delegates commands through its root `Makefile`.

- [Development and submodules](development.md): setup, commands, API client generation, and Git workflow.
- [Backend API](backend.md): service organization, data, auth, and OpenAPI.
- [Browser extension](extension.md): entry points, UI, localization, API access, and offline behavior.

Agent rules and maintenance requirements live in the [root instructions](../AGENTS.md), with [backend](../apps/backend/AGENTS.md) and [extension](../apps/extension/AGENTS.md) instructions for local work. The [README](../README.md) covers user-facing quick start and licensing.
