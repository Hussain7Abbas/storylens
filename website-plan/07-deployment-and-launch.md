# Phase 7 — Deployment and launch

[Global tracker](main.md) · **Status: In progress** · **Estimate: 3 points** · **Dependencies: phase 6, decisions D1–D2**

## User story

As the owner, I want the site live on its domain with automatic deployments, and every Story Lens surface linking to its privacy policy and terms, so the product is ready for store review and public users.

## Tasks

### Hosting

- [ ] Connect `storylens-website` to the host (D2): production deploys from `main`, and previews come from `develop` and pull requests. Set `NEXT_PUBLIC_SITE_URL` and the store IDs per environment.
- [ ] Configure the domain (D1): DNS records at the `iscoded.com` DNS provider, HTTPS, an apex/`www` redirect policy, and a `/` → locale redirect that works on the chosen host.
- [ ] Apply the security headers from phase 6 in host config (`vercel.json`/`_headers`) or `next.config`, and check them on production.
- [ ] Make preview deployments `noindex` (`X-Robots-Tag` on non-production).
- [ ] Only if the user confirms, add a website subproject to `.xeploy.json` and document how `make deploy` affects the website (a merge to `main` → automatic production deploy).

### Cross-repository links (each change is committed in its own submodule first, then the umbrella pointer is updated)

- [ ] **Extension:** add Privacy Policy, Terms of Use, and Website links to Settings or Profile/About. Show them in the locale-matched URL (`/ar/...` when the extension language is Arabic). Update `README.md`, and the store listing description and support URL.
- [ ] **Chrome Web Store:** set the Privacy Policy URL and fill in the Privacy practices tab from `store-privacy-answers.md`. The user must perform the dashboard submission, or explicitly approve each submission.
- [ ] **Firefox AMO:** set the privacy policy and data-collection disclosure if a listing exists (D7).
- [ ] **Desktop client:** link the policy from the settings window and the README. Link the website from release notes.
- [ ] **Backend:** add a "Terms/Privacy" link if registration responses or emails contain one (**verify**). Otherwise no change.
- [ ] **Umbrella:** add the live URL to `README.md` (header links), `docs/website.md` (hosting, domain, deploy flow, how to update legal pages), and `docs/intro.md`.

### Launch checks

- [ ] Smoke test on production: both locales, both themes, legal pages, store links, client downloads, OG preview, sitemap and robots, security headers.
- [ ] Submit the sitemap to Google Search Console and Bing Webmaster Tools (the user owns these accounts, so the user or an approved action does it).
- [ ] Tag the first website release (for example `v1.0.0`) on `main`, matching the other repositories' `v` prefix.
- [ ] Mark all phases done in [main.md](main.md) with evidence. Record follow-up ideas: changelog or blog, supported-sites directory generated from backend selectors, testimonials once real, Firefox badge when live, signed client builds.

## Acceptance criteria

- [ ] The production URL serves the site over HTTPS with correct headers, and `develop` previews are not indexed.
- [ ] The Chrome Web Store listing (and AMO if present) points to the live privacy policy, and its answers match the policy.
- [ ] The extension, client, and umbrella docs link to the live legal pages.
- [ ] The umbrella's `apps/website` pointer is at the released commit, and all four submodules pass `make typecheck`.

## Validation record

2026-09-27: Cloudflare proxied A record created using installed flarectl. Separate repo cloned at /srv/storylens-website on ssh raseen. Nginx static/TLS config, release rollback and dedicated restricted CI SSH key prepared; server build passes using the dedicated runtime. Extension/client legal links implemented. Certificate issued through 2026-12-25 with automatic renewal; production publication/smoke checks pending. Private contact needed before publication. No store or search-console submissions performed.

Detailed evidence: `apps/website/design-system/validation/README.md`. Checkboxes remain unticked unless every listed condition was verified; implemented core behavior is recorded above.
