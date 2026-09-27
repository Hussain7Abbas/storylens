# Phase 0 — Discovery and design system (UI UX Pro Max)

[Global tracker](main.md) · **Status: In progress** · **Estimate: 3 points** · **Dependencies: none**

## User story

As the product owner, I want a documented design system, sitemap, wireframes, and copy deck before any code is written, so the site looks consistent and says only true things about Story Lens.

## Skill setup

The **UI UX Pro Max** skill is **not installed** on this machine (checked 2026-09-26). Install it for this project before designing. Use one of these, and confirm the current commands in the skill's README:

- Claude Code plugin: `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill`, then `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill`.
- CLI installer: `npm i -g uipro-cli`, then `uipro init --ai claude` inside `apps/website` after phase 1 scaffolds it.

The skill uses a Python search script over style, color, typography, UX, and landing-page databases. Expected usage, which must be checked against the installed `SKILL.md`:

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "browser extension web novel reading tool literary" --design-system -p "Story Lens" --persist
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "landing hero social proof install CTA" --domain landing
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "scroll animation reduced motion" --domain ux
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "arabic latin serif pairing" --domain typography
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "nextjs tailwind" --stack nextjs
```

Save the output to `apps/website/design-system/MASTER.md`, with page overrides in `design-system/pages/{landing,legal}.md`. Until phase 1 creates the repository, keep drafts in the scratchpad and move them in during phase 1.

## Design hypothesis (to be validated or replaced by the skill)

- **Personality:** a literary, calm, precise reading companion. Editorial, not "AI startup neon".
- **Approved palette:** Ink & Iris, replacing the initial amber direction. Neutral light/dark surfaces and a violet primary unify website and extension UI. Inter supplies UI headings; serif is reserved for the website reading example. Reader-defined highlights remain independent. The active values and rules are in `apps/website/design-system/MASTER.md`; existing logo assets stay in place until the owner supplies the replacement.
- **Type idea:** an expressive serif for display (for example Fraunces or Newsreader), a neutral sans for UI and body (for example Inter or Geist), and a matched Arabic face (for example IBM Plex Sans Arabic, or Noto Naskh Arabic for display). All self-hosted through `next/font`.
- **Signature visual:** a lens that brings highlighted names into focus on a page of text. It ties together the name, the 3D hero, and the scroll demo.

## Tasks

- [ ] Install the skill and record the version or commit used in the validation record.
- [ ] Brand audit: collect the extension icons and logo (`apps/extension/public/icons`, `_locales`), the current store description, the Ink & Iris launcher tokens, and the popup's Mantine theme colors. Record hex values and usage rules.
- [ ] Run the skill's design-system generation. Accept, adjust, or reject each recommendation, and write the reason next to any rejection in `MASTER.md`.
- [ ] Define tokens: color roles for light and dark (bg, surface, text, muted, border, accent, focus, highlight-1…n), type scale (fluid `clamp()`), spacing, radius, shadow, motion durations and easings, z-index, breakpoints. Check that every text/background pair meets WCAG AA (4.5:1 body, 3:1 large text and UI).
- [ ] Define motion principles: purpose (explain, not decorate), duration ranges, easing names, stagger rules, what reduced motion replaces each effect with, and a performance limit (animate only transform and opacity).
- [ ] Information architecture and sitemap: `/[locale]`, `/[locale]/privacy`, `/[locale]/terms`, 404. The header links to page anchors; the footer links to legal pages and repositories.
- [ ] Low-fidelity wireframes for mobile (375 px) and desktop (1440 px) for each landing section and the legal page template (TOC sidebar on desktop, collapsible on mobile). Include an RTL mirror of the hero.
- [ ] Copy deck (`design-system/copy-deck.md`): headline options, section copy, CTA labels, FAQ. Every feature claim must cite its source doc or code path (see the feature inventory below). Arabic copy is written for Arabic readers, not machine-translated line by line.
- [ ] Choose the demo text: write an **original** short fantasy passage with named characters for the highlight and replacement demo. Never copy real novel text.
- [ ] List the assets needed: extension screenshots (popup Coloring/Replaces/AI tabs, in-page launcher, tooltip, summary panel), desktop client window, store badges (check each store's badge usage guidelines), OG image concepts.

## Feature inventory (source of truth for claims)

| Feature | Source | Notes for copy |
| --- | --- | --- |
| Keyword/character coloring with categories, natures, aliases, versions, tooltips | `docs/extension.md`, backend keyword routes | The main visual in the demo |
| Text replacements (From → To) | `docs/extension.md` | For example, fixing inconsistent translated names |
| Chapter detection per website (AI selector detection) | backend `src/routes/ai.ts`, `src/lib/ai` | Sends page URL and HTML to the backend → OpenRouter. Disclose this |
| In-page launcher, drag, text picker | `docs/extension.md` | Works on supported novel sites |
| Fuzzy search across characters and replacements | `docs/extension.md` | |
| Offline download, queued edits, sync | `docs/extension.md` | |
| Page summaries through the desktop companion using the user's own Claude Code or Codex login | `docs/client.md` | Runs locally. The provider receives page HTML. No Story Lens server is involved |
| English and Arabic UI | extension i18n | |
| Chrome and Firefox builds | `wxt.config.ts`, Makefile | Show Firefox only if the store listing is live (D7) |
| Source available, PolyForm Noncommercial | `LICENSE.md` | Do not call it "open source" |

## Acceptance criteria

- [ ] `MASTER.md` contains tokens for both themes, typography for both scripts, motion rules, and component rules. Each skill recommendation has a recorded decision.
- [ ] Wireframes cover every section at mobile and desktop widths, and the hero in RTL.
- [ ] Each claim in the copy deck links to a source in the feature inventory. No unsupported claims remain (for example "open source", "free forever", user counts, or ratings).
- [ ] Contrast checks pass for all planned token pairs.

## Validation record

2026-09-27: UI UX Pro Max vendored at commit 823b0a14d3539b5d78c0efb614426a4fab5983ec; MASTER, recommendation decisions, page overrides, original bilingual copy, wireframes, and inventory committed. Final axe checks pass contrast. Real extension screenshot collection remains outstanding; illustrative reading mock is labeled in the copy deck.

Detailed evidence: `apps/website/design-system/validation/README.md`. Checkboxes remain unticked unless every listed condition was verified; implemented core behavior is recorded above.
