# Story Lens Client

[Documentation index](intro.md) · [Development](development.md) · [Implementation tracker](../plan/main.md)

`apps/client` is an Electron desktop companion for macOS and Windows. It starts an authenticated HTTP service on `127.0.0.1:43127` and runs the locally installed Claude Code or Codex CLI in headless mode. The extension's Summarize button sends the active HTTP(S) page body through this service to the selected provider and displays the returned plain text at the top of that page. The Elysia backend is not involved.

## Setup

1. Install and sign in to [Claude Code](https://code.claude.com/docs/en/setup) and/or [Codex CLI](https://learn.chatgpt.com/docs/codex/cli). At least one provider must be available.
2. From the umbrella repository, run `make install` and `make dev-client` for development. Run `make client-pack` for an unpacked app, `make client-dist-mac` for a macOS DMG, or `make client-dist-win` on Windows for an NSIS `.exe` installer. Packaged use does not require Bun but still needs the provider CLI and its login.
3. Keep the desktop window open. Copy its pairing token into the extension's **Desktop client** panel, then click **Connect / refresh models**.
4. Select a model and effort. Open a normal website and click **Summarize page**. The loading/result section appears in the original tab even if the popup closes.

The desktop window accepts explicit CLI paths when GUI launch cannot find a provider in PATH. It shows per-provider discovery errors. Settings and the random pairing token live in the app's per-user data directory as a private file. Rotating the token invalidates old pairing; paste the new token into the extension. Changing the port requires updating the extension setting. Closing the window stops the service.

## Protocol and limits

The authenticated supporting endpoint `GET /capabilities` returns `protocolVersion: 1`, provider status, models, effort values, and limits. The one business endpoint is `POST /ExecutePrompt` with `{ "prompt": string, "model": string, "effort": string }`. Supply `Authorization: Bearer <pairing token>`. With `Accept: application/x-ndjson`, the response contains `started`, periodic `heartbeat`, and one terminal `result` or `error` frame. Otherwise a successful response is JSON with `output`, canonical model, provider, effort, request ID, and duration. The service binds only to loopback, validates Host and extension Origin, and rejects invalid model/effort combinations. Browser host permission is limited to `http://127.0.0.1/*` for this service.

Initial limits: 1 MB JSON body, 500 KB prompt, 1 MB final answer, 240 seconds per inference, and two concurrent jobs. Oversized pages are reported without truncation. Provider context limits may be lower. Model lists reflect what the installed CLIs expose; friendly aliases `claude-sonnet5`, `codex-sol6`, and `codex-luna5.6` map only to discovered models. The settings schema supports explicit local model entries absent from discovery, but the desktop UI does not yet edit them.

## Privacy and execution

Summarization starts only when clicked. The extension clones the page body and removes scripts, forms, controls, hidden nodes, and its prior summary panel. Remaining HTML may contain personal data visible on the page, so review the page before summarizing. It is sent to the selected AI provider through the local app. The result is inserted as text, never trusted HTML. Pairing credentials are stored in extension-local storage; only the extension background performs network requests. The website cannot read extension storage directly. The client does not log prompts, HTML, or model output.

Claude requests disable tools, MCP servers, personal setting sources, hooks, slash commands, and session persistence. Codex runs in a disposable directory with a read-only sandbox, ignored user config, no project instructions, and shell/browser/apps/plugins/hooks disabled. The summary prompt tells the model to treat HTML as data. Provider CLI changes may add capabilities, so hostile webpage prompts still need regression testing. Prompts are passed by stdin, never interpolated into shell commands.

## Commands and verification

From `apps/client`: `bun run typecheck`, `bun test`, `bun run build`, `bun run pack`, `bun run dist:mac`, and `bun run dist:win`. Windows packages must be built and smoke-tested on Windows. An unsigned macOS package is suitable for local testing but may need an OS override to launch on another Mac. Verification results and remaining manual checks live in the [tracker](../plan/main.md).
