# Phase 5 — Privacy Policy and Terms of Use

[Global tracker](main.md) · **Status: In progress** · **Estimate: 5 points** · **Dependencies: phase 2, decisions D3–D5**

## User story

As a user, a store reviewer, or a regulator, I want a clear and accurate description of what Story Lens collects, why, where it goes, and my rights, plus fair terms for using it.

> These documents will be drafted from the verified code inventory. They are not legal advice. Recommend a professional legal review before launch, especially for the governing-law clause and EU/UK obligations.

## Step 1 — Verify the data inventory against code

Check each row in the current code (extension, backend, client, website) before writing. Record the file path and commit for each row in the validation record. Rows marked **verify** have not been confirmed yet.

| Data | Where it comes from | Where it goes | Purpose | Retention | Status |
| --- | --- | --- | --- | --- | --- |
| Email, username, name, password hash, role, email-verified flag | Registration or guest account | Backend PostgreSQL (`User`, `Account`) | Account and authentication | Until account deletion (**verify** a deletion path exists; if not, document a manual request process) | Seen in `prisma/schema.prisma` |
| Session token, IP address, user agent, expiry | Better Auth sign-in | Backend `Session` | Security and session management | Until expiry or logout (**verify** cleanup) | Seen in the schema |
| Avatar and other uploaded images | User upload | **ImgBB** (third-party image host), with the URL stored in `File` | Profile, novel, and keyword images | Until deleted (**verify** `delete_url` use) | Seen in the schema and `lib/storage` |
| Novels, keywords, aliases, versions, replacements, categories, chapters created by users | Extension | Backend | Core feature. **Verify** whether other users can see this content (shared catalogue vs private) | Account lifetime | **verify** |
| Page URL and HTML for chapter-selector detection | Extension, when detection runs (**verify** the trigger: automatic or user action) | Backend → **OpenRouter** → model provider (currently a Google Gemini model) | Detect chapter content selectors per site | **verify** whether the backend stores results (website selectors) or the raw HTML | Seen in `routes/ai.ts` |
| Website selectors and per-site bias | Extension and backend | Backend | Recognize supported sites | Indefinite (not personal) | **verify** |
| Page HTML for AI summaries | Extension, only on a "Summarize page" click | The user's **local** desktop client → the user's own Claude (Anthropic) or Codex (OpenAI) CLI account. **Not** the Story Lens backend | Page summary | The client does not log prompts or output. Provider retention follows the provider's terms | Seen in `docs/client.md` |
| Pairing token, settings, launcher position, popup visibility, language, offline novel data (IndexedDB/Dexie), sync queue | Extension | Stays **on the device** (extension storage) | Functionality and offline mode | Until uninstall or clearing | Seen in docs |
| Desktop client settings and pairing token | Client | A private file on the device | Pairing | Until uninstall | Seen in `docs/client.md` |
| Extension permissions: `tabs`, `storage`, `alarms`, `unlimitedStorage`, content scripts on http(s) pages, host access to the API and `127.0.0.1` | `wxt.config.ts` | — | Explain each permission in plain language | — | Seen in config (**verify** the content-script match patterns) |
| Browsing or reading history | — | **verify** that nothing sends a list of visited URLs beyond the rows above | — | — | **verify** |
| Website visitors | Website | Host access logs (Vercel/Cloudflare), theme and locale in `localStorage`; analytics only if D6 | Serving the site | Per the host's log retention | Depends on D2 and D6 |
| Server logs | Backend | Server | Operations and security | **verify** log content and retention | **verify** |
| Hosting location of the backend | — | **verify** provider and country (`storylens-api.iscoded.com`) | International transfers section | — | **verify** |

Also check: no ads, no selling or sharing for advertising, no data broker transfers, no use of user data for training by Story Lens. The Chrome Web Store **Limited Use** statement must be accurate.

## Step 2 — Privacy Policy structure (`/[locale]/privacy`)

1. **Summary box:** 5–6 plain-language bullets matching the landing "Privacy at a glance" section.
2. Who we are and how to contact us (D3, D4).
3. Scope: the extension, the backend API, the desktop companion, and this website.
4. What we collect and why, split by component (from the inventory). Include "Information we do **not** collect".
5. How the AI features work:
   - Chapter detection goes through OpenRouter to a model provider.
   - Summaries run on the user's device with the user's own provider account. The provider's terms and privacy policy apply, and the provider receives the page content the user chose to summarize, which may include personal data visible on that page.
6. Browser permissions explained, one line each.
7. Legal bases (GDPR/UK GDPR): contract (account and features), legitimate interests (security, site recognition), consent (optional features such as summaries).
8. Sharing and processors: ImgBB, OpenRouter and its upstream model provider, hosting providers, and Anthropic/OpenAI only through the user's own account. No selling. Legal disclosure only when required.
9. International transfers.
10. Retention table.
11. Security measures (hashed passwords, HTTPS, loopback-only desktop service with a pairing token, no logging of prompts in the client) and the limits of security.
12. Your rights: access, correction, deletion, export, objection, withdrawing consent, complaints to a supervisory authority. How to use them, and response time (30 days). Include a note for California/CCPA (no sale or sharing).
13. Children (D5).
14. Store disclosures:
    - Chrome Web Store user-data statement: user data is used only to provide the extension's single purpose and features, is not sold, is not used for advertising, and is not used to determine creditworthiness or for lending. The Google APIs "Limited Use" wording applies only if Google APIs are ever used.
    - The matching Firefox add-on data-collection disclosure.
15. Changes to this policy: notification method, `lastUpdated`, and a version changelog.

## Step 3 — Terms of Use structure (`/[locale]/terms`)

1. Acceptance and eligibility (age from D5; people acting for an organization).
2. The service: extension, API, desktop companion, and website. Features may change.
3. Accounts: guest vs registered, accurate information, credential security, one person per account.
4. **Software license:** the source is available under PolyForm Noncommercial 1.0.0. Commercial use needs permission. Link to `LICENSE.md`. These terms cover use of the hosted service.
5. **User content:** the user keeps ownership. The user grants a limited license to host and display it as needed to run the service (**and to other users if content is shared**, per the inventory). The user is responsible for having the rights to it.
6. **Third-party websites and content:** Story Lens does not host, copy, or distribute novels. It changes only how pages look in the user's own browser. Users must follow the terms of the sites they read and copyright law. No affiliation with any novel site.
7. Acceptable use: no scraping or abuse of the API, no circumventing security, no uploading unlawful or infringing content (including full chapter text), no harassment through shared names or descriptions, no automated mass account creation.
8. **AI features:** output may be inaccurate. Summaries use the user's own Claude Code or Codex account, and costs, limits, and terms are between the user and that provider. Do not summarize pages whose content you are not allowed to send to a third party.
9. Desktop companion: runs locally; unsigned builds carry OS warnings; the user is responsible for installing provider CLIs.
10. Availability, beta features, changes, and suspension or termination (by the user by deleting the account or uninstalling; by us for violations).
11. Intellectual property: the Story Lens name and logo; feedback license.
12. Disclaimers ("as is") and limitation of liability, respecting non-waivable consumer rights.
13. Indemnity (reasonable in scope).
14. Governing law and disputes (D4).
15. Changes to the terms, contact, and `lastUpdated`.

## Step 4 — Implementation tasks

- [ ] Complete the inventory with the file paths checked. Resolve every **verify** row, or reword the policy to avoid claiming it.
- [ ] Write `content/legal/en/privacy.mdx` and `terms.mdx` with frontmatter `title`, `lastUpdated` (ISO), `version`, and `changelog`.
- [ ] Arabic versions `content/legal/ar/*.mdx`: a careful human-quality translation, with a notice saying which language wins in a conflict (English).
- [ ] Legal page template: `Prose` typography, a sticky table of contents on desktop (a collapsible `<details>` on mobile) built from headings, anchor links on headings, a "Last updated" line formatted per locale, a print stylesheet, and no motion beyond simple fades.
- [ ] Use `site-config` values (contact, operator, URLs) inside MDX through components, so they are never duplicated.
- [ ] Cross-link from the landing footer, the privacy section, and the FAQ. Add both pages to the sitemap.
- [ ] Prepare the store listing text: Chrome "Privacy practices" tab answers (single purpose, permission justifications, data-use certifications) and the Firefox data-collection disclosure. Save them in `design-system/store-privacy-answers.md` for phase 7.

## Acceptance criteria

- [ ] Every statement in both documents maps to a verified inventory row, or to a decision (D3–D5) the user confirmed.
- [ ] The summary box, landing privacy section, and store answers agree with each other.
- [ ] English and Arabic show the same `version` and `lastUpdated`.
- [ ] Pages are static, accessible (heading order, TOC landmarks), and readable at 320 px.
- [ ] The user has reviewed and approved the final text before launch. A recommendation for professional legal review is recorded.

## Validation record

2026-09-27: Verified data inventory records source commits and code paths. Bilingual privacy/terms MDX v1.0.0, TOC and dates implemented. Owner approved operator Hussain Abbas, age 13/16 and nonexclusive mandatory applicable law. Private contact address pending; publication not yet approved with a final contact channel. Professional review recommended. No provider retention guarantees or automatic deletion claims.

Detailed evidence: `apps/website/design-system/validation/README.md`. Checkboxes remain unticked unless every listed condition was verified; implemented core behavior is recorded above.
