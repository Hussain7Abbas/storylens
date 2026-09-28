# Story Lens dashboard

[Documentation index](intro.md) · [Backend permissions](backend.md#portals-roles-and-permissions)

`apps/dashboard` is the independent public `storylens-dashbaord` repository, the fifth submodule. It is a Vite + React single-page app for the backend's dashboard API (`/api/admin`), served as static files by Nginx at [storylens-dashbaord.iscoded.com](https://storylens-dashbaord.iscoded.com). Source uses PolyForm Noncommercial 1.0.0.

## What it manages

- **Overview:** reader, guest and dashboard account counts, new accounts this week, catalogue totals, newest accounts and novels.
- **Users:** search and filter every account by access and role; create verified accounts with reader access, dashboard access (the only way to grant it), or both, each with its own role; edit name, username, email, the shared password, and each access and role; sign a user out everywhere; delete users. The API refuses to change your own dashboard access or role, delete yourself, or remove the last super admin.
- **Roles:** dashboard and reader roles with user and permission counts. The role editor lists every permission of the role's portal grouped by resource, with method, route and description, filter, per-group toggles and select all/clear. Super Admin is read-only because it always holds every dashboard permission; system roles can't be deleted, nor can roles that still have users.
- **Novels:** search, sort, create, edit (cover upload, slugs, description, AI context) and delete, with keyword, chapter and replacement counts.
- **Configs:** add, edit and delete runtime key–value configs such as `Review_Version`.
- **Account:** own display name, username and password.

There is no registration page. `make backend-seed-dashboard-admin` gives `DASHBOARD_ADMIN_EMAIL` super-admin dashboard access: if a reader account already uses that email it keeps its password and reader access, so the same sign-in works in the extension and here; otherwise a dashboard-only account is created from `DASHBOARD_ADMIN_USERNAME` and `DASHBOARD_ADMIN_PASSWORD`. Everyone else gets dashboard access on the Users page.

Navigation, pages and buttons follow the signed-in role's permissions (`can()` in `src/lib/auth.tsx`, keys in `src/lib/permissions.ts`); the API enforces them regardless. A role without the overview permission lands on its first allowed page.

## Design

The dashboard uses the website's Ink & Iris identity: the same light/dark tokens, Inter, Lucide icons at 1.75 stroke, iris primary actions and the Lensbook logo. `apps/dashboard/design-system/MASTER.md` records how the admin layout applies it; the vendored UI UX Pro Max skill supplied the minimal, dense dashboard structure, while its palette and fonts were rejected for Ink & Iris. Light, dark and system themes, reduced motion, keyboard focus, 44px coarse-pointer targets and no page-level horizontal scroll at phone widths are covered.

## Development and checks

`make dev-dashboard` serves it at http://localhost:3040 against `VITE_API_URL`. `make dashboard-orval` regenerates `src/api/generated/` from a running backend (`ORVAL_API_URL`); only `Admin: …` tags are generated. `make dashboard-typecheck`, `dashboard-lint`, `build-dashboard` and `dashboard-test` (Playwright + axe on Chromium desktop and mobile with a mocked API; `CHROMIUM_PATH` selects a preinstalled browser) are the checks.

## Production

- DNS: Cloudflare A record `storylens-dashbaord.iscoded.com`, proxied, to the same server as the website (`178.105.43.174`), created with `flarectl` like the website's.
- Server: `ssh raseen`, checkout `/srv/storylens-dashbaord` on `main`, releases in `/var/www/storylens-dashbaord/releases` with a `current` symlink.
- `make sync` (as root in the checkout) pulls `main`, installs with Bun, builds with the Node LTS in `/opt/storylens-node/bin`, activates the release, installs `deploy/nginx/storylens-dashbaord.iscoded.com.conf`, requests a Let's Encrypt certificate through `deploy/nginx/bootstrap.conf` on the first run, checks `/login` and rolls back on failure. The five newest releases are kept.
- Nginx sends a strict CSP (scripts and styles from self; API calls only to `https://storylens-api.iscoded.com`), `noindex`, long-lived caching for hashed `/assets/`, and falls back to `index.html` for client routes.
- The backend must be deployed with the role and access migrations and `DASHBOARD_ADMIN_*` set, then `make seed-dashboard-admin` run once in `/srv/storylens-backend`.
