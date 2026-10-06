# Story Lens website — global tracker

**Status: Implementation in progress — core website implemented; launch awaiting the private contact address.**

## Goal

Build a public marketing site for the Story Lens browser extension in a new **public** repository, `storylens-website`, and pin it in this umbrella repository as the fourth submodule at `apps/website`. The site needs:

- A landing page that explains the extension and its desktop companion, and gets visitors to install it.
- A **Privacy Policy** and **Terms of Use**. Both must match what the code actually collects and does, and must be good enough to use as the Chrome Web Store and Firefox Add-ons privacy URL.
- Next.js with Tailwind CSS and hand-written CSS motion. (The original plan used GSAP and a small Three.js scene; both were removed on 2026-10-07.)
- UX/UI decisions made with the **UI UX Pro Max** skill. Its research informed the structure; the owner-approved Ink & Iris direction in `apps/website/design-system/MASTER.md` is used for current visual decisions.

## Technical decisions

| Area | Decision | Reason |
| --- | --- | --- |
| Framework | Latest stable Next.js App Router (16.x at time of writing; confirm during phase 1), React 19, strict TypeScript | Requested. Server components keep the landing page mostly JavaScript-free. |
| Rendering | Fully static (SSG) for every route. No API routes or server runtime | A landing page and legal pages have no dynamic data. Cheap and fast, and any static host can serve it. |
| Styling | Tailwind CSS v4 with CSS-first `@theme` tokens generated from the design system | Requested. Tokens implement the owner-approved Ink & Iris design system. |
| Motion | CSS keyframes and scroll-driven `animation-timeline` in `globals.css`, plus one ~400-byte inline `IntersectionObserver` for section reveals. No animation dependency *(2026-10-07; originally GSAP 3 through `@gsap/react`)* | Removes ~1.05MB of JavaScript from the export, keeps effects on the compositor, and degrades to a static page where scroll timelines are missing. |
| Hero lens | `.lens-glass`: a CSS glass pane with an iris rim, specular highlight and slow drift, from 1024px up *(2026-10-07; originally a lazy React Three Fiber + drei scene)* | Same decorative intent at no bundle cost, and nothing to leak or dispose. |
| i18n | English and Arabic (RTL) through `next-intl`, with `/en` and `/ar` routes | The extension already ships English and Arabic. Arabic readers are a target audience. |
| Legal content | MDX files per locale, with `lastUpdated`/`version` frontmatter and a changelog | Easy to edit, diff, and review. Dates render from data, not hard-coded markup. |
| Package manager and quality | Bun, Biome (same as the extension), `tsc --noEmit`, Playwright with axe, and Lighthouse CI | Matches repository rules. `next lint` was removed in Next 16. |
| Analytics | None at launch (see open decision D6) | No cookies means no consent banner and a simpler privacy policy. |
| Hosting | Nginx static export on `ssh raseen`, separate `/srv/storylens-website` checkout on `main` | User selected the existing server. Bun builds a static export; Nginx serves it without a Next runtime. |
| Repository | `git@github.com-personal:Hussain7Abbas/storylens-website.git` (public), branches `develop` and `main` | Same SSH alias and branch model as the other submodules and `.xeploy.json`. |

## Open decisions (need user input before or during the named phase)

| # | Decision | Proposed default | Needed by |
| --- | --- | --- | --- |
| D1 | Production domain | Confirmed: `storylens.iscoded.com`; Cloudflare A record created | Phase 7 (the canonical URL is needed from phase 2) |
| D2 | Hosting provider | Confirmed: separate repository on `ssh raseen`, Nginx static hosting | Phase 7 |
| D3 | Public contact address for privacy and legal requests | A dedicated address on the domain, such as `privacy@…`. Do not publish a personal email without explicit approval | Phase 5 |
| D4 | Legal operator name and governing law | Owner approved Hussain Abbas and mandatory applicable law with no exclusive jurisdiction | Phase 5 |
| D5 | Minimum age | Owner approved 13, and 16 where required | Phase 5 |
| D6 | Analytics | None implemented | Phase 2 |
| D7 | Store links | Chrome Web Store ID from `CHROME_EXTENSION_ID`. Firefox AMO listing if one is published; otherwise "coming soon" | Phase 3 |
| D8 | Desktop client downloads | No published release found; link setup/source instead of nonexistent installers | Phase 3 |
| D9 | Include the website in `make deploy` (`.xeploy.json` subproject) | Yes, the same `develop` → `main` flow | Phase 1 |

## Global phase tracker

Story points are relative estimates, not dates. Implementation started at the user’s request; verification evidence is in apps/website/design-system/validation.

| Phase | Deliverable | Points | Depends on | Status |
| --- | --- | ---: | --- | --- |
| [0 — Discovery and design system](00-discovery-and-design-system.md) | UI UX Pro Max design system, sitemap, wireframes, copy deck | 3 | None | In progress |
| [1 — Repository and submodule](01-repository-and-submodule.md) | Public repo, Next.js scaffold, tooling, umbrella integration | 3 | 0 (D9) | In progress |
| [2 — Foundation, shell, and i18n](02-foundation-shell-i18n.md) | Tokens, fonts, layout shell, en/ar and RTL, theme, config | 5 | 0, 1 | In progress |
| [3 — Landing page sections](03-landing-page-sections.md) | All static sections with final copy and assets | 8 | 2 | In progress |
| [4 — Motion](04-motion-and-3d.md) | CSS choreography, interactive demo, CSS hero lens | 8 | 3 | Superseded — rebuilt without libraries |
| [5 — Privacy Policy and Terms of Use](05-legal-pages.md) | Verified data inventory, bilingual legal pages | 5 | 2 (D3–D5) | In progress |
| [6 — Quality, SEO, and accessibility](06-quality-seo-a11y.md) | Budgets, audits, tests, metadata, security headers | 5 | 3, 4, 5 | In progress |
| [7 — Deployment and launch](07-deployment-and-launch.md) | Hosting, domain, store listings, cross-repo links, docs | 3 | 6 (D1, D2) | In progress |

Phase 5 can run in parallel with phases 3–4 once phase 2 is done.

## Proposed website layout

```text
apps/website/                 # submodule → storylens-website
  design-system/              # UI UX Pro Max output (MASTER.md + page overrides)
  src/
    app/
      [locale]/
        layout.tsx            # <html lang dir>, fonts, header/footer, theme
        page.tsx              # landing page (composed from sections)
        privacy/page.tsx
        terms/page.tsx
        not-found.tsx
      sitemap.ts  robots.ts  manifest.ts  opengraph-image.tsx
    components/
      layout/                 # Header, Footer, LocaleSwitch, ThemeToggle, SkipLink
      sections/               # Hero, Problem, Features, Demo, HowItWorks, Companion, Privacy, FAQ, FinalCta
      ui/                     # Button, Badge, Card, Accordion, StoreButton …
      billing/                # LensCoin, LensPrice, PricingTable, GiftCelebration, SparkBurst
    content/legal/{en,ar}/    # privacy.mdx, terms.mdx
    i18n/                     # routing, request config; messages/en.json, ar.json
    lib/site-config.ts        # URLs, store IDs, contact, domain (single source)
    lib/inline-scripts.ts     # themeScript and revealScript (both CSP-hashed)
    lib/structured-data.ts    # schema.org graphs per page
  public/                     # icons, OG fallbacks, screenshots, poster images
  tests/                      # Playwright e2e + axe
  AGENTS.md  CLAUDE.md (@AGENTS.md)  Makefile  biome.json  README.md  LICENSE.md
```

## Definition of done

- [ ] `storylens-website` is public on GitHub, has `develop` and `main`, and is pinned at `apps/website`.
- [ ] Root `make install`, `make build`, and `make typecheck` include the website. `make dev-website` works.
- [ ] The landing page, `/privacy`, and `/terms` work in English and Arabic (RTL), in light and dark themes, from 320 px to wide desktop.
- [ ] The design system from UI UX Pro Max is committed, and the implementation follows it (checked in phase 6).
- [ ] With reduced motion or no WebGL, the page is fully usable and all content is visible.
- [ ] Lighthouse (mobile): Performance ≥ 90, Accessibility 100, Best Practices 100, SEO 100. Axe reports no serious or critical issues.
- [ ] Each legal statement is checked against the code inventory in phase 5, and the extension, backend, and client links point to the live policy.
- [ ] Production is deployed on the chosen domain with HTTPS, security headers, sitemap, and hreflang.
- [ ] Umbrella `AGENTS.md`, `README.md`, `docs/`, `Makefile`, and `.xeploy.json` are updated. The website has its own `AGENTS.md` and a `CLAUDE.md` that contains only `@AGENTS.md`.

## Tracking rules

1. Mark a phase **In progress** only when the user has asked for implementation and its dependencies and needed decisions are resolved.
2. Tick task and acceptance boxes only with evidence. Record commands, results, versions, and URLs in the phase's validation record.
3. Mark a phase **Blocked** with the specific cause and the next action. Unverified work is not done.
4. Update this tracker in the same task as the phase file.
5. Legal text must not claim behavior that the phase 5 inventory has not verified. When the product's data handling changes, update the policies and their `lastUpdated` date.

## References

- UI UX Pro Max skill: <https://github.com/nextlevelbuilder/ui-ux-pro-max-skill>
- Next.js App Router: <https://nextjs.org/docs/app>, static exports: <https://nextjs.org/docs/app/guides/static-exports>
- Tailwind CSS v4 theme variables: <https://tailwindcss.com/docs/theme>
- CSS scroll-driven animations: <https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations>
- llms.txt convention: <https://llmstxt.org>
- next-intl App Router: <https://next-intl.dev/docs/getting-started/app-router>
- Chrome Web Store user data policy: <https://developer.chrome.com/docs/webstore/program-policies/user-data-faq>
- Firefox add-on policies: <https://extensionworkshop.com/documentation/publish/add-on-policies/>
- Repository context: [root instructions](../AGENTS.md), [extension](../docs/extension.md), [backend](../docs/backend.md), [client](../docs/client.md), [desktop guide](../docs/client.md)

## Implementation record — 2026-09-27

Public repository created using gh: https://github.com/Hussain7Abbas/storylens-website . main/develop pushed; fourth submodule integrated. Bun, Biome, strict TypeScript, Next.js static export, Tailwind tokens, typed English/Arabic copy, RTL, themes, native mobile dialog, MDX legal template/TOC, SEO/sitemap/robots/OG, GSAP reveals and desktop pinned demo, and gated Three.js lens are implemented. Design system and source-grounded data inventory are committed in the website repo.

76 browser/axe tests passed across Chromium/Firefox/WebKit/mobile; all four typechecks pass; desktop has 7 passing tests and builds. Lighthouse scored 100/100/100/100 on the documented 4G profile (80ms RTT, 4096Kbps, 4× CPU); LCP 1.06–1.17s, CLS 0. Default slow-4G landing LCP is ~2.24s, so that stricter <2s goal remains outstanding. The lazy renderer chunk is ~244KB gzip plus ancillary code, above the 180KB stretch budget. Neither exception is marked passed.

Cloudflare DNS A record: 6b28655ec48052244bb2428790b81e7e → 178.105.43.174, proxied. Server standalone checkout is /srv/storylens-website. Nginx bootstrap installed and webroot certificate issued through 2026-12-25 with automatic renewal; atomic release deployment and restricted SSH CI workflow are prepared. Bun 1.3.14 crashed after Next’s successful export; a dedicated Node 24.21.0 runtime is installed for Next builds while Bun manages dependencies/scripts.

Owner approved operator/age/jurisdiction defaults. Private contact address remains pending. Do not publish the legal pages without that address. Professional legal review is recommended. Store-dashboard submissions, search-console submissions, manual VoiceOver/physical Windows checks, external rich-results debugger, and full animation/3D profiling remain unverified. Reading visuals are original illustrative UI, not real extension screenshots. Published Firefox listing and desktop installers are not claimed.

## Ink & Iris rebrand — 2026-09-27

Website and extension UI now share neutral light/dark surfaces, violet primary actions, Inter UI typography, and Lucide outline icons. The website keeps a serif for chapter passages and both apps preserve Arabic/RTL. Popup, settings, forms, launcher, keyword tooltip, summaries and extraction surfaces follow the same identity. Existing logo, favicon and social artwork remain pending the owner's replacement logo. Validation evidence is in `apps/website/design-system/validation/ink-iris/`; this is a local implementation, not a production release.

## Implementation record — 2026-10-07

Animation dependencies removed and rewritten in CSS: `gsap`, `@gsap/react`, `three`, `@react-three/fiber`, `@react-three/drei` and `canvas-confetti` are gone from `package.json`. Section reveals, the hero stagger, the header shadow, the demo lens sweep, the hero glass lens and the gift burst are CSS; the only motion script is the inline `revealScript`. The demo's staged walk now follows the passage's intersection ratio instead of a pinned scroll timeline. `browserslist` pins a modern baseline so SWC stops emitting `Array.prototype.at`/`flat` polyfills.

Search and answer engines: richer per-route metadata (long-form robots directives, OG image dimensions and alt, localized keywords), schema.org graphs in `src/lib/structured-data.ts` (`Organization`, `WebSite`, `SoftwareApplication`, `WebPage`, `HowTo`, `FAQPage`, `BreadcrumbList`), a sitemap that reads the legal MDX dates and carries `x-default`, `robots.txt` that names the answer-engine crawlers and disallows `/[locale]/profile/`, a curated `public/llms.txt`, and a canonical/`hreflang` language gate at the bare domain.

Loading: a 72px header logo (26.9KB → 2.1KB), 960px gallery variants with `sizes` matching the real column widths, and a header that only calls `/auth/me` when this browser has held a website session — which also removes the anonymous 401 that cost the best-practices score.

Not yet measured: `make website-build`, Playwright/axe and Lighthouse were not run for this change; the build needs network access to Google Fonts that the agent sandbox blocks. Re-run them and record the figures before treating any budget as passed.
