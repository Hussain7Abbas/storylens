# Phase 6 — Quality, SEO, accessibility, and security

[Global tracker](main.md) · **Status: In progress** · **Estimate: 5 points** · **Dependencies: phases 3, 4, 5**

## User story

As a visitor on any device, network, or assistive technology, I want the site to load fast, work fully, and appear correctly in search results and link previews.

## Budgets

| Metric | Target |
| --- | --- |
| Lighthouse mobile (Performance / Accessibility / Best Practices / SEO) | ≥ 90 / 100 / 100 / 100 |
| LCP (4G, mid-tier mobile) | < 2.0 s |
| CLS | < 0.05 |
| INP | < 200 ms |
| Initial JavaScript (gzip, landing route, excluding the lazy 3D chunk) | ≤ 150 KB |
| Lazy 3D chunk | ≤ 180 KB gzip |
| Total image weight above the fold | ≤ 200 KB |

## Tasks

### SEO and sharing

- [ ] `generateMetadata` per locale: title template, description, canonical, `alternates.languages` (hreflang `en`, `ar`, `x-default`), Open Graph, and Twitter card.
- [ ] `opengraph-image.tsx` per locale through `next/og`, using the design tokens and an Arabic font for `ar`.
- [ ] `sitemap.ts` (all locale routes with alternates), `robots.ts`, `manifest.ts`, favicon and apple-touch icons from the brand mark.
- [ ] JSON-LD: `SoftwareApplication` (`applicationCategory: BrowserApplication`, `operatingSystem`: Chrome, Firefox) on the landing page, `FAQPage` for the FAQ, and `Organization`/`Person` for the operator. Add ratings or offers only when they are real.

### Accessibility (WCAG 2.2 AA)

- [ ] Automated: Playwright with `@axe-core/playwright` on `/en`, `/ar`, `/en/privacy`, `/ar/terms` in both themes and with reduced motion on and off.
- [ ] Manual: keyboard-only walkthrough, VoiceOver (macOS/iOS) in English and Arabic, 200% zoom and text-only zoom, Windows forced-colors mode, a visible focus ring everywhere, and focus not hidden by the sticky header (`scroll-padding-top`).
- [ ] Check that the demo's `aria-live` messages are not noisy during scrubbed animation (throttle or announce only final states).

### Tests

- [ ] Playwright e2e: navigation anchors, locale switch keeps the path, theme toggle persists, mobile menu, FAQ accordion, the demo toggles, all external links have correct `href`, and legal pages render their TOC. Run in Chromium, Firefox, and WebKit, plus mobile viewports.
- [ ] A link checker run over the built output (internal anchors and external store, GitHub, and release URLs).
- [ ] Lighthouse CI with the budgets above, as assertions in CI.

### Security headers (set on the host or in `next.config`)

- [ ] `Content-Security-Policy`: `default-src 'self'`; scripts `'self'` plus hashes or nonce for Next inline bootstrap and the theme script; `img-src 'self' data: blob:`; `connect-src 'self'` (plus analytics only if D6); `frame-ancestors 'none'`; `base-uri 'self'`; `form-action 'none'`. Check that WebGL, workers, and `blob:` work.
- [ ] `Strict-Transport-Security`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, `Permissions-Policy` (deny camera, mic, geolocation, and more), `Cross-Origin-Opener-Policy: same-origin`.
- [ ] `/.well-known/security.txt` with the contact from D3.

### Design-system conformance

- [ ] Run the UI UX Pro Max review against the finished pages (its pre-delivery checklist, if it has one). Fix the issues or record the reason for each exception in `design-system/MASTER.md`.
- [ ] Grep for token violations (raw hex, arbitrary `[...px]` values) and document any allowed exceptions.

## Acceptance criteria

- [ ] All budgets are met in CI, and the Lighthouse reports are attached to the validation record.
- [ ] Axe reports zero serious or critical violations. The manual screen-reader pass is recorded for both locales.
- [ ] The e2e suite passes in three browser engines.
- [ ] securityheaders.com (or an equivalent) grades A or better, with no CSP console violations.
- [ ] Rich results test validates `SoftwareApplication` and `FAQPage`. OG previews render correctly (checked in a debugger tool).

## Validation record

2026-09-27: 76 Playwright/axe tests pass in Chromium, Firefox, WebKit and mobile. TypeScript, Biome, static build and shell syntax pass. 4G Lighthouse 100/100/100/100, LCP 1.06–1.17s and CLS0; default slow-4G LCP ~2.24s exceeds 2s stretch target. Build-generated CSP script hashes implemented. VoiceOver/forced colors/field INP/external validators remain unverified.

Detailed evidence: `apps/website/design-system/validation/README.md`. Checkboxes remain unticked unless every listed condition was verified; implemented core behavior is recorded above.
