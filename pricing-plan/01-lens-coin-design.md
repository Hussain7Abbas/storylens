# Phase 1 — Lens coin icon and price chip

[Global tracker](main.md) · **Status: Done (not committed; the chip placement rules in 1.3 are applied to the extension buttons in phase 10)** · **Estimate: 2 points** · **Depends on: D17 (decided: iris)** · **Ships in: 3.4.0**

## Goal

One recognizable lens coin and one way of showing a price, used the same way in the extension, website and dashboard:

- a full-color coin for balances, dialogs and the pricing page;
- a simplified coin for 16–20 px;
- a monochrome line coin (Lucide style, `currentColor`) for filled buttons and dense chips;
- a **price chip** pattern: coin plus number, with an accessible label such as "3 lenses".

## Draft artwork (in `assets/`)

| File | Use | Notes |
| --- | --- | --- |
| `lens-coin.svg` | 24 px and larger | Iris disc (`#8371e0` → `#5544a7`), darker edge for thickness, pale iris rim (`#c9befa`), white four-point sparkle from the Lensbook logo, soft glint |
| `lens-coin-small.svg` | 16–20 px | Disc, edge and a larger sparkle only; the rim and glint blur at this size |
| `lens-coin-mono.svg` | Inside filled buttons and text | 24 px grid, 1.75 stroke, round caps, `currentColor`: a circle and a sparkle |
| `lens-coin-gold.svg` | Alternative for D17 | Gold disc with an iris sparkle |

[Size preview](assets/preview-sizes.png) · [Variant preview](assets/preview-variants.png). In a filled iris button the color coin disappears (iris on iris), so filled buttons use the mono coin in the button's text color.

## Tasks

### 1.1 Finalize the artwork

- [x] D17 decided on 2026-10-02: the **iris** coin. No new palette token is needed; `lens-coin-gold.svg` stays in `assets/` only as the rejected alternative and is not copied to the apps.
- [x] Check the color coin's contrast against both canvases and surfaces (the darker edge must stay visible on `#171820` and `#22232e`; add a 1 px `#b5a8f5` outline in dark contexts if it does not).
- [x] Put the approved sources in `docs/branding/lens-coin/` (`lens-coin.svg`, `lens-coin-small.svg`, `lens-coin-mono.svg`) with a short README section in `docs/branding/README.md`: which variant to use where, minimum sizes, clear space (1/8 of the size), and "do not recolor, rotate or add text".
- [x] Extend `docs/branding/scripts/export.cjs` to copy the SVGs into each app (below) and export `lens-coin-{16,32,64,128}.png` for email templates (emails cannot rely on SVG).

### 1.2 Components

Each app gets its own copy (no shared package). All three render inline SVG, not `<img>`, so the website's CSP and the extension's content surfaces need no changes.

- [x] **Extension** `src/components/lens/lens-coin.tsx`: `LensCoin({ size, variant: "color" | "mono", title? })`. It picks the small artwork automatically at 20 px or less and is `aria-hidden` unless `title` is given.
- [x] **Extension** `src/components/lens/lens-price.tsx`: `LensPrice({ lenses, tone: "default" | "on-brand", compact? })` renders the coin and the number. `0` renders the localized "Free" (or nothing when `hideFree`). Its accessible text comes from i18next plurals: `lens.count` with `_one`/`_other` in English and `_zero`/`_one`/`_two`/`_few`/`_many`/`_other` in Arabic (عدسة، عدستان، عدسات).
- [x] **Extension launcher** (vanilla, no React): `src/lib/lens-coin-node.ts` exports the mono coin as a Lucide-style `IconNode`, so `setActionIcon`-style helpers can build it in the shadow root. A price badge style goes into the launcher's stylesheet next to the `#status` dot.
- [x] **Website** `src/components/billing/LensCoin.tsx` and `LensPrice.tsx` (same API; Biome rules; logical CSS properties for RTL).
- [x] **Dashboard** `src/components/ui/lens-coin.tsx` and `lens-price.tsx`.
- [x] Numbers use the page locale's grouping (`Intl.NumberFormat(locale)`); keep Latin digits in Arabic if the site already does (check the existing number formatting and follow it).

### 1.3 Price chip rules (all apps)

- [ ] Placement: after the label inside the button (`Generate image  ◎ 3`); in icon-only buttons, a small badge at the end-top corner (mirrored in RTL).
- [ ] Filled or brand buttons use `mono` in the button's text color; neutral, light and subtle buttons use `color`.
- [ ] Free features show "Free" only where a price would otherwise be expected (pricing tables, Settings → AI); buttons for free features show nothing.
- [ ] The accessible name includes the price: "Generate image, 3 lenses". Tooltips repeat it.
- [ ] Desktop AI source: no chip at all (D3).

## Tests

| # | Test | Expected |
| --- | --- | --- |
| 1 | Render `LensPrice` with 0, 1, 2, 3, 11, 100 in English and Arabic | Correct plural labels; 0 shows "Free" |
| 2 | `LensCoin` at 16 and 24 px | Small artwork at 16 px, full at 24 px |
| 3 | Website and dashboard axe checks on a page with chips | No violations; chips have accessible text |
| 4 | Visual check in light and dark themes in all three apps | Coin edge visible on dark surfaces; mono coin readable on filled buttons |
| 5 | RTL | Badge and chip order mirror correctly |

## Exit criteria

- [x] Iris artwork committed under `docs/branding/lens-coin/` and copied by the export script.
- [x] `LensCoin` and `LensPrice` exist in the three apps with tests; typecheck and lint pass.

## Docs and instructions

- `docs/branding/README.md`: the lens coin section and consumer table rows.
- `apps/website/design-system/MASTER.md`: "Lens coin and prices" under Components (variants, chip rules, plural labels).
- Extension, website and dashboard `AGENTS.md`: one line each, "show lens prices only through `LensPrice` (or the launcher badge)".

## Risks

| Risk | Mitigation |
| --- | --- |
| Iris coin confused with a brand badge | Darker edge and sparkle make it read as a coin; the number beside it and the "lenses" labels make the meaning clear |
| Tiny sizes blur | Separate small artwork; never below 14 px |
| Arabic plural forms wrong | i18next plural keys for all six Arabic forms; native review in phase 11 |

## Implementation notes

- Contrast checked on `#171820`, `#22232e`, `#f7f7fb` and white at 16–48 px: the face stays visible on dark canvases, so no outline was added.
- Components inline the SVG paths, so the export script copies no SVGs into the apps; it exports `png/lens-coin-{16,32,64,128}.png` and the website's `public/brand/lens-coin-{32,64}.png` for emails (`node docs/branding/scripts/export.cjs lens-coin` refreshes only the coin).
- Extension: `components/lens/lens-coin.tsx`, `lens-price.tsx`, `src/lib/lens-coin.ts` (`LENS_COIN_MONO`, `formatLenses`), i18next plurals in `public/locales/*.json`, tests in `test/lens-coin.test.tsx`. Website: `src/components/billing/LensCoin.tsx`, `LensPrice.tsx` (`Intl.PluralRules`). Dashboard: `src/components/ui/lens-coin.tsx` (phase 8).

## Verification log

| Date | Check | Result | Evidence |
| --- | --- | --- | --- |
| 2026-10-02 | Drafts rendered at 16–96 px on light and dark backgrounds, and inside a filled button | Legible; color coin must not sit inside filled iris buttons | `assets/preview-sizes.png`, `assets/preview-variants.png` |
