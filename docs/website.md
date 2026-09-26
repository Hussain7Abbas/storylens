# Story Lens website

[Documentation index](intro.md) · [Implementation tracker](../website-plan/main.md)

`apps/website` is the independent public `storylens-website` repository, the fourth submodule. Next.js App Router builds English and Arabic landing/privacy/terms pages as a static export. Tailwind v4 and CSS tokens implement a literary reading design; GSAP and a lazy Three.js lens are optional. The original demo explains highlights and replacements. Website source and content use PolyForm Noncommercial 1.0.0.

Use Bun and Biome: `make dev-website`, `make build-website`, `make website-typecheck`, `make website-lint`, `make website-test`, `make website-lhci`. Root install/build/typecheck/test include the website. Browser tests run Chromium, Firefox, WebKit and a mobile viewport with axe. Install browser binaries with `bunx playwright install` in the website checkout.

## Production

Live website: [storylens.iscoded.com](https://storylens.iscoded.com). Cloudflare A record proxies to `178.105.43.174`, created using local `flarectl`. Hosting is the existing `ssh raseen` server. Website code has its own checkout at `/srv/storylens-website` on branch `main`, separate from `/srv/storylens-backend`. There is no Next.js process in production.

Nginx config: `apps/website/deploy/nginx/storylens.iscoded.com.conf`. The server runs `make sync` inside its website checkout to fast-forward main, install pinned dependencies with Bun, check TypeScript/Biome, build (using the dedicated `/opt/storylens-node/bin` Node LTS runtime for Next.js), generate CSP hashes, create a release, atomically update `/var/www/storylens/current`, test Nginx, and reload. Old releases remain for rollback. Initial HTTPS uses a Let’s Encrypt webroot certificate; port 80 serves challenges and redirects other requests to HTTPS. `/` redirects to `/en/`; explicit locale links preserve paths and hashes. Static assets receive long cache expiry. Build-generated script hashes allow Next bootstrap without unsafe-inline script permission. Inline styles support GSAP/Three.js styles.

CI checks all pushes to main/develop and pull requests. Auto-deploy is activated only with dedicated SSH secrets and `DEPLOY_ENABLED=true`; no personal local key is copied to GitHub. Local static preview uses `make start`. Preview artifacts are not publicly indexed deployments. Website release integration in `.xeploy.json` is separate from a server update; the release merges production main, then configured deployment runs.

## Legal maintenance

Legal MDX bodies live in `src/content/legal/{en,ar}`. Update both language files, version, lastUpdated, and legal changelog together, and recheck `design-system/data-inventory.md` against changed extension/backend/client behavior. The owner approved Hussain Abbas as operator, the age/law defaults, and hussain@iscoded.com for privacy and deletion requests before publication. The contact is centralized in site-config and configured in the server’s ignored .env. Do not post personal deletion requests in public issues. Store dashboard edits, search-engine submissions, manual VoiceOver checks, and signing installers remain owner tasks unless explicitly authorized.
