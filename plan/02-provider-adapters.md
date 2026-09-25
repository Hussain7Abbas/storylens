# Phase 2 — Provider adapters and model catalog

[Global tracker](main.md) · **Status: In progress** · **Estimate: 8 points** · **Dependencies: phases 0–1**

## User story

As a reader, I want to choose an available Claude/Codex model and supported effort so prompts use my existing login and return the requested model's answer.

## Catalog and interface

Each adapter exposes `inspect()`, `listModels()`, and `execute(request, signal)`. Normalized models contain `id`, `provider`, exact `providerModel`, `label`, `aliases`, `source` (`discovered` or `local-override`), `efforts`, and `defaultEffort`. The `default` effort sentinel means omit the explicit CLI argument.

The extension receives catalog data and never constructs CLI flags. The model enum is the registered IDs/aliases at execution time. Do not hard-code a universal list or imply every account exposes the same models.

| Friendly alias | Exact provider model, only if available |
| --- | --- |
| `claude-sonnet5` | `claude-sonnet-5` |
| `codex-sol6` | `gpt-6-sol` |
| `codex-luna5.6` | `gpt-5.6-luna` |

Every discovered model also gets a namespaced canonical ID such as `codex:gpt-6-sol` or `claude:claude-sonnet-5`. Preserve context-window variants when they select different behavior. Effort values may include `default`, `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`, and `ultra`; only the model-specific supported subset is allowed. Provider orchestration modes are not automatically reasoning efforts.

## Tasks

- [ ] Resolve PATH, conventional installations, and explicit executable paths. Handle Windows npm shims by launching the actual entry safely without shell interpolation.
- [ ] Report missing executable, unsupported CLI version, and authentication problems separately.
- [x] Discover Codex models through initialized `model/list`, following pagination and requesting hidden entries for the full exposed catalog. Filter models without text input support.
- [x] Discover Claude metadata through the interface verified in phase 0; prefer SDK methods where supported. Isolate version-dependent protocol details and validate incoming JSON.
- [x] Preserve per-model effort choices/defaults and context variants; reject unsafe/uninterpretable metadata.
- [x] Add trusted local overrides for provider-supported IDs absent from discovery. Each override specifies exact model, efforts, and label; mark it manually configured, not verified account access. The extension cannot register arbitrary models.
- [x] Cache capabilities in memory; refresh at startup, on explicit refresh, and after CLI-setting changes. One failed provider must not disable the other.
- [x] Pass prompts through stdin and argument arrays in a fresh temporary working directory without repository context.
- [ ] Apply phase 0's verified text-only restrictions. Disable personal hooks, MCP, skills/plugins, tools, and session persistence as required while preserving provider login.
- [x] Parse Claude structured final results and Codex final assistant messages; exclude reasoning traces, tool events, progress, and stderr from successful output.
- [ ] Never silently substitute another model/provider; surface provider-side model changes when detectable.
- [ ] Handle fragmented JSONL, malformed results, error events, nonzero exits, empty answers, and bounded output/stderr buffers.
- [ ] Terminate complete child-process trees on timeout, disconnect, and app shutdown on both OSes, including bounded force-kill fallback.
- [x] Delete request artifacts on every terminal path and never log prompts or credentials.

## Acceptance criteria

- [ ] Valid requests use exact mapped provider arguments and return final text.
- [ ] Invalid model/effort combinations start no inference process.
- [ ] Shell metacharacters and long prompts remain stdin data and cannot alter arguments.
- [ ] Missing login, malformed output, timeout, and cancellation return typed failures without orphan processes.
- [ ] Fixtures cover both providers, pagination, hidden models, context variants, aliases, and models without effort support.

## Validation record

Both providers discovered models/efforts and returned `OK` from live low-effort headless prompts. Synthetic parser and service tests pass. Codex now disables `shell_tool`; a live probe requesting a file-list tool returned `NO_TOOL`. **Open:** Windows npm shim execution, provider login failure UX, and cross-version tool-isolation regression tests.
