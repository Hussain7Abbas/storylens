# Story Lens branding

The approved logo is **option 2 — Lensbook**, selected by the owner. The original is [option 2 - choosen.png](<logo/option 2 - choosen.png>). [lensbook-master.png](logo/lensbook-master.png) preserves that artwork, removes unused transparent margins, and centers it with an 8% safe border at 1024 × 1024.

## Palette

[Color palette PNG](color-pallete.png) · [Editable SVG](color-pallete.svg)

The chart includes all light/dark tokens, including semantic success, warning and error colors. It reads the extension's canonical `src/styles/palette.ts`; the website and client use the same values. The filename follows the owner's requested `color-pallete.png` spelling.

## Lens coin

The lens coin is the virtual coin for AI features (decision D17: iris). Sources live in [lens-coin/](lens-coin/):

| File | Use |
| --- | --- |
| `lens-coin.svg` | 24 px and larger: balances, dialogs, the pricing page |
| `lens-coin-small.svg` | 16–20 px: disc, edge and sparkle only |
| `lens-coin-mono.svg` | Inside filled buttons and dense chips: a 1.75-stroke line coin in `currentColor` |
| `png/lens-coin-{16,32,64,128}.png` | Emails (they cannot rely on SVG); the website serves `brand/lens-coin-{32,64}.png` for them |

Never go below 14 px, keep clear space of 1/8 of the size, and do not recolor, rotate or add text. A color coin never sits inside a filled iris button (iris on iris); use the mono coin in the button's text color there. On the dark canvases (`#171820`, `#22232e`) the face stays visible without an outline ([preview](lens-coin/preview.png)). Each app inlines the paths in its own `LensCoin` component and shows prices only through `LensPrice` (or the launcher's badge in the extension).

## Exports

PNG sizes in `logo/icons/`: **16, 20, 24, 32, 40, 48, 64, 96, 128, 180, 192, 256, 384, 512 and 1024px**. PNGs retain transparency. [Windows ICO](logo/icons/icon.ico), [macOS ICNS](logo/icons/icon.icns), and [favicon ICO](logo/icons/favicon.ico) include multiple resolutions. `lensbook.iconset/` supplies the macOS source images.

| Consumer | Files / sizes |
| --- | --- |
| Extension | `src/assets/icon.png` master; WXT produces `icons/{16,32,48,64,128,256,512}.png` and manifest references during build |
| Website | Header `public/logo.webp`; `icon.png` 512px; compatibility `icon-small.png` 128px; `public/icons/` 16/32/128/180/192/512px; `favicon.ico`; `apple-touch-icon.png` 180px; manifest icons 192/512px |
| Website (lens coin) | `public/brand/lens-coin-32.png` and `-64.png`, used by the backend's billing emails |
| Desktop client | `build/icon.png` 1024px for the window/tray; `build/icon.icns` for macOS packaging; `build/icon.ico` for Windows packaging; build copies the PNG to `dist/desktop` |

## Regenerate

From the umbrella root, with website dependencies installed and macOS `iconutil` available:

```sh
node docs/branding/scripts/export.cjs
```

`node docs/branding/scripts/export.cjs lens-coin` refreshes only the lens coin PNGs. The script reads the selected source and theme palette, exports every size directly from the normalized master, creates the palette PNG/SVG, and updates app assets. Rebuild the extension to regenerate its auto-icons. Rebuild the website/client to refresh their served/bundled files. Screenshot fixtures on the website should be refreshed after logo changes. Historical validation captures and previous alternatives may contain earlier artwork.
