# Chrome Web Store demonstration assets

[Documentation index](../intro.md) · [Publishing](../publishing.md) · [Listing metadata](../../apps/extension/CHROMEWEBSTORE.md)

These assets show the real Story Lens 2.0.3 production build from the working tree in Chromium with original sample fiction. The chapter is a local reading website, not an imitation of the extension UI. All extension panels, highlights, tooltips, filtering, forms and replacement output come from the production build. An offline save issue discovered during recording was fixed in the local database hooks before the final captures; no demonstration-only UI was added.

## Upload files

`storylens-store-assets.zip` contains the English set. `storylens-store-assets-ar.zip` contains the Arabic set. `storylens-store-assets-en-ar.zip` contains both in separate `en/` and `ar/` folders. Each language has five screenshots, one MP4 and captions.

English files are in `assets/`; Arabic files are in `assets/ar/`, with the same filenames. Use each set for its corresponding localized store listing.

Upload the five PNGs in the corresponding folder to the store's screenshot section. Each is 1280 × 800, RGB with no transparency:

1. `01-character-highlighting.png`: category colors, character details and detected chapter.
2. `02-character-aliases.png`: a search for Cartographer finds Rowan and his alias.
3. `03-chapter-versions.png`: Mira's original and chapter 12 notes, with the active note in the page tooltip.
4. `04-text-replacement.png`: the saved jade pendant → starlight pendant rule and actual changed page text.
5. `05-character-editor.png`: the real character editing form.

`storylens-demo.mp4` is one silent walkthrough with explanatory captions. It shows the five features above, then edits Rowan's description offline, saves it through the extension, and verifies the updated tooltip. Upload it to YouTube and paste the resulting URL into the store's promotional video field. The store accepts a YouTube link rather than an MP4 file. `storylens-demo.srt` contains the same captions for reuse.

Requirements were checked against Google's [listing guide](https://developer.chrome.com/docs/webstore/cws-dashboard-listing) and [image guide](https://developer.chrome.com/docs/webstore/images). Captures are available in English and Arabic. The Arabic chapter, catalogue entries, extension interface and video captions are Arabic, and the page and popup use right-to-left layout. AI outputs are not included because this isolated demonstration has no paired AI provider.

## Reproduce or try the demonstration

Prerequisites: Bun, Node.js, the installed extension and website dependencies, Playwright Chromium, and FFmpeg with H.264 and drawtext support for the MP4 export. There is no root package installation.

From the umbrella root:

```sh
cd apps/extension
bun run build
cd ../..
cd apps/website
bunx playwright install chromium
cd ../..
node docs/chrome-store/capture.mjs
node docs/chrome-store/export-video.mjs
```

For the Arabic set, run `node docs/chrome-store/capture.mjs --ar` followed by `node docs/chrome-store/export-video.mjs --ar`. Arabic captions are rendered by Chromium before video encoding, so connected glyphs and right-to-left order do not depend on optional FFmpeg text libraries.

Set `FFMPEG=/absolute/path/to/ffmpeg` for the export if it is not on PATH. To keep the sample browser open for manual interaction instead of capturing it:

```sh
node docs/chrome-store/capture.mjs --preview
```

Add `--ar` to the preview command to try Arabic.

Each run creates a disposable browser profile, loads the actual unpacked production extension, and serves `chapter.html` on `127.0.0.1:4178` (English) or `chapter-ar.html` on `127.0.0.1:4179` (Arabic). It seeds the corresponding `sample-data.mjs` or `sample-data-ar.mjs` into the extension's normal local storage and IndexedDB. The fictional session is only a local fixture; it is not a real registered account. The sample catalogue is marked downloaded so the existing offline data path can read it. The fixtures never enter the store ZIP or a user's normal Chrome profile.

The browser blocks external DNS resolution and the capture also blocks external requests. The recorded edit runs with the browser explicitly offline and remains queued locally. Preview mode is also offline after the chapter loads. Do not reuse this profile to sign in or sync; close it when finished. Stop the running command to stop the local server. Raw recordings and local capture metadata are ignored; only the deliverable video, captions and five screenshots belong in `assets/`.

## Verification

The website reuses these sessions in its localized `ReadingShowcase` section. Its optimized WebP screenshots are in `apps/website/public/images/reading/`, and its MP4/WebVTT files are in `apps/website/public/videos/extension/`. Export the website MP4 from the original raw `capture.json` video with the same start offset but **without** the store video's caption burn-in; the website displays a timed top-center caption overlay with a dimmed blurred background. Trim the last WebVTT cue to end just before the actual website MP4 duration so it fades away. When recapturing, update both website locales, responsive screenshot sizes, caption tracks, and the walkthrough transcripts together. See [the website guide](../website.md#extension-screenshots-and-main-deployment).

The capture checks that the local edit returns to the Coloring tab and that the new Rowan description appears in the page tooltip. Capture metadata records the highlighted keyword count and actual replacement text. The screenshots and sampled video frames were visually inspected. Both sets of five PNGs were verified as 1280 × 800, 8-bit RGB without alpha; both MP4s were verified as H.264, 30 fps and 1280 × 800. Eight synchronization regression tests passed after the offline hook fix. All four submodules passed `bun run typecheck` after this asset task.
