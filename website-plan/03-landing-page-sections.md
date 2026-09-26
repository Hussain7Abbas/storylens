# Phase 3 — Landing page sections and content

[Global tracker](main.md) · **Status: In progress** · **Estimate: 8 points** · **Dependencies: phase 2, decisions D7–D8**

## User story

As a web-novel reader, I want to understand within seconds what Story Lens does for me, see it working, trust how it treats my data, and install it with one click.

## Section plan (in page order)

Build every section **static first**: complete, readable, and accessible with no JavaScript animation. Phase 4 adds motion on top.

| # | Section (`id`) | Purpose | Content |
| --- | --- | --- | --- |
| 1 | Hero (`#top`) | Say what it is and drive install | Headline and subline from the copy deck. Primary CTA "Add to Chrome" (+ Firefox per D7). Secondary CTA "See it in action" → `#demo`. Supported browsers and "English & العربية" chips. Visual: static poster of the lens scene (phase 4 replaces it on capable devices) |
| 2 | Problem (`#why`) | Relate to the reader | Hundreds of characters, inconsistent translated names, losing track across chapters. Three short pain points with small illustrations |
| 3 | Features (`#features`) | Show the value | Bento grid: Character coloring (aliases, versions, tooltips), Text replacements, Chapter detection, In-page launcher and text picker, Offline and sync, AI page summaries. Each card has an icon, a two-line description, and a real screenshot or mini mock |
| 4 | Interactive demo (`#demo`) | Prove it | Original sample passage (phase 0). Toggle chips: "Highlight characters", "Apply replacements", "Show tooltip". Works without GSAP (toggles only). Phase 4 turns it into a pinned scroll sequence |
| 5 | How it works (`#how`) | Lower the barrier | 1) Install the extension. 2) Open a supported novel site; the lens appears. 3) Add characters and replacements, or use shared ones, and read. Numbered, as an ordered list |
| 6 | Desktop companion (`#companion`) | Explain the optional AI summaries | "Use your own Claude Code or Codex login, running on your computer." macOS and Windows download buttons (D8, with an "unsigned build" note while that is true). 4-step pairing summary. Link to the client README |
| 7 | Privacy at a glance (`#privacy`) | Build trust | 4 plain statements taken from the phase 5 inventory (for example: summaries run locally through your own provider; the extension sends a page's HTML only for chapter detection or a summary you request; no ads, no selling data). Link to the full policy |
| 8 | FAQ (`#faq`) | Handle objections | Accessible accordion. Which sites are supported? Is it free? Do I need an account (guest vs registered)? Does it work offline? Which AI does it use and who pays? Is my reading history collected? Arabic support? Firefox? Also output `FAQPage` JSON-LD |
| 9 | Final CTA (`#install`) | Convert | Short restated promise, store buttons, GitHub link |

## Tasks

- [ ] Build each section as a server component in `src/components/sections/`. Add `"use client"` only for interactive parts (demo toggles, accordion if it is not `<details>`, mobile menu).
- [ ] Use one `h1` (the hero), one `h2` per section, and `h3` in cards. Each section has `aria-labelledby`.
- [ ] Demo component: the passage is plain text in the messages. Highlights are `<mark>` elements with `data-keyword` and category tokens. Replacements swap text visibly and are announced with `aria-live="polite"`. The tooltip is a real accessible popover (`role="tooltip"`, triggered by focus and hover). The demo must never use real novel text.
- [ ] Screenshots: capture from a real extension build on the sample page (`apps/extension/public/chapter-sample.html` or a safe demo page) in both themes and languages. Export as AVIF/WebP through `next/image` with explicit sizes, meaningful `alt` text, and `priority` only for the hero poster.
- [ ] Icons: one consistent icon set chosen in the design system (for example Lucide), imported per icon for tree-shaking.
- [ ] Store buttons: follow Chrome Web Store and Firefox badge guidelines. Links go through `site-config` and use `rel="noopener"`. Disable or hide unavailable stores (D7).
- [ ] Client download buttons: detect the OS only to *highlight* the matching button. Always show both. Link to the GitHub Releases `latest` asset or release page (D8).
- [ ] Put all copy in `en.json` and `ar.json`. Review the Arabic in context for tone, numerals, and punctuation, and check line length and wrapping in RTL.
- [ ] Write empty and failure states: images that fail to load keep their layout, and there is a noscript-friendly baseline.
- [ ] Add a UI UX Pro Max review pass: run the skill's landing and UX checks on the built page and fix what they find, recording the results.

## Acceptance criteria

- [ ] With JavaScript disabled, all sections render with full content, and the demo shows its "highlighted" state by default.
- [ ] Each claim traces to the phase 0 feature inventory, and the privacy statements match phase 5 exactly.
- [ ] No layout overflow from 320 px to 1920 px in either locale. Tap targets are at least 44×44 px.
- [ ] Hero LCP element is the headline text or poster image, preloaded correctly.
- [ ] Store and download links resolve to the correct live URLs, or are clearly marked "coming soon".

## Validation record

2026-09-27: All nine landing sections implemented, original passage with interactive toggles, bilingual source-grounded FAQs and JSON-LD. Verified Chrome ID from production; public listing returned HTTP 200. No desktop release found; setup/source links used. Real extension screenshot assets are outstanding; illustrations are clearly documented as mock UI.

Detailed evidence: `apps/website/design-system/validation/README.md`. Checkboxes remain unticked unless every listed condition was verified; implemented core behavior is recorded above.
