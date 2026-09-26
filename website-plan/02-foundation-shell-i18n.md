# Phase 2 — Foundation: tokens, shell, i18n, and theme

[Global tracker](main.md) · **Status: In progress** · **Estimate: 5 points** · **Dependencies: phases 0–1, decision D6**

## User story

As a visitor, I want a fast, readable site in my language (English or Arabic) and preferred theme, so every page feels consistent and works on any device.

## Tasks

### Design tokens and fonts

- [ ] Turn `design-system/MASTER.md` into Tailwind v4 `@theme` variables in `src/app/globals.css`: colors as CSS custom properties with light and dark values, the fluid type scale, spacing, radius, shadows, easing, and durations. Do not hard-code hex values or arbitrary pixel values in components. Put any exception in `MASTER.md`.
- [ ] Load fonts with `next/font` (self-hosted, `display: swap`, subsets `latin` and `arabic`), with a size-adjusted fallback to avoid CLS. Choose the font family by `lang` through CSS variables.
- [ ] Use logical properties everywhere (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`) so RTL mirrors automatically. Flip only directional icons (arrows).

### Theme

- [ ] Support light, dark, and system themes. Set the initial theme before paint with a tiny inline script, or with `color-scheme` plus `prefers-color-scheme` if there is no toggle, to avoid a flash. Save the manual choice in `localStorage` inside try/catch. This is a functional preference, not tracking, and the privacy policy says so.
- [ ] Theme toggle: an accessible button with `aria-pressed` or a menu, and a visible focus ring.

### Internationalization

- [ ] Use `next-intl` routing with locales `['en','ar']` and default `en`. Use `generateStaticParams` for all locale routes and `setRequestLocale` so they stay static.
- [ ] Set `<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>` in `[locale]/layout.tsx`.
- [ ] Keep messages in `src/i18n/messages/{en,ar}.json`, typed so a missing key fails typecheck. Legal body text lives in MDX, not JSON.
- [ ] Middleware or proxy detects `Accept-Language` for `/` only. Otherwise redirect `/` → `/en` statically if the host runs without middleware. Record which option the hosting choice (D2) supports.
- [ ] Locale switcher keeps the current path and hash, and is labeled in both languages ("English", "العربية").

### Layout shell

- [ ] `SkipLink` → `#main`. Use landmark elements `header`, `nav`, `main`, and `footer`.
- [ ] Header: logo mark and wordmark, anchor navigation (Features, How it works, Desktop companion, FAQ), locale switcher, theme toggle, and a primary "Add to Chrome" CTA. It becomes compact and elevated on scroll (CSS or light GSAP in phase 4). On mobile it is a disclosure menu with a focus trap and Escape to close.
- [ ] Footer: product links, Privacy Policy, Terms of Use, GitHub repositories (extension, client, website; the backend only if it is public), license notice ("Source available under PolyForm Noncommercial 1.0.0"), contact (D3), and copyright year computed at build time.
- [ ] `src/lib/site-config.ts`: typed constants for site URL, store URLs and IDs, repository URLs, client download URLs, contact email, and legal operator. Every URL is used from here only.
- [ ] Base UI primitives, built to the design system's component rules: `Button` (primary/secondary/ghost, as link or button), `StoreButton`, `Badge`, `Card`, `SectionHeading`, `Accordion` (using `<details>` or ARIA disclosure), `Prose` (styling for legal MDX).
- [ ] `not-found.tsx` per locale, styled and linking home.

## Acceptance criteria

- [ ] `/en` and `/ar` build as static HTML. The Arabic page renders RTL with correct fonts and mirrored layout at 320, 768, and 1440 px.
- [ ] The theme persists across reloads with no flash of the wrong theme. Both themes pass contrast checks.
- [ ] Keyboard-only use reaches every header and footer control, the mobile menu traps focus, and Escape closes it.
- [ ] No component contains hard-coded colors or font sizes outside tokens (grep check recorded).
- [ ] Typecheck fails when an `ar` message key is missing.

## Validation record

2026-09-27: Static en/ar routes, typed matching messages, RTL logical CSS, self-hosted desktop fonts and native mobile fonts, light/dark/system, locale path/hash preservation, native dialog focus/Escape, header/footer and site config implemented. E2E/axe pass in both themes. Next-intl handles static locale context. / redirects to en via Nginx.

Detailed evidence: `apps/website/design-system/validation/README.md`. Checkboxes remain unticked unless every listed condition was verified; implemented core behavior is recorded above.
