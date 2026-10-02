# Handoff: lenses plan, phases 1–8 and 12 done, phases 9–11 next

**Continuation:** see [Codex review and completion](review-handoff-lenses-codex.md) for current phase 9–11 implementation, corrections, checks and owner release items. The notes below preserve the original Claude handoff.

For Codex, to review this work and continue. Nothing is committed; the work sits in the working trees of `apps/backend`, `apps/dashboard`, `apps/extension`, `apps/website` and the umbrella (`pricing-plan/`, `docs/`). Start from the tracker [`pricing-plan/main.md`](pricing-plan/main.md):
- **Decisions D1–D26** hold every owner request and answer from the planning and implementation sessions.
- **The completion checklist** marks a phase done once its tasks are verified; each phase file ticks its own tasks and records what stays open.

The earlier handoff [`review-handoff-lenses-settings-launcher-arabic.md`](review-handoff-lenses-settings-launcher-arabic.md) covers D24–D26 in detail: the dashboard Settings page with OpenRouter model pickers, the background AI form in the launcher, and diacritic-free Arabic matching.

## Done in this session

| Phase | What changed | Main files |
| --- | --- | --- |
| Plan sync | Every prompt and answer mapped to decisions and phases. New phase 12 (D25, D26). Stale per-feature model references fixed. Phase files ticked after code checks, each with notes and a verification log. | `pricing-plan/*` |
| 2 | Development seed gives each registered reader 25 lenses, idempotently. | `apps/backend/prisma/seed/tables/lenses.ts` |
| 3 | Billing emails show the coin PNG that the website hosts. | `apps/backend/src/lib/billing/emails.ts` |
| 5 | A verified password change ends the account's other website sessions; bearer sessions stay. Test added. | `apps/backend/src/routes/accounts.ts`, `test/web-session.test.ts` |
| 8 | On phones, text-only tables stack into label/value rows (`data-table-stack`), fixing axe `scrollable-region-focusable`. `package.json` reformatted (whitespace only). | `apps/dashboard/src/styles/globals.css`, `ai-settings.tsx`, `lens-dialogs.tsx` |
| 1 | Coin PNG export (`node docs/branding/scripts/export.cjs lens-coin`). Branding README section. Extension `LensCoin`, `LensPrice`, `useLensLabel`, launcher `LENS_COIN_MONO`, i18next plurals (all Arabic forms). Website `LensCoin`/`LensPrice`. | `docs/branding/`, `apps/extension/src/components/lens/`, `src/lib/lens-coin.ts`, `apps/website/src/components/billing/` |
| 6 | Website accounts work without the extension: API cookie session (`web: true`), pure `decide()`/`safeNext()` reconciliation, non-blocking extension card, header Sign in / name link, redirects through `?next=`. Sign-out sets a session flag so an extension holding another account is not adopted again. | `apps/website/src/components/account/AccountApp.tsx`, `src/lib/account/{api,reconcile,header-state}.ts`, `src/components/layout/HeaderAccount.tsx` |
| 7 | Balance page: card, need banner, request form priced in the browser, WhatsApp/Telegram contact, requests with cancel, history, install card. Gift celebration with `canvas-confetti` (ISC), loaded only for gifts and skipped with reduced motion. Public Pricing page: all numbers from the API, plus FAQ, navigation and sitemap. `lens_request_submitted` event. | `apps/website/src/components/billing/*`, `src/lib/billing/*`, `src/app/[locale]/pricing/`, `src/app/[locale]/profile/balance/` |

Docs updated:
- `docs/website.md`: Account pages, Balance and pricing pages, Analytics.
- `docs/backend.md`: Website sessions.
- `docs/dashboard.md`.
- `docs/branding/README.md`.
- AGENTS.md for the website, extension and dashboard.
- Website `design-system/MASTER.md`, `data-inventory.md` and `copy-deck.md`.

## Checks run

- **Typecheck:** clean in all five submodules.
- **Backend:** full suite with the live test database. 177 passed before this session; the new password-change test passes (`web-session.test.ts` 12/12) and `billing-api.test.ts` passes 25/25. The full backend suite was not re-run after the last two backend edits.
- **Extension:** `bun run test` 326 passed (including `test/lens-coin.test.tsx`).
- **Dashboard:** typecheck, lint and build pass. Full Playwright: 82 passed, with 2 mobile axe failures that the stacked-table fix resolved; `tests/billing.spec.ts` then passed 32/32. The full dashboard suite was not re-run after that fix.
- **Website:** typecheck, Biome and build pass.
  - Full Playwright: 356 passed and 6 failed.
  - Five failures were WebKit `site.spec.ts` timeouts under full parallel load; those tests pass 19/19 when run alone.
  - The sixth was a flaky Firefox header test, now made robust: 16/16 on all projects over 4 repeats.
  - New: `account.spec.ts` (rewritten), `account-reconcile.spec.ts`, `billing.spec.ts`, `pricing.spec.ts`.

## Open items for the owner

- Run `make ai-smoke` (a real paid call of about 2¢) and record the measured costs in phase 4.
- Commit the regenerated Orval clients (and everything else) when you're ready; I didn't commit without your go-ahead.
- Phase 6: an end-to-end check with a real extension build. It needs phase 10's install handoff.
- Phase 7: run `make website-lhci` on the pricing page.

## Next: phases 9, 10, 11

- **Phase 9:**
  - AI source setting (Cloud or Desktop; paired installs stay on Desktop).
  - `useAiAvailability(feature)`.
  - A streaming cloud transport to `/api/user/ai/prompts` and `/images`, reading NDJSON frames (`started`, `heartbeat`, `result`, `error`).
- **Phase 10:**
  - Pricing and balance caches (`storylens-ai-pricing`).
  - Prices on every AI button through `LensPrice` (apply the rules in phase 1, section 1.3).
  - The ⋮ navbar menu and balance chip (D22).
  - Not-enough-lenses redirect to `/{locale}/profile/balance/?need=&feature=&from=extension#request`.
  - Confetti for gifts and purchases, using `surface=extension` notices.
  - Opening the website on install (D14).
  - **Use AI off by default** (D20): `popup/selection-view.tsx` still defaults to on.
  - Section 10.2a: the cloud keyword suggestion must keep reporting its `useAiTask`, so the background launcher tab opens when it ends; a lens refusal counts as a failure.
- **Phase 11:** legal text (cookie, lenses, providers), release order and the docs check.

## Things worth a second look

- `apps/website/src/components/account/AccountApp.tsx`: the reconciliation effect, which keys automatic steps per state pair, and the sign-out order (leaving flag, then web signed out, then clearing the bridge).
- `apps/website/src/components/billing/BalancePage.tsx`: a request ID is reused only after a network error (no API answer). Totals are parsed from API decimal strings without float math.
- The header link calls `GET /api/user/auth/me` on every page once its 5-minute name cache expires. Signed-out visitors get a cheap 401, and the site tests let it reach the real API (or fail) without affecting results.
