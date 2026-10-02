// Real local API/database/browser integration, with test-only email and AI.
// Run with `node scripts/lenses-e2e.mjs`; requires the backend's local Postgres.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const app = (name) => resolve(root, "apps", name);
const require = createRequire(resolve(app("website"), "package.json"));
const { chromium, expect } = require("@playwright/test");
const scratch = await mkdtemp(resolve(tmpdir(), "storylens-lenses-e2e-"));
const database = `storylens_lenses_e2e_${Date.now().toString(36)}`;
const container =
  process.env.STORYLENS_E2E_POSTGRES_CONTAINER ?? "postgres-storylens";
const apiOrigin = "http://localhost:7041";
const website = "http://localhost:4173";
const dashboard = "http://localhost:4174";
const children = [];
const logs = new Map();
let context,
  browser,
  createdDatabase = false;
const checks = [];
const pass = (name) => {
  checks.push(name);
  console.log(`PASS ${name}`);
};
let cleaning;
function cleanup() {
  cleaning ??= (async () => {
    await context?.close().catch(() => {});
    await browser?.close().catch(() => {});
    for (const child of children)
      if (child.exitCode === null) {
        try {
          process.kill(-child.pid, "SIGTERM");
        } catch {}
      }
    for (const [name, content] of logs)
      await writeFile(resolve(scratch, `${name}.log`), content);
    if (createdDatabase)
      await run(
        "drop-db",
        "docker",
        [
          "exec",
          container,
          "sh",
          "-c",
          'dropdb --force -U "$POSTGRES_USER" "$1"',
          "sh",
          database,
        ],
        root,
      );
  })();
  return cleaning;
}
for (const [signal, code] of [
  ["SIGINT", 130],
  ["SIGTERM", 143],
]) {
  process.once(signal, () => {
    void cleanup().finally(() => process.exit(code));
  });
}

function start(name, command, args, cwd, env = {}) {
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, ...env },
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  children.push(child);
  logs.set(name, "");
  for (const stream of [child.stdout, child.stderr])
    stream.on("data", (data) =>
      logs.set(name, logs.get(name) + data.toString()),
    );
  return child;
}
async function run(name, command, args, cwd, env) {
  const child = start(name, command, args, cwd, env);
  const code = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", resolve);
  });
  await writeFile(resolve(scratch, `${name}.log`), logs.get(name));
  if (code !== 0)
    throw new Error(`${name} failed (${code}); see ${scratch}/${name}.log`);
}
async function until(check, message, timeout = 60_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(message);
}
async function ready(url) {
  await until(
    async () => {
      try {
        return (await fetch(url)).ok;
      } catch {
        return false;
      }
    },
    `Server did not start: ${url}`,
    120_000,
  );
}
async function freePort(port) {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", () =>
      reject(new Error(`Local integration needs port ${port} free`)),
    );
    server.listen(port, "localhost", resolve);
  });
  await new Promise((resolve) => server.close(resolve));
}
async function api(path, { method = "GET", body, token } = {}) {
  const response = await fetch(`${apiOrigin}${path}`, {
    signal: AbortSignal.timeout(15_000),
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Client-Version": "extension/3.3.1",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json();
  assert.ok(
    response.ok,
    `${method} ${path}: ${response.status} ${JSON.stringify(result)}`,
  );
  return result;
}
async function codeSince(offset) {
  let code;
  await until(() => {
    code = logs
      .get("backend")
      .slice(offset)
      .match(/\n(\d{6})\n/)?.[1];
    return Boolean(code);
  }, "Development email code missing");
  return code;
}
async function signIn(page, email, password) {
  await page.goto(`${website}/en/profile/login/`);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Sign out", exact: true }),
  ).toBeVisible();
}
async function runtime(page, type, data) {
  return page.evaluate(
    async ({ type, data }) => {
      const reply = await chrome.runtime.sendMessage({
        id: Math.floor(Math.random() * 1e9),
        type,
        data,
        timestamp: Date.now(),
      });
      if (reply?.err) throw new Error(reply.err.message);
      return reply?.res;
    },
    { type, data },
  );
}
async function auth(worker) {
  return worker.evaluate(async () => {
    const stored = (await chrome.storage.local.get("storylens-auth"))[
      "storylens-auth"
    ];
    return stored ? JSON.parse(stored) : null;
  });
}

try {
  await Promise.all([7041, 4173, 4174].map(freePort));
  await run(
    "create-db",
    "docker",
    [
      "exec",
      container,
      "sh",
      "-c",
      'createdb -U "$POSTGRES_USER" "$1"',
      "sh",
      database,
    ],
    root,
  );
  createdDatabase = true;
  start(
    "backend",
    "bun",
    ["test/helpers/browser-e2e-server.ts"],
    app("backend"),
    { STORYLENS_E2E_DATABASE: database },
  );
  await Promise.all([
    run("website-build", "bun", ["run", "build"], app("website"), {
      NEXT_PUBLIC_API_URL: apiOrigin,
      NEXT_PUBLIC_GA_MEASUREMENT_ID: "",
    }),
    run("dashboard-build", "bun", ["run", "build"], app("dashboard"), {
      VITE_API_URL: apiOrigin,
    }),
    run(
      "extension-build",
      "bunx",
      ["wxt", "build", "--mode", "development"],
      app("extension"),
      {
        NODE_ENV: "development",
        WXT_API_URL: apiOrigin,
        WXT_WEBSITE_URL: website,
        WXT_GA_MEASUREMENT_ID: "",
        WXT_GA_API_SECRET: "",
      },
    ),
  ]);
  await until(
    () => logs.get("backend").includes("STORYLENS_BROWSER_E2E_READY"),
    "Backend fixture failed; see backend.log",
  );
  start("website", "bunx", ["serve", "out", "-l", "4173"], app("website"));
  start(
    "dashboard",
    "bunx",
    ["vite", "preview", "--port", "4174", "--strictPort"],
    app("dashboard"),
  );
  await Promise.all([ready(`${website}/en/`), ready(`${dashboard}/login`)]);

  // A website-only reader registers with the real emailed-code flow.
  browser = await chromium.launch({ channel: "chromium", headless: true });
  const standalone = await browser.newContext({ reducedMotion: "reduce" });
  const page = await standalone.newPage();
  const email = "reader@example.test",
    password = "local-reader-password";
  await page.goto(`${website}/en/profile/register/`);
  await page.getByLabel("Username", { exact: true }).fill("e2ereader");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  const codeOffset = logs.get("backend").length;
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Verification code").fill(await codeSince(codeOffset));
  await page.getByRole("button", { name: "Verify email" }).click();
  const congratulations = page.getByRole("dialog", {
    name: "Congratulations!",
  });
  await expect(congratulations).toBeVisible();
  await expect(congratulations).toContainText("10 lenses");
  await congratulations
    .getByRole("button", { name: "Close", exact: true })
    .click();
  const cookie = (await standalone.cookies(apiOrigin)).find(
    (item) => item.name === "sl_web",
  );
  assert.equal(cookie?.httpOnly, true);
  assert.equal(cookie?.sameSite, "Strict");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await signIn(page, email, password);
  pass(
    "website-only registration, trial, HttpOnly session, sign-out and sign-in",
  );
  await standalone.close();
  await browser.close();
  browser = undefined;

  const extension = resolve(app("extension"), ".output/chrome-mv3-dev");
  const manifest = JSON.parse(
    await readFile(resolve(extension, "manifest.json"), "utf8"),
  );
  assert.ok(manifest.host_permissions.includes("http://localhost/*"));
  context = await chromium.launchPersistentContext(
    resolve(scratch, "chrome-profile"),
    {
      channel: "chromium",
      headless: false,
      viewport: { width: 1280, height: 900 },
      reducedMotion: "reduce",
      args: [
        `--disable-extensions-except=${extension}`,
        `--load-extension=${extension}`,
        "--no-first-run",
        "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1",
      ],
    },
  );
  context.setDefaultTimeout(15_000);
  context.setDefaultNavigationTimeout(30_000);
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    return url.protocol === "chrome-extension:" ||
      ["localhost", "127.0.0.1"].includes(url.hostname)
      ? route.continue()
      : route.abort();
  });
  const worker =
    context.serviceWorkers()[0] ??
    (await context.waitForEvent("serviceworker"));
  const extensionId = new URL(worker.url()).hostname;
  // A signed-out protected profile may already have redirected to login.
  await until(
    () =>
      context.pages().some((p) => p.url().startsWith(`${website}/en/profile/`)),
    "First install did not open the local profile",
  );
  const web = context.pages().find((p) => p.url().startsWith(website));
  const guest = await api("/api/user/auth/guest", {
    method: "POST",
    body: { username: "E2eGuest" },
  });
  await worker.evaluate(
    async (session) =>
      chrome.storage.local.set({
        "storylens-auth": JSON.stringify(session),
        "storylens-onboarding-completed": true,
        "storylens-analytics-enabled": false,
        "storylens-ai-source": "cloud",
      }),
    guest,
  );
  await signIn(web, email, password);
  await expect(
    web.getByText("The extension in this browser uses this account."),
  ).toBeVisible();
  const first = await auth(worker);
  assert.equal(first.user.email, email);
  assert.equal(first.user.isGuest, false);
  pass("first-install website and real extension guest/account handoff");

  // Register another account through the API, then test both real account choices.
  const otherEmail = "other@example.test";
  const otherOffset = logs.get("backend").length;
  await api("/api/user/auth/register", {
    method: "POST",
    body: { email: otherEmail, username: "e2eother", password },
  });
  const other = await api("/api/user/auth/register/verify", {
    method: "POST",
    body: { email: otherEmail, code: await codeSince(otherOffset) },
  });
  await worker.evaluate(
    async (session) =>
      chrome.storage.local.set({ "storylens-auth": JSON.stringify(session) }),
    other,
  );
  await expect(
    web.getByRole("button", { name: `Use ${email} in the extension` }),
  ).toBeVisible();
  await web
    .getByRole("button", { name: `Use ${email} in the extension` })
    .click();
  await until(
    async () => (await auth(worker))?.user.email === email,
    "Website choice failed",
  );
  await worker.evaluate(
    async (session) =>
      chrome.storage.local.set({ "storylens-auth": JSON.stringify(session) }),
    other,
  );
  await web
    .getByRole("button", { name: `Switch this site to ${otherEmail}` })
    .click();
  await expect(web.getByText(otherEmail, { exact: true })).toBeVisible();
  await web
    .getByRole("dialog", { name: "Congratulations!" })
    .getByRole("button", { name: "Close", exact: true })
    .click();
  pass(
    "both account-choice branches across real cookies and the extension bridge",
  );
  await web.getByRole("button", { name: "Sign out", exact: true }).click();
  await until(
    async () => !(await auth(worker))?.token,
    "Sign-out did not clear extension session",
  );
  await signIn(web, email, password);
  await expect(
    web.getByText("The extension in this browser uses this account."),
  ).toBeVisible();
  pass(
    "shared-account sign-out clears both sessions without automatic re-adoption",
  );

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await runtime(popup, "refreshAiBilling");
  const trial = popup.getByRole("dialog", { name: "Congratulations!" });
  await expect(trial).toBeVisible();
  await expect(trial).toContainText("10 lenses");
  await trial.getByRole("button", { name: "Close", exact: true }).click();
  await popup.reload();
  await runtime(popup, "refreshAiBilling");
  await expect(
    popup.getByRole("dialog", { name: "Congratulations!" }),
  ).toHaveCount(0);
  pass("extension trial celebrates once despite the website already seeing it");

  await web.goto(
    `${website}/en/profile/balance/?need=20&feature=page_summary&from=extension#request`,
  );
  await web.getByLabel("Lenses", { exact: true }).fill("100");
  await web.getByLabel("WhatsApp number").fill("+9647701234567");
  await web.getByLabel("Note (optional)").fill("Local billing rehearsal");
  await web.getByRole("button", { name: "Send request", exact: true }).click();
  await expect(
    web.getByRole("heading", { name: "Request sent" }),
  ).toBeVisible();
  const admin = await context.newPage();
  await admin.goto(`${dashboard}/login`);
  await admin.getByLabel("Email").fill("owner@example.test");
  await admin.getByLabel("Password").fill("local-browser-owner-password");
  await admin.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(admin.getByRole("heading", { name: "Overview" })).toBeVisible();
  await admin.goto(`${dashboard}/billing-requests`);
  const pending = admin
    .getByRole("row")
    .filter({ hasText: "Local billing rehearsal" });
  const whatsapp = pending.getByRole("link", { name: "+9647701234567" });
  await expect(whatsapp).toBeVisible();
  const chatUrl = new URL(await whatsapp.getAttribute("href"));
  assert.equal(
    chatUrl.origin + chatUrl.pathname,
    "https://wa.me/9647701234567",
  );
  assert.ok(chatUrl.searchParams.get("text").includes("100 lenses ($1.00)"));
  await pending.getByRole("button", { name: "Approve", exact: true }).click();
  await admin
    .getByRole("dialog", { name: "Approve this request?" })
    .getByRole("button", { name: "Approve and add lenses" })
    .click();
  await expect(
    admin.getByRole("dialog", { name: "Approve this request?" }),
  ).not.toBeVisible();
  await expect(
    admin.getByRole("tab", { name: "Approved1", exact: true }),
  ).toBeVisible();
  await web.reload();
  await expect(web.getByText("Your 100 lenses have arrived.")).toBeVisible();
  await popup.reload();
  await runtime(popup, "refreshAiBilling");
  const purchase = popup.getByRole("dialog", { name: "Congratulations!" });
  await expect(purchase).toBeVisible();
  await expect(purchase).toContainText("100 lenses");
  await purchase.getByRole("button", { name: "Close", exact: true }).click();
  await popup.reload();
  await runtime(popup, "refreshAiBilling");
  await expect(
    popup.getByRole("dialog", { name: "Congratulations!" }),
  ).toHaveCount(0);
  assert.ok(logs.get("backend").includes("https://wa.me/9647701234567"));
  assert.ok(
    logs.get("backend").includes("Your request was approved: 100 lenses"),
  );
  pass(
    "website WhatsApp request, dashboard approval, ledger and independent purchase notices",
  );

  const reader = await auth(worker);
  const balance = async () =>
    api("/api/user/billing/balance?surface=extension", { token: reader.token });
  const before = (await balance()).balance;
  assert.equal(before, 110);
  const adminToken = await admin.evaluate(() =>
    localStorage.getItem("storylens-dashboard-token"),
  );
  const novel = await api("/api/admin/novels/", {
    method: "POST",
    token: adminToken,
    body: { nameEn: "Local AI integration novel" },
  });
  let charged = 0;
  const pricing = await api("/api/user/billing/pricing");
  for (const feature of [
    "page_summary",
    "keyword_suggestion",
    "chapter_extraction",
    "novel_context",
    "selector_detection",
  ]) {
    const input = {
      source: "cloud",
      requestId: crypto.randomUUID(),
      actionId: crypto.randomUUID(),
      attempt: 1,
      feature,
      prompt: "Local fixture request in English.",
      responseLanguage: "en",
      model: "codex",
      effort: "low",
      ...(feature === "novel_context" ? { novelId: novel.id } : {}),
    };
    const result = await runtime(popup, "executeAiPrompt", input);
    assert.equal(result?.ok, true, JSON.stringify(result));
    assert.equal(result.value, "A local fixture answer in English.");
    const price = pricing.features.find((row) => row.key === feature).lenses;
    charged += price;
    assert.equal((await balance()).balance, before - charged);
    const retry = await runtime(popup, "executeAiPrompt", {
      ...input,
      attempt: 2,
      requestId: crypto.randomUUID(),
      prompt: "Correct the language to English.",
    });
    assert.equal(retry?.ok, true, JSON.stringify(retry));
    assert.equal((await balance()).balance, before - charged);
  }
  const image = await runtime(popup, "generateAiImage", {
    source: "cloud",
    requestId: crypto.randomUUID(),
    actionId: crypto.randomUUID(),
    prompt: "A fictional character.",
  });
  assert.equal(image?.ok, true, JSON.stringify(image));
  assert.equal(image.value.mimeType, "image/jpeg");
  assert.ok(image.value.revisedPrompt);
  charged += pricing.features.find(
    (row) => row.key === "character_image",
  ).lenses;
  assert.equal((await balance()).balance, before - charged);
  pass(
    "all six Cloud background/API routes and free same-action corrections (simulated provider)",
  );

  const cancelling = {
    source: "cloud",
    requestId: crypto.randomUUID(),
    actionId: crypto.randomUUID(),
    attempt: 1,
    feature: "page_summary",
    prompt: "[e2e:cancel]",
    responseLanguage: "en",
    model: "codex",
    effort: "low",
  };
  const running = runtime(popup, "executeAiPrompt", cancelling);
  await until(
    async () => (await balance()).balance === before - charged - 2,
    "Cancellation action did not charge",
  );
  await runtime(popup, "cancelAiPrompt", cancelling.requestId);
  const cancelled = await running;
  assert.equal(cancelled?.ok, false);
  await until(
    async () => (await balance()).balance === before - charged,
    "Cancellation did not refund",
  );
  pass("browser cancellation reaches provider and refunds the charged lenses");

  await web.reload();
  await web.getByLabel("Lenses", { exact: true }).fill("100");
  await web.getByRole("radio", { name: "Telegram", exact: true }).check();
  await web.getByLabel("Telegram username or number").fill("@fixture_reader");
  await web.getByLabel("Note (optional)").fill("Local rejection rehearsal");
  await web.getByRole("button", { name: "Send request", exact: true }).click();
  await expect(
    web.getByRole("heading", { name: "Request sent" }),
  ).toBeVisible();
  await admin.goto(`${dashboard}/billing-requests`);
  const telegram = admin
    .getByRole("row")
    .filter({ hasText: "Local rejection rehearsal" });
  await expect(
    telegram.getByRole("link", { name: "@fixture_reader" }),
  ).toHaveAttribute("href", "https://t.me/fixture_reader");
  await telegram.getByRole("button", { name: "Reject", exact: true }).click();
  const rejection = admin.getByRole("dialog", { name: "Reject this request?" });
  await rejection
    .getByLabel("Reason")
    .fill("Payment not received in local rehearsal");
  await rejection
    .getByRole("button", { name: "Reject request", exact: true })
    .click();
  await expect(rejection).not.toBeVisible();
  await web.reload();
  await expect(
    web.getByText("Reason: Payment not received in local rehearsal"),
  ).toBeVisible();
  assert.ok(logs.get("backend").includes("https://t.me/fixture_reader"));
  assert.ok(
    logs.get("backend").includes("Payment not received in local rehearsal"),
  );
  assert.equal((await balance()).balance, before - charged);
  pass(
    "Telegram contact and dashboard rejection reach website history and development email",
  );

  await admin.goto(`${dashboard}/users?search=e2ereader`);
  await admin
    .getByRole("button", { name: "Gift lenses to e2ereader", exact: true })
    .click();
  const gift = admin.getByRole("dialog", {
    name: "Gift lenses to e2ereader",
    exact: true,
  });
  await gift.getByLabel("Lenses", { exact: true }).fill("7");
  await gift.getByLabel("Note (optional)").fill("Local gift rehearsal");
  await gift.getByRole("button", { name: "Gift lenses", exact: true }).click();
  await expect(gift).not.toBeVisible();
  await web.reload();
  const webGift = web.getByRole("dialog", { name: "Congratulations!" });
  await expect(webGift).toContainText("7 lenses");
  await webGift.getByRole("button", { name: "Close", exact: true }).click();
  await popup.reload();
  await runtime(popup, "refreshAiBilling");
  const extensionGift = popup.getByRole("dialog", { name: "Congratulations!" });
  await expect(extensionGift).toContainText("7 lenses");
  await extensionGift
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await web.reload();
  await popup.reload();
  await runtime(popup, "refreshAiBilling");
  await expect(
    web.getByRole("dialog", { name: "Congratulations!" }),
  ).toHaveCount(0);
  await expect(
    popup.getByRole("dialog", { name: "Congratulations!" }),
  ).toHaveCount(0);
  await admin
    .getByRole("button", {
      name: "Correct e2ereader's lens balance",
      exact: true,
    })
    .click();
  const correction = admin.getByRole("dialog", {
    name: "Correct e2ereader's balance",
    exact: true,
  });
  await correction.getByLabel("Change", { exact: true }).fill("1");
  await correction
    .getByLabel("Reason", { exact: true })
    .fill("Local ledger correction");
  await correction
    .getByRole("button", { name: "Save correction", exact: true })
    .click();
  await expect(correction).not.toBeVisible();
  await web.reload();
  await popup.reload();
  await runtime(popup, "refreshAiBilling");
  assert.equal((await balance()).balance, before - charged + 8);
  await expect(
    web.getByRole("dialog", { name: "Congratulations!" }),
  ).toHaveCount(0);
  await expect(
    popup.getByRole("dialog", { name: "Congratulations!" }),
  ).toHaveCount(0);
  pass(
    "dashboard gift celebrates once per app; positive ledger corrections do not celebrate",
  );
  await run(
    "ledger-audit",
    "bun",
    ["test/helpers/browser-e2e-server.ts", "--audit"],
    app("backend"),
    { STORYLENS_E2E_DATABASE: database },
  );
  pass("final database audit: every balance matches its ledger");

  await writeFile(
    resolve(scratch, "result.json"),
    JSON.stringify(
      {
        date: new Date().toISOString(),
        checks,
        provider: "simulated",
        email: "development log only",
        database,
      },
      null,
      2,
    ),
  );
  console.log(`Evidence: ${scratch}`);
} catch (error) {
  console.error(error);
  console.error(`Evidence: ${scratch}`);
  if (context)
    for (const [index, page] of context.pages().entries()) {
      await page
        .screenshot({
          path: resolve(scratch, `failure-${index}.png`),
          timeout: 2_000,
        })
        .catch(() => {});
      await writeFile(
        resolve(scratch, `failure-${index}.txt`),
        `${page.url()}\n${await page
          .locator("body")
          .innerText({ timeout: 2_000 })
          .catch(() => "")}`,
      ).catch(() => {});
    }
  process.exitCode = 1;
} finally {
  await cleanup();
}
