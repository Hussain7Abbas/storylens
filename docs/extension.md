# Browser extension

[Documentation index](intro.md) · [Development](development.md)

`apps/extension` is a WXT and React extension for Chrome and Firefox. The popup lets readers manage novels, keyword coloring, replacement rules, profile, and settings. The content script detects supported pages and applies reading features; the background service worker handles messaging, selector loading, API proxy requests, and synchronization.

The popup also offers a **AI** tab beside **Replaces**, available even without a detected novel. The popup opens on **Coloring** when a novel is selected (including once a detected novel finishes loading) or when page-picked search text is carried over, and on **AI** otherwise. After pairing, readers choose a discovered Claude/Codex model and effort, then click **Summarize page**. The content script captures the active page's body and shows loading, result, or error at its top. The background worker contacts the authenticated loopback service. See the [client guide](client.md) for setup, limits, and privacy behavior.

On a page whose domain has a website selector in the novel-site database or extension cache, a circular logo button with a brown border appears in the top-right corner by default. Drag it to move it; its position is saved in extension-local storage (`storylens-page-launcher-position`) across sites and reloads. Saved and dragged positions are clamped to the viewport, including after resizing. Within 10 px of the nearest viewport edge, the idle circle tucks against that edge with 3 px visible; moving the pointer within 10 px reveals it at its saved position. Dragging, keyboard focus, and an open popup keep it visible. **Settings → General → In site popup** controls Show/Hide, defaults to Show, and is saved in extension-local storage (`storylens-page-popup-visible`) with immediate updates across tabs. It opens the same extension popup in an overlay iframe; readers can use either this button or the browser toolbar icon. The popup chooses the available side and vertical direction, shrinks to fit the viewport, and scales its contents when narrower than the normal popup width. Inside the overlay, the popup fills the whole iframe instead of using the toolbar popup's fixed 24rem × 32rem size, so the tab panels reach the bottom of the overlay. The launcher is removed when the selector is unavailable and closes on circle click, outside click, Escape, or navigation; there is no separate close-button bar. The popup page and launcher icon are listed as web-accessible resources. The selected extension language is also sent as `responseLanguage` with each desktop AI request.

The popup's **Select text on page** button starts a one-time picker and closes the overlay. Hovering the launcher circle for 0.2 s also reveals a smaller **+** action circle, below the launcher in the top half of the viewport and above it in the bottom half, that starts the same picker; clicking the main circle still opens the popup. The action hides 0.3 s after the pointer leaves both circles, and while dragging or while the popup is open. It also appears when the launcher gets keyboard focus. Click a word or drag over a phrase; on release the in-page popup reopens with that text in both Characters and Replaces search inputs. Escape cancels selection. The picker can also be started from the browser toolbar popup on pages where content scripts run, including sites without a saved selector; choose a novel to view its results. Browser-internal pages cannot be picked.

Character and replacement searches tolerate small spelling mistakes and transposed letters while retaining partial-text matching. Character search includes alias names and version descriptions; replacement search includes both From and To. Online search loads all catalogue pages before filtering, and downloaded novels use the same matching locally. Add character and Add alias prefill Name from the trimmed search; Add replacement prefills From. Versions have no separate name, so Add version prefills Description. Existing edit forms keep their saved values.

## Main areas

- `src/entrypoints/` contains background and content scripts, popup screens, and options UI. The popup uses React Router, Mantine, Jotai, and TanStack Query.
- `src/components/`, `src/hooks/`, `src/store/`, and `src/utils/` contain shared presentation, state, and page logic.
- `src/api/generated/` contains Orval output from the backend OpenAPI spec. `orval.config.ts` writes endpoint functions, React Query hooks, and schemas; `src/api/axios-instance.ts` configures the Axios transport.
- `src/lib/offline/` uses Dexie to store downloaded novel data. Download, mutation hooks, a pending-operation queue, and sync code support reading and editing while offline. The background worker also schedules periodic sync.
- `src/i18n/messages/` holds extracted application translations. `public/_locales/` holds browser manifest messages. The content script's tooltip has its own localized strings and reads locale from extension storage.

`wxt.config.ts` declares extension permissions, host permissions, React and icon modules, and an API URL fallback. Set `WXT_API_URL` to the running backend when developing locally; see the port caveat in [Development](development.md). Build and distribution targets are in the extension `Makefile` and `package.json`.

See the [extension instructions](../apps/extension/AGENTS.md) for code conventions and offline change requirements. The [extension README](../apps/extension/README.md) has submodule commands.

## Account and synchronization

Registered users and admins can change their password from Profile, using the button above Logout. The form requires the current password, a new password of 8–72 characters, and matching confirmation. Guests do not see this action.

The navbar counts all queued changes, including uploads in progress and failed operations. Manual sync reports upload and download failures with server error details, including permission refusals; unresolved changes stay queued. Automatic sync stops retrying an operation after five failures, while clicking Sync explicitly retries failed operations. Keyword aliases and versions use their respective endpoints, and temporary IDs are mapped into queued dependent writes. Concurrent sync requests share the active run. Refreshes skip novels and lookups with unresolved writes so failed uploads cannot overwrite local edits. A successful sync timestamp is recorded only when no failures or queued changes remain. Failed immediate uploads show an error and retain the local change for retry.

Run sync regression checks with `bun test test/sync-engine.test.ts` from `apps/extension`.

## Chrome Web Store release

Bump `version` in `apps/extension/package.json`, commit, and push a matching `v<version>` tag, or run the **Publish to Chrome Web Store** workflow manually. `.github/workflows/publish-chrome.yml` runs `make install`, `make typecheck`, `make release-chrome`, and `make submit-chrome`, then connects to the server over SSH and runs `make set-review-version VERSION=<version>` in the backend checkout. The backend deploys itself after the store publishes that version; see [Backend](backend.md#deployment-and-review-version).

The first store listing must be created manually. The workflow needs these repository secrets: `CHROME_EXTENSION_ID`, `CHROME_CLIENT_ID`, `CHROME_CLIENT_SECRET`, `CHROME_REFRESH_TOKEN` (create them with `bunx wxt submit init`), plus `DEPLOY_SSH_HOST`, `DEPLOY_SSH_USER`, `DEPLOY_SSH_KEY`, optional `DEPLOY_SSH_PORT`, and `BACKEND_PATH`. The SSH script adds `~/.bun/bin` to `PATH`.
