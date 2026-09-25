# Phase 4 — Extension pairing and transport

[Global tracker](main.md) · **Status: In progress** · **Estimate: 5 points** · **Dependencies: phase 3**

## User story

As a reader, I want to pair the extension with the desktop client and choose a model/effort so browser actions use my preferred provider.

## Existing integration points

- `apps/extension/src/entrypoints/background/index.ts`: worker and proxy handlers.
- `apps/extension/src/entrypoints/background/messaging.ts`: typed internal messaging.
- `apps/extension/src/entrypoints/popup.settings/general-tab.tsx`: settings UI.
- `apps/extension/wxt.config.ts`: browser host permissions.
- `apps/extension/public/locales/en.json` and `ar.json`: runtime translations.

Create a dedicated desktop-client module alongside extension libraries. Keep its protocol separate from the backend's generated Orval client and authentication state.

## Tasks

- [x] Add localized port/token settings, password masking, connect/test action, and disconnected/ready/error states.
- [x] Fix destinations to `http://127.0.0.1:<validated-port>`; reject arbitrary remote URLs. Never put tokens in query parameters.
- [x] Store credentials in extension-local storage, never sync storage, page DOM, logs, or content-script message payloads.
- [ ] Restrict credential storage to trusted extension contexts where supported. Keep token reads/network calls in the background; document the Firefox-compatible storage approach.
- [x] Fetch capabilities and validate schemas/protocol version; one provider error must not hide another usable provider.
- [x] Populate model and dependent effort selectors from the catalog. Changing a model selects a valid effort default.
- [x] Persist canonical model/effort locally. If a saved model disappears, require a new selection rather than silently substituting one.
- [ ] Add typed connection, capability, execution, and cancellation messages; validate senders/payloads and avoid generic external/window-message command bridges.
- [x] Add narrow production/development loopback host permissions and any necessary CSP changes; verify Chrome and Firefox behavior.
- [x] Implement authenticated fetch with cancellation, bounded deadline/output, and an incremental NDJSON parser handling split UTF-8/frame boundaries.
- [ ] Translate transport, pairing, protocol, validation, provider, and timeout errors into actionable messages.
- [ ] Implement phase 0's verified browser lifecycle mechanism. Request ownership outlives the popup but responds to document teardown/cancellation.
- [x] Make connection setup and summarization independent of backend login, novel recognition, and offline-sync state. Expose access during onboarding if existing routing otherwise gates it.

## Acceptance criteria

- [ ] A reader can pair, test, and select a catalog model/effort without editing files.
- [ ] Stale token, stopped client, protocol mismatch, removed model, and one missing provider have actionable UI states.
- [ ] Tokens never appear in messages to content scripts or in the page DOM.
- [ ] Requests survive popup closure on supported Chrome/Firefox versions within the deadline.
- [ ] Malformed, incomplete, oversized, or multiple-terminal streams fail safely.
- [ ] Existing backend proxying, settings, and offline sync continue working.

## Validation record

Chrome popup pairing/model selection and background transport implemented. Playwright Chromium extension test connected to the packaged app and received the summary after popup closure. **Open:** Firefox runtime test and storage access isolation beyond browser extension context.
