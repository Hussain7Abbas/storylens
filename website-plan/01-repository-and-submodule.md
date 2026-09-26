# Phase 1 — Repository, scaffold, and submodule integration

[Global tracker](main.md) · **Status: In progress** · **Estimate: 3 points** · **Dependencies: phase 0, decision D9**

## User story

As a developer, I want `storylens-website` to be a public repository pinned at `apps/website`, with the same tooling and Makefile workflow as the other apps, so it builds and typechecks from the umbrella root.

## Tasks

### Create the public repository

- [ ] Confirm with the user before creating anything (this is a public, outward-facing action). Then run `gh repo create Hussain7Abbas/storylens-website --public --description "Story Lens landing page, privacy policy, and terms of use"`.
- [ ] Scaffold locally with `bunx create-next-app@latest storylens-website --ts --tailwind --app --src-dir --import-alias "@/*" --use-bun --no-eslint` (check the flags against the current CLI), then pin the resolved versions in `bun.lock`.
- [ ] Set up Biome to match the extension's style (tabs, quote style, import sorting). Add `.editorconfig`, `.gitignore` (`.next`, `out`, `.vercel`, `test-results`, `playwright-report`), and `.env.example` (`NEXT_PUBLIC_SITE_URL`, store IDs).
- [ ] `tsconfig.json` strict, with `noUncheckedIndexedAccess`. No `any` and no `eslint-disable`/`biome-ignore` comments. Use named exports, except where Next.js entry files require default exports.
- [ ] Add `package.json` scripts: `dev`, `build`, `start`, `typecheck` (`tsc --noEmit`), `lint` (`biome check`), `format`, `test:e2e` (Playwright), `lhci`.
- [ ] Add dependencies (latest stable at implementation time): `gsap`, `@gsap/react`, `three`, `@react-three/fiber`, `@react-three/drei`, `next-intl`, `@next/mdx` (or `next-mdx-remote` if frontmatter handling needs it). Add dev dependencies: `@biomejs/biome`, `@playwright/test`, `@axe-core/playwright`, `@lhci/cli`, `@types/three`.
- [ ] Create the website `Makefile` with the **makefile-standards** skill (required by the global instructions). Include Setup (`install`), App (`dev`, `build`, `start`), Quality (`typecheck`, `lint`, `format`), Test (`test`, `lhci`), and Deploy (`preview`, `deploy` if applicable).
- [ ] Add `AGENTS.md` (stack, commands, folder rules, design-system rule: "every visual value comes from tokens defined from `design-system/MASTER.md`", motion and 3D rules, legal-content rule) and a `CLAUDE.md` that contains only `@AGENTS.md`.
- [ ] Add `README.md` and a `LICENSE.md` that matches the umbrella's PolyForm Noncommercial license (confirm with the user; site content may use a different license).
- [ ] Move the phase 0 design-system files into `design-system/`. If the skill should be vendored, install it into `.claude/skills/` in the website repository.
- [ ] Add a CI workflow (`.github/workflows/ci.yml`): Bun install, typecheck, Biome, build, Playwright with axe, and Lighthouse CI on pull requests and on pushes to `develop` and `main`.
- [ ] Make the initial commit on `main`, create `develop` from it, and push both. Set `develop` as the working branch to match the other submodules.

### Integrate into the umbrella

- [ ] Run `git submodule add -b develop git@github.com-personal:Hussain7Abbas/storylens-website.git apps/website` and commit `.gitmodules` and the pointer.
- [ ] Root `Makefile`: add `WEBSITE := $(ROOT)/apps/website` to `CHILDREN`, `.PHONY` entries, and targets `dev-website`, `build-website`, `website` and `website-%` pass-through. Include the website in `install`, `build`, `typecheck`, and `test`. Add it to `help` under the right groups, and change "three" to "four" in help text.
- [ ] If D9 is yes, add an `apps/website` subproject to `.xeploy.json` with the same `develop`/`main` environments.
- [ ] Update umbrella docs in the same task: `AGENTS.md` (repository map, "four independent Git submodules", typecheck rule covers four), `README.md` (repositories table, layout, Makefile tables), `docs/development.md` (setup and commands), a new `docs/website.md`, and `docs/intro.md` (index link). Check that no existing text still says "three".
- [ ] Add a `.cursor/rules` entry only if the existing rules list apps one by one.

## Acceptance criteria

- [ ] `git clone --recurse-submodules` of the umbrella includes `apps/website`, and `make submodules-init` initializes it.
- [ ] From the root: `make install`, `make typecheck`, `make build`, and `make dev-website` succeed, and `make website-lint` passes through.
- [ ] Website CI passes on the first pull request to `develop`.
- [ ] Umbrella docs and instructions describe four submodules, and `make help` lists the website targets.

## Validation record

2026-09-27: Public GitHub repo created through gh; main and develop pushed. Next 16.3.6, React 19.2.8, Bun lockfile and Biome 2.4.2. Website is registered as fourth submodule. Root Makefile/docs/xeploy integration implemented. make website help and all four typechecks pass. CI workflows present; remote CI run confirmation pending.

Detailed evidence: `apps/website/design-system/validation/README.md`. Checkboxes remain unticked unless every listed condition was verified; implemented core behavior is recorded above.
