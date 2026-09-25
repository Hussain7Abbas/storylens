# Phase 0 — Architecture and compatibility

[Global tracker](main.md) · **Status: In progress** · **Estimate: 3 points** · **Dependencies: none**

## User story

As a developer, I want verified desktop/browser/provider contracts so later phases use real CLI capabilities and a stable design.

## Tasks

- [x] Confirm supported Electron, TypeScript, Fastify, and electron-builder versions at implementation time; pin resolved dependencies in the lockfile.
- [ ] Verify the packaged Node runtime works without Bun installed on the user's machine.
- [x] Freeze the v1 schemas, limits, errors, cancellation, and runtime enums proposed in [phase 3](03-command-service.md).
- [x] Verify Codex initialization and paginated `model/list`, plus Claude headless initialization/model metadata. Prefer documented SDK helpers where they expose the required data.
- [ ] Prove text-only execution without giving webpage input access to shell, file, browser, MCP, plugin, skill, or hook capabilities. A read-only filesystem sandbox alone does not meet this requirement.
- [x] Verify credential reuse without reading/copying provider secrets into the application or extension. Confirm disabling personal configuration preserves necessary login behavior.
- [ ] Prove Chrome MV3 and Firefox request lifecycles: delayed response, prompt response headers, heartbeat frames, popup closure, and execution approaching the proposed four-minute deadline.
- [ ] Do not assume streaming heartbeats alone prevent MV3 suspension. Use supported extension activity mechanisms if required and record minimum browser versions. If bounded HTTP requests cannot survive reliably, revise transport to native messaging before phase 4.
- [ ] Verify executable resolution on Windows and GUI-launched macOS, including explicit paths and npm shims, without shell-string execution or interactive shell startup files.
- [ ] Record minimum provider versions and actionable compatibility failures.
- [x] Confirm repository ownership: after the user requested a remote, publish the app in `storylens-client` and pin it as the third umbrella submodule.

## Acceptance criteria

- [ ] Each provider's catalog is obtainable without starting paid inference.
- [ ] Tool-use instructions embedded in webpage content cannot grant execution capabilities; unsupported provider versions fail closed.
- [ ] Closing the popup during a bounded request does not lose the response on supported Chrome/Firefox versions.
- [ ] Final transport/provider choices have recorded compatibility evidence, with blockers resolved before dependent work.

## Validation record

Implemented Electron/TypeScript/Fastify design and exercised Claude headless initialization plus Codex app-server model/list with installed CLIs (Claude Code 2.1.236, Codex 0.155.1). Chrome MV3 popup-close behavior passed a live Playwright Chromium summary. Codex shell tools were disabled with the installed CLI's `shell_tool` feature flag; a live tool-request probe returned `NO_TOOL`. **Open:** Firefox request lifecycle and near-240-second MV3 behavior are unverified. Tool-free behavior needs regression checks across supported provider versions before treating the strict criterion as complete.
