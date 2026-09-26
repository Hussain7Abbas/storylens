# Story Lens website — global tracker

**Status: Implementation in progress — core website implemented; launch awaiting the private contact address.**

## Goal

Build a public marketing site for the Story Lens browser extension in a new **public** repository, `storylens-website`, and pin it in this umbrella repository as the fourth submodule at `apps/website`. The site needs:

- A landing page that explains the extension and its desktop companion, and gets visitors to install it.
- A **Privacy Policy** and **Terms of Use**. Both must match what the code actually collects and does, and must be good enough to use as the Chrome Web Store and Firefox Add-ons privacy URL.
- Next.js with Tailwind CSS, GSAP animation, and one small, optional Three.js scene.
- UX/UI decisions made with the **UI UX Pro Max** skill. Its design system is saved in the website repository and used for every visual decision.

## Technical decisions

| Area | Decision | Reason |
| --- | --- | --- |
| Framework | Latest stable Next.js App Router (16.x at time of writing; confirm during phase 1), React 19, strict TypeScript | Requested. Server components keep the landing page mostly JavaScript-free. |
| Rendering | Fully static (SSG) for every route. No API routes or server runtime | A landing page and legal pages have no dynamic data. Cheap and fast, and any static host can serve it. |
| Styling | Tailwind CSS v4 with CSS-first `@theme` tokens generated from the design system | Requested. Tokens keep the skill's output as the single source of truth. |
| Motion | GSAP 3 (all plugins, including ScrollTrigger and SplitText, are free), used through `@gsap/react` `useGSAP` | Requested. `useGSAP` handles cleanup and React strict mode. |
| 3D | One lazily loaded React Three Fiber and drei scene in the hero: a glass lens over a page. It only loads on capable desktops | "A little Three.js". Kept out of the critical path, with a static fallback. |
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
| [4 — Motion and 3D](04-motion-and-3d.md) | GSAP choreography, interactive demo, Three.js hero lens | 8 | 3 | In progress |
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
      motion/                 # GSAP registration, useReveal, useSplitHeading, useReducedMotion
      three/                  # LensScene (client-only, lazy), LensFallback
    content/legal/{en,ar}/    # privacy.mdx, terms.mdx
    i18n/                     # routing, request config; messages/en.json, ar.json
    lib/site-config.ts        # URLs, store IDs, contact, domain (single source)
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
- GSAP React: <https://gsap.com/resources/React>, ScrollTrigger: <https://gsap.com/docs/v3/Plugins/ScrollTrigger>
- React Three Fiber: <https://r3f.docs.pmnd.rs>, drei: <https://drei.docs.pmnd.rs>
- next-intl App Router: <https://next-intl.dev/docs/getting-started/app-router>
- Chrome Web Store user data policy: <https://developer.chrome.com/docs/webstore/program-policies/user-data-faq>
- Firefox add-on policies: <https://extensionworkshop.com/documentation/publish/add-on-policies/>
- Repository context: [root instructions](../AGENTS.md), [extension](../docs/extension.md), [backend](../docs/backend.md), [client](../docs/client.md), [desktop guide](../docs/client.md)

## Implementation record — 2026-09-27

Public repository created using gh: https://github.com/Hussain7Abbas/storylens-website . main/develop pushed; fourth submodule integrated. Bun, Biome, strict TypeScript, Next.js static export, Tailwind tokens, typed English/Arabic copy, RTL, themes, native mobile dialog, MDX legal template/TOC, SEO/sitemap/robots/OG, GSAP reveals and desktop pinned demo, and gated Three.js lens are implemented. Design system and source-grounded data inventory are committed in the website repo.

76 browser/axe tests passed across Chromium/Firefox/WebKit/mobile; all four typechecks pass; desktop has 7 passing tests and builds. Lighthouse scored 100/100/100/100 on the documented 4G profile (80ms RTT, 4096Kbps, 4× CPU); LCP 1.06–1.17s, CLS 0. Default slow-4G landing LCP is ~2.24s, so that stricter <2s goal remains outstanding. The lazy renderer chunk is ~244KB gzip plus ancillary code, above the 180KB stretch budget. Neither exception is marked passed.

Cloudflare DNS A record: 6b28655ec48052244bb2428790b81e7e → 178.105.43.174, proxied. Server standalone checkout is /srv/storylens-website. Nginx bootstrap installed and webroot certificate issued through 2026-12-25 with automatic renewal; atomic release deployment and restricted SSH CI workflow are prepared. Bun 1.3.14 crashed after Next’s successful export; a dedicated Node 24.21.0 runtime is installed for Next builds while Bun manages dependencies/scripts.

Owner approved operator/age/jurisdiction defaults. Private contact address remains pending. Do not publish the legal pages without that address. Professional legal review is recommended. Store-dashboard submissions, search-console submissions, manual VoiceOver/physical Windows checks, external rich-results debugger, and full animation/3D profiling remain unverified. Reading visuals are original illustrative UI, not real extension screenshots. Published Firefox listing and desktop installers are not claimed.
