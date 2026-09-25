# Phase 1 — Desktop foundation

[Global tracker](main.md) · **Status: In progress** · **Estimate: 5 points** · **Dependencies: phase 0**

## User story

As a reader, I want to launch a desktop companion and see connection/provider status so I can connect my extension without editing source code.

## Proposed layout

```text
apps/client/
  src/
    desktop/       Electron main, preload, settings/status renderer
    commands/      ExecutePrompt service and future command handlers
    transport/     HTTP routes, authentication, protocol schemas
    providers/     Claude/Codex adapters and model catalog
    runtime/       Executable resolution, child processes, cancellation
    config/        Validated settings and pairing credential storage
  test/            Behavioral tests and synthetic provider fixtures
  scripts/         Build and packaging helpers
  package.json
  bun.lock
  AGENTS.md
  CLAUDE.md
```

Commands depend on provider interfaces; HTTP depends on commands; only desktop modules import Electron. Keep code independent of backend/extension source trees. A small static TypeScript renderer is sufficient for the initial settings screen.

## Tasks

- [x] Scaffold an independent Bun-managed package with strict TypeScript, named exports, and Node-compatible runtime APIs.
- [x] Add scripts for development, build, typecheck, tests, unpacked packaging, and Windows/macOS distributions.
- [x] Create the Electron main process and local settings window with context isolation, renderer sandbox, Node integration disabled, restrictive CSP, and denied unexpected navigation/new windows.
- [x] Expose specific preload operations only: read status/settings, save validated settings, refresh catalog, and rotate/copy pairing token. Validate IPC sender and payload.
- [ ] Store settings in Electron's per-user app-data location. Protect credentials with user-specific access controls and Electron secure storage where available; never log them.
- [x] Show service address/status, pairing token, provider errors, and configurable CLI paths. Default to `127.0.0.1:43127`, with a locally configurable port.
- [x] Generate a cryptographically random pairing token on first use; rotation invalidates old credentials and cancels jobs authenticated with them.
- [x] Enforce one app instance and explicitly report port conflicts instead of silently changing the connection address.
- [x] Define window-close behavior: v1 closes the service and quits. Tray/background mode is deferred to avoid an invisible service without controls.
- [ ] On quit, reject new work, cancel jobs, terminate child processes, close sockets, and delete temporary request directories.
- [x] Add scoped instructions and desktop setup documentation; `CLAUDE.md` contains only `@AGENTS.md`.

## Acceptance criteria

- [ ] A fresh launch creates private settings and an actionable connection screen.
- [ ] Missing CLIs and occupied ports are visible errors; settings remain usable.
- [ ] A second launch does not create another service instance.
- [ ] Quitting during inference leaves no service/provider subprocess running.
- [ ] Renderer code cannot access Node, spawn processes, or invoke arbitrary IPC.

## Validation record

Electron window, isolated preload bridge, local settings, token rotation, provider status, single-instance guard, and loopback service implemented. An unpacked arm64 macOS app launched and served authenticated capabilities. DMG packaging passed. **Open:** Windows launch and quit-during-inference process-tree smoke tests.
