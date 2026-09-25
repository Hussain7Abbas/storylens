# Phase 5 — Summarize the active page

[Global tracker](main.md) · **Status: In progress** · **Estimate: 5 points** · **Dependencies: phase 4**

## User story

As a reader, I want to click Summarize and read the result at the top of my current webpage so I can quickly understand its contents.

## Intended flow

1. Reader selects a paired model/effort and clicks **Summarize**.
2. Popup captures the active tab ID once and asks that content script to start.
3. Content script clones `document.body`, prepares the prompt with the extension's selected response language, creates a loading section, and requests execution from the background.
4. Background reads the token and calls `POST /ExecutePrompt`.
5. Content script replaces loading text with the answer or error only if the result still belongs to that document/navigation.

The explicit action works on HTTP(S) pages without novel detection. Popup closure does not cancel it. Results stay with the originating page when active tabs change.

On a domain with a configured website selector, the content script also displays a top-right circular launcher. It opens the same extension popup in a page overlay; it is not a prerequisite for summarization, which remains available from the browser toolbar on other sites.

## Tasks

- [x] Add a localized **Summarize** control independent of novel selection, with connection/model guidance when unavailable.
- [ ] Capture original tab/document identity and a request ID. Explain unsupported schemes and pages where content scripts cannot run.
- [x] Add a dedicated body-capture helper; do not change existing `sanitizePageHtml()` behavior for unrelated consumers.
- [x] Clone the body without altering the site. Omit scripts, styles, noscript, embedded frames/objects, form controls, hidden sensitive fields, and prior Story Lens summary UI; retain readable semantic body HTML.
- [x] Remove event-handler attributes and avoid control values, form submissions, and cookies. Do not claim generic sanitization removes every private detail from page content.
- [x] Explain that clicking Summarize sends page content through the desktop client to the selected provider; do not add a redundant confirmation after the explicit click.
- [x] Enforce negotiated prompt byte limits and report oversized pages without silent truncation. Chunking is deferred.
- [x] Prompt for a concise summary in the extension's language, covering main events/ideas, names, and relationships without invention. Treat HTML as source material rather than instructions and request plain text.
- [x] Prepend one accessible summary section as the first child of `document.body`, with shadow/isolated styles that avoid website/highlighting collisions.
- [x] Render output using text nodes/`textContent` only, with readable whitespace, English/Arabic direction, heading, loading, success, and error states. Never insert model-returned HTML.
- [x] Add close/retry controls. Closing an active panel cancels the request; retry takes a fresh capture/request ID.
- [x] Deduplicate in-flight requests per document. Subsequent summaries replace the prior section and never include that section in the next prompt.
- [x] Cancel/clear stale work on teardown and SPA navigation using WXT content-context/location-change facilities; guard against late results even when cancellation races.
- [ ] Verify highlighting, replacement, novel detection, and selector refresh do not remove or process summary shadow content.
- [x] Show the circular launcher only when a selector is available; embed the popup page in a shadow-DOM overlay and close it on outside click, Escape, or navigation.

## Acceptance criteria

- [ ] On a supported non-novel page, the button sends sanitized body HTML and a summary instruction to the chosen provider.
- [ ] Success appears at the beginning of the original page after popup closure.
- [ ] HTML/script-like model text renders literally without executing markup.
- [ ] Navigation, tab closure, panel closure, and retry cannot let an old request overwrite a new result/document.
- [ ] Oversized/restricted pages, client failures, and provider errors have clear explanations and retry/setup paths.
- [ ] English/Arabic labels, direction, keyboard controls, and loading announcements work.

## Validation record

Implemented cloned body capture, form/script removal, English/Arabic prompt and required `responseLanguage`, shadow DOM result panel, retry/close, and SPA cancellation guard. Playwright Chromium summary of a non-novel article passed after popup closure. A separate Chrome smoke check confirmed the launcher stays hidden without a cached selector and opens/closes the embedded popup when one is available. **Open:** manual novel/form/SPA/restricted-page and Firefox checks.
