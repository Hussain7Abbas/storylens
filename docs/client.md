# Story Lens Client

[Documentation index](intro.md) · [Development](development.md)

`apps/client` is an Electron desktop companion for macOS and Windows. It starts an authenticated HTTP service on `127.0.0.1:43127` and runs the locally installed Claude Code or Codex CLI in headless mode. The extension's page launcher uses it for three actions: **Summarize page** sends the active HTTP(S) page body to the selected provider and displays the returned plain text at the top of that page, the selection panel’s **Use AI** option sends a picked name with nearby page text and the category/nature list to suggest a new character's description, category, and nature, and **Extract chapter characters** sends up to 120,000 characters of chapter text with the category/nature list and the novel's known names to list new characters. The Elysia backend is not involved.

## Setup

1. Install and sign in to [Claude Code](https://code.claude.com/docs/en/setup) and/or [Codex CLI](https://learn.chatgpt.com/docs/codex/cli). At least one provider must be available.
2. From the umbrella repository, run `make install` and `make dev-client` for development. Run `make client-pack` for an unpacked app, `make client-dist-mac` for a macOS DMG, or `make client-dist-win` on Windows for an NSIS `.exe` installer. Packaged use does not require Bun but still needs the provider CLI and its login.
3. Keep the desktop companion running (its window may be closed when **Keep in system tray** is enabled). Copy its pairing token into the extension's **Settings → AI** tab, then click **Connect / refresh models**.
4. Select a model and effort. On a supported novel site, hover the page launcher and click **Summarize page**, or **+** to pick a name and enable AI in the selection panel. The summary's loading/result section appears at the top of the page.

The desktop window accepts explicit CLI paths when GUI launch cannot find a provider in PATH. It shows per-provider discovery errors. Settings and the random pairing token live in the app's per-user data directory as a private file. Rotating the token invalidates old pairing; paste the new token into the extension. Changing the port requires updating the extension setting. **Keep in system tray** defaults to on and persists across launches, including existing installations. Closing the window hides it while the local service remains available. Use the tray’s **Open Story Lens** menu item (or double-click its icon) to return, and **Quit Story Lens** to stop it. Turning the setting off and saving restores quit-on-close. If the OS tray cannot be created, closing quits rather than leaving an unreachable background process. A tray-only settings change does not restart the service or interrupt requests.

The desktop interface shares the Ink & Iris palette, self-hosted Inter font, and Lucide icons with the extension and website. Appearance offers System, Light, and Dark and remembers the choice locally. Status refreshes preserve unsaved settings edits; actions show busy states and report errors. The approved Lensbook mark is used in the window, system tray and packaged app icons; see [Branding](branding/README.md).

## Protocol and limits

The authenticated supporting endpoint `GET /capabilities` returns `protocolVersion: 2`, provider status, models, effort values, and limits. The one business endpoint is `POST /ExecutePrompt` with `{ "prompt": string, "model": string, "effort": string, "responseLanguage": "en" | "ar" }`. The extension sets `responseLanguage` from its selected language; the client includes that instruction in the provider request and echoes the value in its result. Supply `Authorization: Bearer <pairing token>`. With `Accept: application/x-ndjson`, the response contains `started`, periodic `heartbeat`, and one terminal `result` or `error` frame. Otherwise a successful response is JSON with `output`, canonical model, provider, effort, response language, request ID, and duration. The service binds only to loopback, validates Host and extension Origin, and rejects invalid model/effort combinations. Browser host permission is limited to `http://127.0.0.1/*` for this service. Update the extension and client together when moving from protocol 1 to 2.

Initial limits: 1 MB JSON body, 500 KB prompt, 1 MB final answer, 240 seconds per inference, and two concurrent jobs. Oversized pages are reported without truncation. Provider context limits may be lower. Model lists reflect what the installed CLIs expose; friendly aliases `claude-sonnet5`, `codex-sol6`, and `codex-luna5.6` map only to discovered models. The settings schema supports explicit local model entries absent from discovery, but the desktop UI does not yet edit them.

## Privacy and execution

Summaries and keyword suggestions start only when clicked. The extension clones the page body and removes scripts, forms, controls, hidden nodes, and its prior summary panel. Remaining HTML may contain personal data visible on the page, so review the page before summarizing. It is sent to the selected AI provider through the local app. A keyword suggestion sends only the picked text, up to 1,500 characters on each side of it, and the category and nature names and descriptions; a chapter extraction sends the chapter text, those lists, and the novel's known character names. The result is inserted as text, never trusted HTML. Pairing credentials are stored in extension-local storage; only the extension background performs network requests. The website cannot read extension storage directly. The client does not log prompts, HTML, or model output.

Claude requests disable tools, MCP servers, personal setting sources, hooks, slash commands, and session persistence. Codex runs in a disposable directory with a read-only sandbox, ignored user config, no project instructions, and shell/browser/apps/plugins/hooks disabled. Codex catalog discovery initializes the app server before requesting its models and runs with the located CLI's directory on PATH, including when the desktop app starts with a minimal GUI PATH. The summary prompt tells the model to treat HTML as data. Provider CLI changes may add capabilities, so hostile webpage prompts still need regression testing. Prompts are passed by stdin, never interpolated into shell commands.

## Commands and verification

From `apps/client`: `bun run typecheck`, `bun test`, `bun run build`, `bun run pack`, `bun run dist:mac`, and `bun run dist:win`. Windows packages must be built and smoke-tested on Windows. An unsigned macOS package is suitable for local testing but may need an OS override to launch on another Mac. Record verification results and remaining platform checks alongside release work.

The desktop settings window links to the website, privacy policy, and terms in the system browser. The main process allows only those exact HTTPS URLs and continues denying external Electron windows.

The wiki crawler (`src/backend/api.ts`) uses the Story Lens session the extension shares through `POST /AccountSession`. The shared `apiUrl` is the API origin; requests go to its reader API under `/api/user` with the reader's bearer token, so the reader's role permissions apply.
