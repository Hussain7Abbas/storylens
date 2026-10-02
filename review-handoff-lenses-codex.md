# Codex continuation — lenses implementation and review

2026-10-02. Continuation of [Claude’s handoff](review-handoff-lenses-phases-1-7.md). Everything remains in the existing working trees; no commits, version bumps, tags, pushes, store submissions or deployments were made. Preserve the original Claude/user changes when committing. Commit each changed submodule first, then update umbrella pointers.

## Implementation

Phases 9 and 10 are implemented and automatically verified. The [tracker](pricing-plan/main.md) and phase files distinguish that completion from the live release checks that remain in [phase 11](pricing-plan/11-legal-release-and-docs.md).

- Extension source selection preserves configured Desktop pairings. Cloud uses feature-keyed prompts, bounded background NDJSON/JSON fetch, serialized failures and owner-scoped cancellation. One action ID spans a paid first attempt and one free parse/validation/language correction; a failed correction retains a usable paid answer. All six feature call sites use the selected source. New selectors do not call the legacy route.
- Cloud summaries send cleaned visible text, excluding controls, scripts, CSS-hidden nodes and extension UI, and refuse oversized prompts. Desktop keeps cleaned HTML. Optional novel research uses the parent action’s source and preserves its cached lens budget.
- Pricing/balance/notices are persisted and account-scoped. Late responses cannot overwrite another account’s balance. Completion refreshes the authoritative balance after streamed frames, preventing concurrent action snapshots from leaving stale values.
- The navbar has balance, Sync status, ⋮ menu and Back. Cloud action prices update live; Use AI starts off for both sources. Insufficient lenses opens the website Balance page; guests can open registration. Error forms keep a Get lenses link. Character images disclose the revised prompt and any priced first-time research.
- Main-popup trial gifts, admin gifts and purchases celebrate together. A background lease prevents simultaneous popups from duplicating notices; failed acknowledgement retries on a later refresh. Refunds/adjustments and selection/extraction views do not celebrate. Confetti is bundled/lazy, skips reduced motion and uses the palette/sparkle.
- First install opens the website profile; updates do not. The existing account bridge and Desktop account sharing remain intact.

## Review corrections

- Website sign-out marks the in-flight departure before awaiting logout, so automatic reconciliation cannot adopt the extension’s account during that wait. Reconciliation keys include the full held state. `safeNext` rejects normalized/encoded traversal outside the locale profile routes.
- A top-up request reuses its ID after an unknown network outcome only while the complete payload is unchanged. Editing that payload gets a new ID.
- The real Chrome service-worker rehearsal caught an `Illegal invocation` before every Cloud request: native `fetch` was called with the transport dependency object as its receiver. The background now supplies a wrapper that calls worker `fetch` correctly; all six feature routes and cancellation passed afterward.
- Website balance snapshots now carry their account ID. Account switches hide the old balance while loading, remount billing forms/history and celebrations, and clear the old notice. A delayed-response regression checks that the new account sees its own gift after the previous account's dialog was acknowledged.
- The password-change unit fixture now models web-session deletion, matching the actual implementation; the entire live backend suite passed afterward.
- Pricing reserves its table area while loading/failing. This fixed the Arabic FAQ layout jump caught by Lighthouse and added a browser regression check for both languages.
- Privacy 1.3.0 and Terms 1.2.0 drafts match the sources, including provider fallback, website cookies, billing contacts, anonymous events, 400-day completed AI usage cleanup and separately retained ledger/contact records. Both languages, inventory, changelog and store copies are synchronized.
- Store listing/disclosures, instructions, architecture/setup/compatibility guides and `v3.4.0` draft changelog are updated. All six `CLAUDE.md` files remain exactly `@AGENTS.md`.
- Both language production-build captures passed their real highlighting/replacement/offline-edit assertions. Ten store PNGs, both MP4/SRT files, twenty responsive website WebPs and both website MP4/WebVTT files were refreshed together. Captures use a disposable profile, external DNS/request blocking and fictional offline billing fixtures; no paid AI call or production write occurs. Existing extension package versions remain 3.3.1 until release.

## Verification

| Check | Result |
| --- | --- |
| `bun run typecheck`, backend/extension/client/website/dashboard | All five pass |
| Backend full suite with disposable `storylens_lenses_test` | 178 passed, 0 failed |
| Backend dated-deprecation scan | Pass; legacy selector removal 2027-01-31 |
| Extension complete Bun suite | 354 passed, 0 failed |
| Desktop client complete Bun suite | 33 passed, 0 failed |
| Extension production builds | Chrome MV3 and Firefox MV2 pass |
| Changed extension source Biome | Pass |
| Website Biome and production static/security-header build | Pass |
| Website complete Playwright suite | 370 passed; 18 explicit browser/feature skips |
| Refreshed website gallery/caption/playback checks | 12 passed; 4 explicit non-Chrome playback skips |
| Follow-up website account/billing checks | 59 Chromium checks pass; new account-switch regression passes Chromium, Firefox, WebKit and mobile |
| Local extension/website/dashboard/API/database rehearsal | 11 scenario groups pass with simulated AI and local email logs; 7 AI actions / 13 provider-call records; final ledger audit has no mismatches |
| Dashboard Biome, production build and complete Playwright suite | 84 passed; 2 explicit live-API skips |
| Lighthouse home en/ar, privacy en, pricing en/ar | Performance/accessibility/SEO all 100; CLS 0–0.0153, LCP 1141–1168 ms. Strict best-practices budget still fails at 96 because the live API returns anonymous auth 401 and unreleased billing 404 console errors. Budgets were not weakened. Reports are in website `.lighthouseci/reports/` (ignored). |
| Whitespace and compatibility-pointer check | `git diff --check` clean in root/changed submodules; all `CLAUDE.md` pointers verified |

The extension suite adds stream/error/headers/JSON-cap tests, owner cancellation, source/availability/account cache checks, same-action corrections, cleaned summaries, Arabic labels and real React controls/notices. The new [local browser rehearsal](docs/lenses-local-e2e.md), `node scripts/lenses-e2e.mjs`, exercises real cookies, the extension bridge and worker, HTTP routes, dashboard forms and PostgreSQL. It covers registration/trial, guest handoff, both account choices, shared sign-out, WhatsApp approval, Telegram rejection, separate notice acknowledgement, gifts/corrections, all six Cloud background routes, free second attempts and cancellation refunds. Emails stay in the development log and AI replies are simulated. It uses Node for Playwright (as the store captures do) and Bun for builds/API; a Bun-hosted Playwright attempt stalled after cancellation, so it was stopped and its disposable database audited and removed. The final Node runs passed, removed their databases and closed their services. Production builds were restored afterward. Latest evidence: `/tmp/storylens-lenses-e2e-followup-result.json` and `/tmp/storylens-lenses-e2e-followup-audit.json`.

These checks do not establish real provider quality, Desktop execution, Google OAuth/password/email-change UI, every feature's reading UI, old packaged-extension compatibility, migration behavior on production data, actual payment receipt or email delivery. All five typechecks passed again after the follow-up fixes.

## Owner release items

1. Review legal/store drafts and obtain a native Arabic review. Website `AGENTS.md` requires owner review before first publication of public legal decisions.
2. Configure dedicated OpenRouter credits/limit, Resend/domain and billing notification address. Run the real paid `make ai-smoke` and record costs/data policy. Keep Cloud off until ready.
3. Rehearse migrations and ledger audit on a production copy; check custom dashboard role permissions. Grant prior readers’ trial gifts through the reviewed dry-run/confirmation workflow.
4. Finish Google OAuth/password/email-change UI, each Cloud/Desktop reading feature with real providers, actual payment/email delivery, old packaged-extension compatibility and the complete dark/RTL matrix. Local account handoff, both choices, billing approval/rejection, per-surface notices and Cloud transport/ledger/cancellation have passed the isolated rehearsal.
5. Review and commit working trees/submodule pointers. Follow phase 11’s release order: owner release, immediately deploy backend and dashboard, verify website, enable Cloud, then verify the published extension after store review. Versions and release state have not changed.
6. Recheck Lighthouse against the deployed billing API; expected anonymous 401 remains a console-based best-practices limitation of the current header account check.
