# Story Lens desktop client — global tracker

**Status: implementation in progress.**

The user requested implementation after the planning phase. This tracker now records delivered code, verified behavior, and remaining platform checks.

## Goal

Add a JavaScript desktop app named `client`, packaged as a Windows `.exe` installer and macOS `.app`/DMG. The browser extension sends commands to the app and receives results. The first business command is `ExecutePrompt(prompt, model, effort)`, using the user's authenticated Claude Code or Codex installation in headless mode.

The first extension feature is a **Summarize** button: capture the active website's HTML body, send it with a summarization prompt, and display the returned text in a section at the beginning of that same page.

## Proposed technical decisions

| Area | Decision | Reason |
| --- | --- | --- |
| Desktop | Electron + TypeScript | JavaScript runtime, Node subprocess APIs, established Windows/macOS packaging. |
| Packaging | electron-builder | Platform installers; native CI runners for builds and signing. |
| Local service | Fastify on Node | Schema validation, lifecycle hooks, modular routes for future commands. |
| Extension connection | Authenticated loopback HTTP | Fits existing background proxying; avoids browser-specific native-host registration. |
| Initial transport | Final JSON or NDJSON with heartbeat frames | One business endpoint; long browser request behavior must pass phase 0 verification. |
| Providers | Separate Claude and Codex headless adapters | Reuses provider login and isolates CLI differences. |
| Models and efforts | Validated runtime enum from a provider catalog | Availability and efforts vary by account, CLI version, and model. |
| Dependencies | Independent Bun package in `apps/client` | No root workspace; packaged runtime does not require Bun. |
| Repository ownership | `apps/client` is the third Git submodule | Its source and packaging CI live in [storylens-client](https://github.com/Hussain7Abbas/storylens-client); the umbrella pins a commit. |

Electron costs more disk and memory than Tauri. Tauri introduces Rust and another toolchain without a demonstrated need for the smaller binary. A bare Node/Bun executable omits the desktop setup/status interface. Native messaging remains a fallback if loopback lifecycle verification fails; a cloud relay is outside scope.

## Global phase tracker

Implementation is underway. Story points are relative estimates, not delivery dates. Each phase records completed and pending checks.

| Phase | Deliverable | Points | Depends on | Status |
| --- | --- | ---: | --- | --- |
| [0 — Architecture and compatibility](00-architecture-and-compatibility.md) | Verify contracts and freeze v1 design | 3 | None | In progress |
| [1 — Desktop foundation](01-desktop-foundation.md) | App shell, settings, process lifecycle | 5 | 0 | In progress |
| [2 — Provider adapters](02-provider-adapters.md) | Model/effort catalog and Claude/Codex execution | 8 | 0, 1 | In progress |
| [3 — Command service](03-command-service.md) | ExecutePrompt and capability metadata | 5 | 1, 2 | In progress |
| [4 — Extension connection](04-extension-connection.md) | Pairing, model selection, transport | 5 | 3 | In progress |
| [5 — Page summaries](05-page-summaries.md) | Summarize action and in-page result | 5 | 4 | In progress |
| [6 — Validation and packaging](06-validation-and-packaging.md) | Verified builds, native packages, documentation | 5 | 1–5 | In progress |

## Definition of done

- [x] Desktop starts its service and pairs with the extension (packaged macOS app + Chrome smoke test).
- [x] Both providers returned final text using the selected model and effort in live headless checks.
- [ ] Catalog covers the installed provider's exposed models; documented local overrides cover validated IDs absent from picker discovery.
- [x] Unsupported model/effort choices are rejected in service tests; the UI no longer substitutes a removed saved model.
- [x] Summarize worked on a non-novel HTTP page in Playwright Chromium.
- [ ] Popup closure was verified in Chromium; navigation race handling and Firefox remain to be manually verified.
- [ ] Authentication, limits, cancellation, and process cleanup pass behavioral tests.
- [x] Client, extension, and backend typechecks pass; Chrome/Firefox builds pass.
- [ ] Native Windows/macOS package and install smoke tests have evidence.
- [x] Setup, protocol, privacy disclosures, scoped instructions, and documentation links were updated.

## Tracking rules

1. Mark a phase **In progress** only after implementation is requested and prerequisites are met.
2. Complete its task checkboxes and acceptance criteria before marking it **Done** here.
3. Record commands, results, OS/CLI/browser versions, and limitations in the phase file.
4. Mark **Blocked** with a specific cause and next action. Untested live inference or packaging is not complete.
5. Update this tracker in the same implementation task as the affected phase.

## Current validation

Client tests: 5 passed. Client, extension, and backend typechecks passed. Chrome and Firefox extension builds passed. Both provider CLIs returned `OK` in live low-effort calls. A packaged macOS app displayed its listening status, exposed capabilities, and returned a live NDJSON result. Playwright Chromium loaded the extension and verified an on-page summary after closing the popup with both Claude and Codex. The [client CI workflow](https://github.com/Hussain7Abbas/storylens-client/actions/runs/36140334422) built and uploaded macOS arm64 DMG and Windows x64 NSIS artifacts on native runners; Windows runtime and Firefox browser checks remain pending. See [phase 6](06-validation-and-packaging.md) for the full matrix.

## Scope and later work

All seven phases are must-have implementation work. Initial functionality is prompt-in/final-text-out and page summarization; extension inputs cannot request arbitrary shell execution.

Later work: native messaging, streaming text deltas, persistent queues/history with retention controls, multiple paired browsers, automatic updates, and more commands. Public release signing/notarization requires credentials; unsigned local packages can be verified first and must be labeled accordingly.

## Implementation evidence and references

Implementation on 2026-09-25 added the client app, local prompt protocol, extension pairing and summary UI, English/Arabic strings, setup/privacy docs, and packaging workflow. The client now has its own GitHub repository and CI; the umbrella includes it as a third submodule. Mac runtime, live provider calls, and Chrome summary flow with both providers have been verified. Firefox runtime and Windows installation remain pending.

Read-only probes found Codex CLI `0.155.1` and Claude Code `2.1.236`. Claude initialization exposed model metadata including Sonnet 5 and per-model efforts. This is evidence for this machine, not every installation/account.

- [Electron security](https://www.electronjs.org/docs/latest/tutorial/security)
- [Codex non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode)
- [Codex app server and model discovery](https://learn.chatgpt.com/docs/app-server)
- [Claude CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude model configuration](https://code.claude.com/docs/en/model-config)
- Repository context: [development](../docs/development.md), [extension](../docs/extension.md), [root instructions](../AGENTS.md).
