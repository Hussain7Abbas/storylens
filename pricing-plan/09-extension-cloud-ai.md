# Phase 9 — Extension: AI source and cloud transport

[Global tracker](main.md) · **Status: Implemented and automatically verified (not committed); live provider check pending** · **Estimate: 6 points** · **Depends on: phase 4; D3, D4, D5, D15** · **Ships in: 3.4.0**

## Goal

Every AI action in the extension can run on **Story Lens Cloud** (the phase 4 routes, paid with lenses) or on the **desktop companion** (unchanged, free). The reader picks the source in **Settings → AI** (D3). The prompts stay the extension's own (D4), so the reader's keyword and image prompts apply to both sources. This phase builds the plumbing and the error handling; phase 10 adds prices, the balance, the top-up redirect and celebrations.

## Current state (for reference)

- `src/lib/desktop-client/` owns the AI transport (`background.ts`), the prompt builders, `executeLocalizedPrompt` (with one language-correction retry), `ensureNovelContext`, and the settings (`storylens-desktop-client`).
- Gating is `isAiConfigured(settings)` (pairing token, model and effort) and `useAiConfigured()`. They are used in `content/page-popup-launcher.ts`, `popup/selection-view.tsx`, `popup.home/tabs/coloring/coloring-tab.tsx`, `use-keyword-suggestion.ts`, `popup.extract/extraction-view.tsx`, `components/generate-image-button.tsx`, `components/node-selector/node-selector-form.tsx`, `utils/detect-chapter-selectors.ts` and `lib/desktop-client/selector-provider.ts`.
- Background messages: `executeDesktopPrompt`, `generateDesktopImage`, `cancelDesktopPrompt`.

## Tasks

### 9.1 AI source setting

- [x] `src/lib/ai-source/source.ts` (free of `#imports`, so tests do not hit the `#imports` mock leak): `type AiSource = "cloud" | "desktop"`, `AI_SOURCE_KEY = "storylens-ai-source"`, `parseAiSource(stored, desktop)`. With nothing stored: `desktop` when the desktop settings are configured (existing paired installs keep working as before), otherwise `cloud`.
- [x] Storage helpers in a separate module that imports `browser`.
- [x] **Settings → AI** (`popup.settings/ai-tab.tsx`): a segmented control at the top, **Story Lens Cloud** / **Desktop companion**, each with one line: "Uses lenses. Runs on Story Lens servers through OpenRouter." and "Free. Uses your own Claude or Codex on this computer." Below it, the selected source's panel:
  - *Cloud*: account status (signed in, guest, signed out), availability (from `GET /billing/pricing` `cloudAi.enabled`), and what is sent where (page text, chapter text, the reader's prompts → Story Lens API → OpenRouter → Google Gemini; character briefs → ByteDance Seedream), with a privacy policy link. Phase 10 adds the balance and the price list here.
  - *Desktop*: today's pairing, model and effort panel, unchanged.
  - The **AI prompts** section stays below both, since prompts apply to both sources.
- [x] Track `ai_source_changed` with `source`.

### 9.2 Availability (replaces `isAiConfigured` at call sites)

- [x] `src/lib/ai-source/availability.ts` (pure): `aiAvailability({ source, desktop, user, pricing })` →
  - `{ ok: true }`, or
  - `{ ok: false, reason }` with `reason` one of `desktop-unpaired` (today's message `desktop.configureAi`), `signed-out`, `guest`, `cloud-off` (`cloudAi.enabled` false or pricing unreachable), `feature-off` (that feature's record is disabled).
- [x] `useAiAvailability(feature)` replaces `useAiConfigured()`: one Jotai atom fed by storage changes to `storylens-ai-source`, `storylens-desktop-client`, `storylens-auth` and `storylens-ai-pricing` (cached by phase 10's pricing refresh; until then, fetched on popup open).
- [x] Content scripts (the launcher) read the same four storage keys and call `aiAvailability` directly.
- [x] Each disabled AI control keeps the existing pattern (`data-disabled` inside a Tooltip) with the reason's localized text: "Create a free account to use Story Lens Cloud", "Sign in to use Story Lens Cloud", "Story Lens Cloud is not available right now", "This AI feature is turned off", or the existing desktop message.
- [x] Keep `isAiConfigured` for desktop-only checks (pairing UI, the desktop path itself).

### 9.3 Cloud transport (background)

- [x] `src/lib/cloud-ai/frames.ts` (pure): reuse `readResultFrame` from `job-stream.ts` for NDJSON (it already handles `type`, `output`, `mimeType`, `data`, `error`); read the extra fields (`balance`, `lensesCharged`, `refunded`, `revisedPrompt`).
- [x] `src/lib/cloud-ai/errors.ts` (pure): map HTTP errors and error frames to a serializable `CloudAiFailure { code, message, details }`: `INSUFFICIENT_LENSES` (`required`, `balance`), `REGISTERED_ACCOUNT_REQUIRED` and plain 403 for a guest, 401 (`signed-out`), `AI_UNAVAILABLE`, `AI_FEATURE_DISABLED`, `PROMPT_TOO_LARGE` (`maxChars`), `AI_RATE_LIMITED` (`retryAfterSeconds`), `NOVEL_CONTEXT_EXISTS`, `ACTION_NOT_RETRYABLE`, the stream codes with `refunded`, network failures, and 404 on the routes (an API older than this extension: "Story Lens Cloud is not available yet. Try again later.").
- [x] `src/lib/cloud-ai/background.ts`:
  - `executeCloudPrompt({ requestId, actionId, attempt, feature, prompt, responseLanguage, novelId? }, owner)` → `POST {WXT_API_URL}/api/user/ai/prompts` with `Accept: application/x-ndjson`, the stored bearer token and `Accept-Language`. Axios cannot stream here, so this is a `fetch`; it must still send `X-Client-Version` (reuse the helper in `src/api/client-compat.ts`) and handle 426 the same way (trigger the existing store update check).
  - `generateCloudImage({ requestId, actionId, prompt }, owner)` → `POST /api/user/ai/images`.
  - Cancellation: an `AbortController` per `requestId`, keyed by owner like the desktop jobs (`cancelTabPrompts`, `cancelPrompt`), so closing a tab or form cancels the request and the server refunds it.
  - Time limits: 180 s for text, 300 s for images; heartbeats reset nothing (the server sends the result or an error).
  - After every `started`, `result` and `error` frame with a `balance`, write `storylens-lens-balance` (phase 10 reads it).
  - Results cross the messaging boundary as a union, `{ ok: true, value } | { ok: false, failure }`, because thrown errors lose their fields in messaging; the caller rethrows a typed `CloudAiError`.
- [x] Background messages (`src/entrypoints/background/messaging.ts`, `index.ts`): `executeAiPrompt` (routes by source to the desktop or cloud function), `generateAiImage`, `cancelAiPrompt`. Accept the same senders the desktop messages accept (Story Lens content scripts and extension pages, keyed by tab or the shared extension-page owner). The old desktop message names can be removed: content scripts, pages and background ship together.

### 9.4 Prompt runner

- [x] `executeLocalizedPrompt` (`src/lib/desktop-client/localized-prompt.ts`, or move it to `src/lib/ai-source/`) takes `feature` and the source:
  - one `actionId` per call, `attempt` 1 and 2 for the language-correction retry (desktop keeps one `requestId` per attempt, as today);
  - for cloud, when attempt 2 fails, return attempt 1's parsed result instead of failing (the reader paid for attempt 1);
  - when attempt 1's answer does not parse (`parse` throws), use attempt 2 with the correction text "Your previous answer was not valid JSON…" before giving up; cloud attempt 2 is free.
- [x] Settings objects no longer need to be passed around for cloud; desktop calls still read model and effort.

### 9.5 Call sites (feature keys)

| Entry point | File | Feature | Cloud-specific changes |
| --- | --- | --- | --- |
| Summarize page | `lib/desktop-client/page-summary.ts`, launcher | `page_summary` | Send page **text**, not HTML: same cleaned clone, then text with block breaks. Refuse pages over the feature's `maxPromptChars` with "This page is too long for Story Lens Cloud (N characters)" instead of truncating. Disclaimer names the source. The desktop path keeps HTML and its 500 KB limit. |
| Use AI in the selection panel, then the form | `popup.home/tabs/coloring/use-keyword-suggestion.ts` | `keyword_suggestion` | — |
| Extract chapter characters | `popup.extract/extraction-view.tsx` | `chapter_extraction` | Check the built prompt against `maxPromptChars` before sending |
| Novel context research | `lib/desktop-client/novel-context.ts` (`ensureNovelContext`) | `novel_context` | Send `novelId`. Treat `NOVEL_CONTEXT_EXISTS` as "reload the novel and use its context". Skip research (continue without context) when the reader cannot afford it; never block the action that asked for it (existing rule). |
| Website selector auto-detect | `utils/detect-chapter-selectors.ts`, `lib/desktop-client/selector-provider.ts` | `selector_detection` | Provider order: the selected source when available (cloud uses the extension's own prompt and page validation, `selector-detection-runner.ts`); the legacy backend route is no longer called (D15). Guests without a desktop pairing get the `guest` reason. Check first who may save website selectors; if guests cannot, nothing is lost. |
| Generate image | `components/generate-image-button.tsx` | `character_image` | `generateAiImage`; the result becomes the form's file exactly as today; show `revisedPrompt` in a "What was drawn" disclosure under the image. |

- [x] Errors shown in each place use the mapped failures. Phase 9 shows plain messages for `INSUFFICIENT_LENSES`; phase 10 adds the redirect.
- [x] Analytics: add `provider` (`cloud` or `desktop`) to `ai_summary_requested`, `ai_keyword_suggestion_requested`, `ai_chapter_extraction_requested`, `ai_image_generation_requested`, `ai_novel_context_generated`; send `effort` only for desktop. `ai_selector_detection_requested` keeps `provider` with the values `cloud` and `desktop`. Update the catalog in `apps/extension/AGENTS.md` in the same change.

### 9.6 Desktop sharing

- [x] `shareAccountSession()` keeps sharing the session with the desktop client; nothing in the client changes. The desktop crawler stays desktop-only (D3).

## Tests (`apps/extension/test/`)

Keep the tested logic in modules without `#imports`, and always run the full `bun run test` (the `#imports` mock leak).

| # | Test | Expected |
| --- | --- | --- |
| 1 | `parseAiSource` with nothing stored and desktop configured / not configured; stored values | `desktop` / `cloud`; stored value wins |
| 2 | `aiAvailability` for every reason | Correct `ok` and `reason` |
| 3 | Cloud transport with a fake fetch streaming `started`, `heartbeat`, `result` | Result returned; balance written |
| 4 | Error frames with and without `refunded`; HTTP 402, 403, 401, 413, 429, 503, 404, 426 | Mapped failures with details; 426 triggers the update check |
| 5 | Cancel by request ID and by closing the owner tab | Fetch aborted |
| 6 | `executeLocalizedPrompt` on cloud: wrong language, then correct | Two requests with the same `actionId`, attempts 1 and 2 |
| 7 | Attempt 2 fails | Attempt 1's result returned |
| 8 | Unparseable first answer | Second attempt with the JSON correction |
| 9 | Summary text extraction | Scripts, forms and hidden nodes removed; block breaks kept; oversized page refused before sending |
| 10 | `ensureNovelContext` on cloud: success, `NOVEL_CONTEXT_EXISTS`, cannot afford | Saved; reloaded context used; continues without context |
| 11 | Selector provider order | Cloud when cloud is selected and available; desktop when desktop is selected; no legacy route call |
| 12 | Image on cloud | File handed to the form; `revisedPrompt` shown |
| 13 | UI (`test/ui/`): Settings → AI source switch | Panels switch; choice stored; event tracked |
| 14 | UI: disabled AI controls for each reason | Tooltip text matches the reason |
| 15 | Full suite | `bun run test` passes |

## Exit criteria

- [x] `bun run typecheck`, `bun run test` and `bun run build` pass in `apps/extension`; Firefox build too (`bun run build:firefox`).
- [ ] Manual: against a local backend with a fake or development OpenRouter key, run each feature on cloud and on desktop.

## Docs and instructions

- `docs/extension.md`: the AI source, what each source sends where, cloud errors.
- `apps/extension/AGENTS.md`: replace the "`isAiConfigured()` / `useAiConfigured()`" rule with `aiAvailability()` / `useAiAvailability(feature)`; every AI request names its feature key; cloud requests go only through `executeAiPrompt`/`generateAiImage`; the analytics catalog.
- `docs/client.md`: the desktop companion is the free alternative to Story Lens Cloud.

## Risks

| Risk | Mitigation |
| --- | --- |
| Readers on cloud expect the desktop's HTML-based summaries | Text summaries are cheaper and usually better; the disclaimer says which source ran |
| Existing desktop users silently switched to paid cloud | Paired installs default to Desktop; the switch is explicit |
| New extension meets an old API during store review | 404 on the cloud routes maps to "not available yet"; desktop keeps working |
| Streaming fetch differences in Firefox's background | Test the Firefox build; fall back to JSON mode (`Accept: application/json`) when `response.body` is not readable |

## Implementation notes

Source/availability, feature-keyed Cloud transport, owner cancellation, bounded NDJSON/JSON fallback and one-action corrections are implemented. Research uses the parent action’s source and skips optional spending that would exhaust its cached budget. Cloud summaries remove form controls and CSS-hidden content. New selectors never use the legacy route. The pure transport/prompt/controller tests and full UI suite cover errors, refunds, cancellation, corrections, source switching and Arabic plurals. Real provider/desktop feature checks remain in phase 11.

## Verification log

| Date | Check | Result | Evidence |
| --- | --- | --- | --- |

| 2026-10-02 | Extension typecheck, full suite, Chrome and Firefox production builds | Pass | 354 tests; `test/cloud-ai.test.ts`, `test/ui/components.test.tsx`; WXT Chrome MV3 / Firefox MV2 builds |
| 2026-10-02 | Real Chrome worker → local API → PostgreSQL | Pass with simulated provider | `node scripts/lenses-e2e.mjs`: all six background feature routes, same-action free corrections and cancellation/refund. Fixed native worker `fetch` receiver; final audit has zero mismatches. Reading UI/real provider/Desktop checks remain in phase 11. |
