# Publishing runbook

[Documentation index](intro.md) · [Extension](extension.md#chrome-web-store-release) · [Backend](backend.md#deployment-and-review-version) · [Development](development.md#releases)

This runbook sets up automated Chrome Web Store publishing from scratch. Use it for a new Google account, Chrome Web Store publisher, Google Cloud project, GitHub account, or server. Once setup is done, each release is only `make deploy`.

## How a release flows

1. `make deploy` (xeploy) bumps versions, merges `develop` into `main` in each submodule, and pushes `v<version>` tags.
2. The extension's `v<version>` tag runs **Publish to Chrome Web Store** (`apps/extension/.github/workflows/publish-chrome.yml`). It builds the zip, uploads it with `wxt submit`, and submits it for review.
3. That workflow sends an `extension-submitted` `repository_dispatch` event, with the version, to `storylens-backend`.
4. The backend's **Set Review_Version** workflow (`apps/backend/.github/workflows/set-review-version.yml`) connects to the server over SSH and runs `make set-review-version VERSION=<version>`.
5. Every 10 minutes, the backend's `review-version-watcher` cron compares `Review_Version` with the version Chrome currently serves. Once Google approves and publishes the release, the two match. The cron then clears `Review_Version` and runs `make sync` to deploy the backend.

The backend therefore goes live only after the matching extension version does.

## Accounts and tools you need

- A Google account that will own the Chrome Web Store item. Use this same account for the Google Cloud project and the OAuth sign-in below.
- Admin access to the `storylens-extension` and `storylens-backend` GitHub repositories.
- SSH access to the production server that runs the backend with PM2.
- Local tools: `bun`, `gh` (logged in), and `xeploy` (`bun add -g xeploy`).

## 1. Chrome Web Store: developer account and first listing

For current listing metadata and permission explanations, see [CHROMEWEBSTORE.md](../apps/extension/CHROMEWEBSTORE.md). The [asset guide](chrome-store/README.md) provides five screenshots, a demonstration MP4 to upload to YouTube, and a reproducible local sample chapter.

The store API can only update an item that already exists, so the first version is always uploaded by hand.

1. Open the [Chrome Web Store developer dashboard](https://chrome.google.com/webstore/devconsole) with the owner account. Pay the one-time registration fee and verify the contact email.
2. Build the production zip from `apps/extension`:
   ```bash
   make release-chrome
   ```
   The zip is `.output/storylens-extension-<version>-chrome.zip`.
3. In the dashboard, click **New item** and upload that zip.
4. Complete these tabs:
   - **Store listing:** description, category, screenshots, and icon.
   - **Privacy:** single purpose, a justification for each permission (`tabs`, `storage`, `alarms`, `unlimitedStorage`, the API, loopback, and Google Analytics host permissions), data-use disclosures including configured analytics and supported-site hostnames, and the privacy policy URL from the website. Copy-ready English and Arabic text is in `apps/extension/store/`.
5. Submit the item for review.
6. Copy the 32-character **item ID** from the dashboard or the item's store URL. This is `CHROME_EXTENSION_ID`. It is public, so it doesn't need to be a secret.

## 2. Google Cloud: OAuth client for the store API

Use the Google account that owns the store item.

1. In the [Google Cloud console](https://console.cloud.google.com), create a project (for example `storylens`).
2. Go to **APIs & Services → Library**, find **Chrome Web Store API**, and click **Enable**.
3. Go to **Google Auth Platform → Branding** and set:
   - app name
   - user support email
   - developer contact email

   Leave the logo empty; uploading one requires Google's brand review.
4. Go to **Google Auth Platform → Audience**:
   - Set **User type** to **External**.
   - Click **Publish app** so the status is **In production**. While the app is in **Testing**, Google revokes refresh tokens after 7 days, and the publish workflow would start failing a week later.
   - You don't need Google's verification, because only the owner signs in.
5. Go to **Google Auth Platform → Clients** (or **APIs & Services → Credentials**) and create an **OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URI, exactly: `https://developers.google.com/oauthplayground`
6. Copy the **client ID** and **client secret**.

### Troubleshooting

| Symptom | Cause and fix |
|---------|---------------|
| **Publish app** is disabled | The Branding page is incomplete. Fill in the app name, support email, and developer contact, then save. |
| `Error 400: redirect_uri_mismatch` | The client doesn't list the Playground's redirect URI, or it's a **Desktop app** client. Use a **Web application** client with the exact URI above, then wait a few minutes for the change to take effect. |
| `Error 403: access_denied` ("has not completed the Google verification process") | The app is still in **Testing** and the account isn't a test user. Publish the app. |
| "Google hasn't verified this app" | Expected for a personal app. Click **Advanced → Go to <app> (unsafe)**. |

## 3. Refresh token from the OAuth Playground

Don't use `wxt submit init`. The publishing library it uses relies on Google's copy-paste (`urn:ietf:wg:oauth:2.0:oob`) sign-in flow, which Google blocks for new clients.

1. Open the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground).
2. Click the gear icon, tick **Use your own OAuth credentials**, and paste the client ID and secret. Without this step, the token belongs to Google's demo client and is revoked after 24 hours.
3. In **Step 1**, enter the scope `https://www.googleapis.com/auth/chromewebstore` and click **Authorize APIs**.
4. Sign in as the store item's owner and allow access.
5. In **Step 2**, click **Exchange authorization code for tokens** right away; the code expires within minutes and works only once.
6. Copy the **refresh token** (it starts with `1//`). You don't need the access token. Keep the refresh token private.

## 4. Check the credentials locally

Create `apps/extension/.env.submit` (it's gitignored):

```
CHROME_EXTENSION_ID="<item id>"
CHROME_CLIENT_ID="<client id>"
CHROME_CLIENT_SECRET="<client secret>"
CHROME_REFRESH_TOKEN="<refresh token>"
```

Then run this from `apps/extension`. It checks authentication without uploading or submitting anything:

```bash
bun run submit:chrome --dry-run --chrome-zip .output/storylens-extension-<version>-chrome.zip
```

## 5. GitHub configuration

Both workflows run their job in a GitHub environment named `production`. Create that environment in each repository under **Settings → Environments**. Both workflow files must also be on each repository's default branch, `main`: GitHub only runs `repository_dispatch` workflows from the default branch.

### Extension repository (`storylens-extension`)

| Name | Kind | Value |
|------|------|-------|
| `CHROME_EXTENSION_ID` | Variable | Store item ID from step 1 |
| `CHROME_CLIENT_ID` | Secret | OAuth client ID from step 2 |
| `CHROME_CLIENT_SECRET` | Secret | OAuth client secret from step 2 |
| `CHROME_REFRESH_TOKEN` | Secret | Refresh token from step 3 |
| `BACKEND_DISPATCH_TOKEN` | Secret | Fine-grained GitHub token (see below) |

- **Deployment branches and tags:** releases run from `v*` tags. If the environment is limited to `main`, add a tag rule for `v*` as well.
- **`BACKEND_DISPATCH_TOKEN`:** create it under **GitHub → Settings → Developer settings → Fine-grained tokens**.
  - Resource owner: the backend repository's owner.
  - Repository access: only `storylens-backend`.
  - Permission: **Contents: Read and write** (required by the dispatch API).
  - Pick an expiry and note when to renew it.
- **New GitHub owner or repo name:** update `repos/Hussain7Abbas/storylens-backend` in the **Notify backend** step of `publish-chrome.yml`.

### Backend repository (`storylens-backend`)

| Name | Kind | Value |
|------|------|-------|
| `DEPLOY_SSH_HOST` | Secret | Server hostname or IP |
| `DEPLOY_SSH_USER` | Secret | User that owns the backend checkout and PM2 process |
| `DEPLOY_SSH_KEY` | Secret | Private key of a dedicated deploy key pair |
| `DEPLOY_SSH_PORT` | Secret (optional) | SSH port, default `22` |
| `BACKEND_PATH` | Secret | Absolute path to the backend checkout on the server |

- **Deploy key:** create a dedicated key pair, add the public key to that user's `~/.ssh/authorized_keys` on the server, and store the private key as `DEPLOY_SSH_KEY`:
  ```bash
  ssh-keygen -t ed25519 -f storylens-deploy -C github-actions -N ""
  ```
- **Deployment branches:** the dispatch-triggered run happens on `main`, so allowing `main` is enough.

## 6. Server

1. Clone the backend repository and check out `main`. `make sync` pulls whatever branch is checked out.
2. Copy `.env.example` to `.env` and fill it in. Include `CHROME_EXTENSION_ID="<item id>"`, which the cron needs to look up the store version.
3. Install `bun` in `~/.bun/bin`. The SSH step adds that directory to `PATH`.
4. Run the one-time setup from the backend directory:
   ```bash
   bash deploy/setup-pm2.sh
   ```
   It installs dependencies, generates the Prisma client, applies migrations, and starts PM2. Then run `pm2 startup` and the command it prints, so the API starts on boot.
5. From then on, deploy only with `make sync`, and manage the process with `make pm2-start`, `make pm2-stop`, `make pm2-restart`, and `make pm2-delete`. `make sync` doesn't install dependencies; run `make install` first when a release changes them.
6. Check readiness:
   ```bash
   curl -s https://storylens-api.iscoded.com/health/ready
   ```
   Expect `services.chromeStore.status` to be `ok` and `versions.store` to be the version Chrome currently serves. If `chromeStore` is `unconfigured`, `CHROME_EXTENSION_ID` is missing from `.env`.

## 7. First automated release

1. From the umbrella root, run `make deploy` and follow xeploy's prompts. Make sure the extension's version was bumped, because Chrome rejects a version it has already received.
2. In the extension repository's **Actions** tab, check that **Publish to Chrome Web Store** passes, including the **Notify backend** step.
3. In the backend repository's **Actions** tab, check that **Set Review_Version** passes. Then `/health/ready` should show `versions.review` as the new version.
4. After Google approves the item, the backend deploys within about 10 minutes. `versions.review` returns to `null`, and the server's `sync.log` in the backend directory shows the `make sync` output.

To rerun the backend step by hand, for example after fixing SSH secrets:

```bash
gh workflow run set-review-version.yml -R Hussain7Abbas/storylens-backend -f version=<version>
```

Backend-only releases, where the extension version doesn't change, never set `Review_Version`. Deploy those with `make backend-sync` on the server.

## Maintenance and troubleshooting

| Symptom | Fix |
|---------|-----|
| Publish fails with `invalid_grant` | The refresh token was revoked, left unused for six months, or issued while the app was in Testing. Repeat step 3 and update `CHROME_REFRESH_TOKEN`. |
| "Tag vX does not match package.json version Y" | Tag the commit that contains the version bump, using `v<package.json version>`. |
| "Missing .output/…-chrome.zip" | `make release-chrome` didn't produce the zip for the current version; check the build step. |
| Job refused by environment protection rules | Allow the triggering ref (the `v*` tag, or `main`) under the `production` environment's deployment branches and tags. |
| **Notify backend** fails with 403 or 404 | `BACKEND_DISPATCH_TOKEN` has expired, lacks Contents write, doesn't include `storylens-backend`, or the repo path in the workflow is wrong. |
| Backend never deploys after the store publishes | Check `/health/ready`. `chromeStore` should be `ok`, and `versions.review` and `versions.store` should match. Also check that the server tracks `main` and that PM2 runs with `NODE_ENV=production`. Then check `sync.log`. |
