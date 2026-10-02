# Local lenses browser integration

[Development guide](development.md) · [Release checklist](../pricing-plan/11-legal-release-and-docs.md)

Run `node scripts/lenses-e2e.mjs` from the umbrella root after installing the submodule dependencies and generating the backend Prisma client. Node hosts Playwright, as in the existing store capture workflow; Bun runs all app builds and the API. This uses the real extension service worker, website, dashboard, API and PostgreSQL. The backend fixture substitutes the AI provider and logs transactional emails locally; it makes no paid provider calls and delivers no email.

## Requirements and isolation

- The backend `.env` must point at PostgreSQL on `localhost` or `127.0.0.1`. The harness retains its connection credentials and substitutes a freshly created database named `storylens_lenses_e2e_<run>`.
- Local Docker PostgreSQL must be running. The default container is `postgres-storylens`; override it with `STORYLENS_E2E_POSTGRES_CONTAINER`. Its `POSTGRES_USER` must be able to create and drop databases.
- Ports 7041 (API), 4173 (website), and 4174 (dashboard) must be free. The script checks before starting services.
- Install Playwright Chromium through the website's installed Playwright CLI if it is missing. The extension run opens a disposable visible Chromium window; it does not use the user's browser profile.

The script applies migrations to the new database, seeds a test-only dashboard owner, and supplies local API/website URLs when building the apps. It clears mail, Google and OpenRouter credentials in the fixture process. External browser requests are blocked, and the extension profile has external DNS disabled. No `.env`, version or source configuration is edited. Cleanup closes the browser and child services and drops only the database created by that run.

The website `out/` and dashboard `dist/` now contain local test builds. Rebuild normally before using those artifacts elsewhere. The extension test build is `.output/chrome-mv3-dev`; the existing production build is retained.

## What the run checks

- Website-only emailed-code registration, the trial gift, HttpOnly/Strict session cookie, sign-out and sign-in.
- First-install website opening, guest merging, both choices when accounts differ, and shared sign-out through the real extension bridge.
- Trial and purchase notices independently on the website and extension, with no repeat when the extension opens again.
- A website WhatsApp top-up request, its dashboard chat link and approval, and the resulting balance and purchase history.
- All six Cloud background/API feature routes, their ledger charges, and free second attempts on the same text action. These calls exercise the real background messaging and HTTP stream transport with deterministic provider replies.
- Cancellation through the browser, provider abort and the corresponding refund.
- A Telegram request, its chat link, dashboard rejection reason, website history and locally logged email text.
- Dashboard gifts shown once per app, and positive ledger corrections without celebrations.
- A final read-only audit comparing every stored balance with its ledger.

The script prints each completed scenario and the temporary evidence directory. Build/server logs and `result.json` are saved there; failed runs also save page text and screenshots with bounded diagnostic timeouts. SIGINT/SIGTERM perform the same browser/service/database cleanup. All accounts, contact details and messages are fictional fixtures.

This rehearsal does not establish Google OAuth, real email delivery, provider quality, Desktop execution, feature-specific reading UI interactions, old packaged-extension compatibility, or migration behavior on a production-data copy. The broader release checklist remains the authority for those checks.
