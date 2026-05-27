# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Full rules live in [AGENTS.md](AGENTS.md). This file is a thin Claude-specific wrapper — read AGENTS.md first.

## Architecture

Umbrella repo. No application source here — everything is in Git submodules:

- `apps/backend/` — Elysia.js API (see [apps/backend/AGENTS.md](apps/backend/AGENTS.md))
- `apps/extension/` — WXT + React browser extension (see [apps/extension/AGENTS.md](apps/extension/AGENTS.md))

## Key Commands

```bash
make install              # bun install in both submodules
make setup                # Docker Postgres + migrate + seed
make dev-backend          # start API (port 3000)
make dev-extension        # start Chrome extension dev server
make typecheck            # typecheck both submodules
make pull                 # sync umbrella + submodule pointers + remotes
```

See [AGENTS.md](AGENTS.md) for the full command reference and submodule workflow.
