# Phase 6 — Validation, packaging, and documentation

[Global tracker](main.md) · **Status: In progress** · **Estimate: 5 points** · **Dependencies: phases 1–5**

## User story

As a reader, I want tested Windows/macOS installers and clear setup instructions so I can use the desktop connection without a development environment.

## Tasks

- [ ] Run client behavioral tests for authentication, host/origin checks, schemas, model/effort mapping, parsing, capacity, timeout, disconnect, and shutdown.
- [ ] Run extension tests for streaming, tab routing, capture, safe rendering, deduplication, retry, and navigation cancellation.
- [x] Run `bun run typecheck` in client, extension, and backend; fix affected errors and record results. Run backend tests if backend behavior changes; none are currently planned.
- [x] Build the client and Chrome/Firefox extension variants. Avoid unrelated formatting and manual edits to Orval-generated files.
- [x] Perform a minimal live prompt and end-to-end page summary with each installed/authenticated provider. Distinguish live evidence from fake-provider tests.
- [ ] Verify missing CLI/login, stale token, occupied port, unsupported version, unavailable model, context overflow, rate limit, timeout, and stopped-client behavior.
- [ ] Verify request survival near the deadline, popup closure, tab changes, SPA navigation, and cancellation without orphan processes in both browsers.
- [x] Configure CI in the client repository with native Windows/macOS runners, frozen Bun installs, typechecks/tests, packaging, and artifact upload.
- [ ] Produce macOS `.app`/DMG and Windows NSIS `.exe` packages on native runners. Smoke-test install/uninstall, launch, pairing, summary, shutdown, paths with spaces/non-ASCII characters, and GUI-launch CLI discovery.
- [x] Record CPU architecture coverage explicitly; an arm64 build does not demonstrate x64 support or vice versa.
- [x] Keep signing/notarization credentials outside Git. Label unsigned artifacts and leave public-release signing pending when credentials are unavailable.
- [ ] Verify runtime on a machine without Bun installed. Document provider CLIs and their login/runtime as external prerequisites.
- [x] Update root/scoped instructions, README, documentation index, extension guide, and new `docs/client.md` for the actual implementation.
- [x] Document pairing/rotation, provider installation/login, model discovery/overrides, protocol/errors/limits, execution restrictions, troubleshooting, and platform caveats.
- [x] Update extension privacy/store disclosures for explicit page-content transfer to the desktop client and chosen AI provider.
- [x] Add a scoped client Makefile and root delegation for installation, development, build, typecheck, tests, and packaging; document all three submodules.
- [x] Review all affected Git diffs and preserve unrelated edits. Commit extension changes in its submodule before updating the umbrella pointer.
- [x] Update phase evidence and global status, leaving unverified work explicitly pending.

## Validation matrix

| Area | Required evidence | Result |
| --- | --- | --- |
| Type safety | Client, extension, backend typechecks | Passed |
| Client behavior | Transport/service/provider lifecycle tests | Seven tests passed, including GUI-PATH Codex discovery and required response language; HTTP disconnect and process-tree races pending |
| Extension behavior | Capture/rendering/messaging/stream tests | Chrome end-to-end summary and launcher logo/drag persistence/viewport placement passed; focused edge-case tests pending |
| Browser builds | Chrome and Firefox production builds | Passed |
| Live providers | Minimal Claude and Codex requests | Both returned `OK`; both summarized a page through the extension |
| End-to-end | Both browsers; result stays on original page | Chrome passed with both providers after popup closure; Firefox pending |
| macOS package | Build, install, launch, pair, summarize, quit | arm64 DMG built locally and on native CI; packaged app UI, service, and Chrome summaries passed; install/uninstall pending |
| Windows package | Build, install, launch, pair, summarize, quit | x64 NSIS installer built on native Windows CI; runtime and install/uninstall pending |
| CPU coverage | OS/architecture explicitly recorded | macOS arm64 and Windows x64 artifacts; no other architectures verified |
| Public distribution | Signing/notarization when credentials available | Unsigned; credentials unavailable |

## Acceptance criteria

- [ ] Required tests/builds have recorded results and reproducible commands/procedures.
- [ ] Native packages launch and summarize without Bun on the user's system.
- [x] Documentation covers provider setup/login, client launch, pairing, and summarization.
- [x] Missing platform access, login, signing credentials, or manual tests remain visibly pending with a next action.
- [x] Global tracker reflects implemented and verified behavior, not just file creation.

## Validation record

For the protocol 2 and launcher change, client tests: 7 passed. Client, extension, and backend `bun run typecheck` passed; the client and Chrome/Firefox production extension builds passed. The `bun run smoke:launcher` Playwright check showed the circle absent without a selector, verified logo loading, persisted dragging across reload, clamped dragging/restored positions after resize, and kept popup placement within the viewport at opposite corners. Earlier validation: Claude and Codex live prompts returned `OK`; Chrome end-to-end summaries passed with each provider after closing the popup. macOS arm64 DMG (124 MB) and Windows x64 NSIS installer (108 MB) built locally; Windows executable header confirms x86-64 payload. The standalone client [CI run](https://github.com/Hussain7Abbas/storylens-client/actions/runs/36140334422) passed frozen installs, typechecks, tests, native macOS/Windows packaging, and artifact uploads under the prior protocol. The packaged Mac window loaded its isolated preload bridge and displayed its listening status; its authenticated service returned 12 models and a live prompt result. **Next checks:** verify protocol 2 in a packaged app, run the installer, launch, pairing, summary, and uninstall flows on native Windows; run the Firefox browser flow; probe long-running MV3 requests and disconnect/process cleanup; sign/notarize before public distribution.
