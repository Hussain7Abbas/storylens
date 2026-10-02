import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile, writeFile, mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { locale, labels } from "./capture-locales.mjs";
const sample = await import(`./${labels.data}`);

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const require = createRequire(resolve(root, "apps/website/package.json"));
const { chromium } = require("@playwright/test");
const output = resolve(here, "assets", locale === "ar" ? "ar" : "");
const recordings = resolve(here, "recordings", locale === "ar" ? "ar" : "");
await mkdir(recordings, { recursive: true });
await mkdir(output, { recursive: true });
const chapter = await readFile(resolve(here, labels.chapter));
const server = createServer((_request, response) => { response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); response.end(chapter); });
await new Promise(resolve => server.listen(labels.port, "127.0.0.1", resolve));
const extension = resolve(root, "apps/extension/.output/chrome-mv3");
const profile = await mkdtemp(resolve(tmpdir(), "storylens-store-"));
const context = await chromium.launchPersistentContext(profile, {
  channel: "chromium", headless: false,
  viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, colorScheme: "light",
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`, "--no-first-run", "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1"],
  recordVideo: process.argv.includes("--preview") ? undefined : { dir: recordings, size: { width: 1280, height: 800 } },
});
// The sample account and catalogue are local fixtures. Block all external traffic,
// including production API requests from the extension's service worker.
await context.addInitScript(language => {
  if (location.protocol === "chrome-extension:") localStorage.setItem("locale", JSON.stringify(language));
}, locale);
await context.route("**/*", route => {
  const url = new URL(route.request().url());
  return url.protocol === "chrome-extension:" || url.hostname === "127.0.0.1" ? route.continue() : route.abort();
});
let worker = context.serviceWorkers()[0];
if (!worker) worker = await context.waitForEvent("serviceworker");
const extensionId = new URL(worker.url()).hostname;
await worker.evaluate(async ({ novel, selector, locale, launcherX }) => {
  await chrome.storage.local.set({
    "storylens-onboarding-completed": true,
    "storylens-auth": JSON.stringify({ user: { id: "sample-reader", name: "Sample Reader", username: "sample-reader", email: "reader@example.invalid", isGuest: false, role: null, permissions: [] }, token: "local-sample-only" }),
    "storylens-website-selector-cache:127.0.0.1": selector,
    "storylens-analytics-enabled": false,
    // Isolated offline billing fixtures demonstrate the real Cloud controls without making an AI request.
    "storylens-ai-source": "cloud",
    "storylens-lens-balance": {userId: "sample-reader", balance: 128, updatedAt: Date.now()},
    "storylens-ai-pricing": {fetchedAt: Date.now(), data: {currency: "USD", available:true, lensPriceUsd:"0.01", lensPriceMicros:10000, trialLenses:10, request:{min:100,max:50000,pendingMax:3}, cloudAi:{enabled:true}, features:[
      ["page_summary",2,"Summarize page","تلخيص الصفحة"], ["keyword_suggestion",1,"Keyword suggestion","اقتراح الكلمات"], ["chapter_extraction",4,"Chapter extraction","استخراج شخصيات الفصل"], ["character_image",3,"Character image","صورة الشخصية"], ["novel_context",0,"Novel research","البحث عن الرواية"], ["selector_detection",0,"Selector detection","كشف المحددات"],
    ].map(([key,lenses,nameEn,nameAr])=>({key,lenses,nameEn,nameAr,enabled:true,maxPromptChars:40000,descriptionEn:null,descriptionAr:null}))}},
    "storylens-locale": locale,
    "storylens-page-launcher-position": { x: launcherX, y: 102 },
  });
}, { novel: sample.novel, selector: sample.selector, locale, launcherX: labels.launcherX });
const setup = await context.newPage();
await setup.goto(`chrome-extension://${extensionId}/popup.html`);
await setup.waitForTimeout(1500);
// The sample rows use one `name`/`description`; the extension stores them per language.
const field = locale === "ar" ? "Ar" : "En";
const named = ({ name, description, ...row }) => ({ nameAr: null, nameEn: null, ...row, [`name${field}`]: name, ...(description === undefined ? {} : { description }) });
const sampleNovel = (({ name, description, downloadedAt: _downloadedAt, ...row }) => ({ ...row, nameAr: null, nameEn: null, descriptionAr: null, descriptionEn: null, context: null, [`name${field}`]: name, [`description${field}`]: description }))(sample.novel);
await setup.evaluate(async (data) => {
  // The extension's `storylens` database exists once the popup opened; write the
  // sample as server rows (snapshot tables) and mark the novel downloaded.
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open("storylens");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const tables = {
    novels: [data.novel],
    keywords: data.keywords.map(({ aliases: _aliases, versions: _versions, ...keyword }) => keyword),
    keywordAliases: data.aliases,
    keywordVersions: data.versions,
    replacements: data.replacements,
    keywordCategories: data.categories,
    keywordNatures: data.natures,
    novelSync: [{ novelId: data.novel.id, pinned: 1, downloadedAt: Date.now(), lastPulledAt: Date.now(), lastFullPullAt: Date.now() }],
  };
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(Object.keys(tables), "readwrite");
    for (const [table, rows] of Object.entries(tables)) for (const row of rows) transaction.objectStore(table).put(row);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}, { novel: sampleNovel, keywords: sample.keywords.map(named), aliases: sample.aliases.map(named), versions: sample.versions, replacements: sample.replacements, categories: sample.categories, natures: sample.natures });
await setup.close();
context.setDefaultTimeout(10000);
const page = await context.newPage();
try {
const startedAt = Date.now();
const chapters = [];
const mark = title => { chapters.push({ seconds: (Date.now() - startedAt) / 1000, title }); };
page.on("console", message => { if (message.text().includes("[StoryLens]")) console.log(message.text()); });
await page.goto(`http://127.0.0.1:${labels.port}/novels/the-lantern-archive/chapters/12`);
await page.locator("#storylens-page-launcher #launcher").waitFor();
await page.waitForTimeout(1500);
const resetScroll = async () => { await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(250); };
const capture = async name => { await resetScroll(); await page.screenshot({ path: resolve(output, `${name}.png`) }); console.log(`Captured ${name}`); };
if (process.argv.includes("--preview")) {
  await context.setOffline(true);
  await page.locator("#storylens-page-launcher #launcher").click();
  await page.frameLocator("#storylens-page-launcher iframe").getByText(labels.rowan, { exact: true }).waitFor({ state: "attached" });
  await page.screenshot({ path: resolve(recordings, "preview.png") });
  console.log(`Sample ${locale} extension running at http://127.0.0.1:${labels.port}/novels/the-lantern-archive/chapters/12. Close the browser or stop this command when finished.`);
  await new Promise(resolve => context.once("close", resolve));
  server.close();
  process.exit(0);
}
mark(labels.captions[0]);
const initialReplacement = await page.locator(".storylens-replaced").innerText();
if (initialReplacement !== labels.replacement) throw new Error("Sample replacement did not run");
await page.waitForTimeout(3000);
await page.locator("#storylens-page-launcher #launcher").click();
await page.waitForTimeout(2000);
await resetScroll();
const popup = page.frameLocator("#storylens-page-launcher iframe");
await page.locator('[data-keyword-id="rowan"]').nth(1).hover();
await page.waitForTimeout(1600);
await capture("01-character-highlighting");
mark(labels.captions[1]);
await popup.locator(`input[placeholder="${labels.search}"]:visible`).fill(labels.alias);
await page.waitForTimeout(1500);
await resetScroll();
await page.locator('[data-keyword-id="rowan-cartographer"]').first().hover();
await page.waitForTimeout(1200);
// Hover preserves the open popup while showing the alias reference.
await page.waitForTimeout(1600);
await capture("02-character-aliases");
mark(labels.captions[2]);
await popup.locator(`input[placeholder="${labels.search}"]:visible`).fill(labels.mira);
await page.waitForTimeout(1500);
await resetScroll();
await page.locator('[data-keyword-id="mira"]').nth(1).hover();
await page.waitForTimeout(1200);
// The filtered popup displays both chapter versions alongside the active tooltip.
await page.waitForTimeout(1600);
await capture("03-chapter-versions");
mark(labels.captions[3]);
await popup.getByRole("tab", { name: labels.replacing, exact: true }).click();
await page.waitForTimeout(1600);
await page.mouse.move(810, 100);
await page.waitForTimeout(800);
await capture("04-text-replacement");
mark(labels.captions[4]);
await popup.getByRole("tab", { name: labels.coloring, exact: true }).click();
await popup.locator(`input[placeholder="${labels.search}"]:visible`).fill(labels.mira);
await page.waitForTimeout(1000);
await popup.getByText(labels.mira, { exact: true }).click();
await page.waitForTimeout(1500);
await popup.locator(".mantine-Loader-root:visible").first().waitFor({ state: "hidden" });
await capture("05-character-editor");
await page.waitForTimeout(3000);
await popup.getByRole("button", { name: labels.cancel, exact: true }).click();
await popup.locator(`input[placeholder="${labels.search}"]:visible`).fill(labels.rowan);
await page.waitForTimeout(1000);
await popup.getByText(labels.rowan, { exact: true }).click();
await context.setOffline(true);
mark(labels.captions[5]);
await popup.getByLabel(labels.description, { exact: true }).fill(labels.savedNote);
await page.waitForTimeout(1800);
await popup.getByRole("button", { name: labels.save, exact: true }).click();
await popup.getByRole("tab", { name: labels.coloring, exact: true }).waitFor();
await resetScroll();
await page.locator('[data-keyword-id="rowan"]').nth(1).hover();
await page.getByText(labels.savedNote, { exact: true }).waitFor();
// The saved edit waits in the outbox (`mutations`) until the browser is online.
const pendingOps = await worker.evaluate(() => new Promise((resolve, reject) => {
  const request = indexedDB.open("storylens");
  request.onerror = () => reject(request.error);
  request.onsuccess = () => {
    const all = request.result.transaction("mutations").objectStore("mutations").getAll();
    all.onsuccess = () => resolve(all.result);
    all.onerror = () => reject(all.error);
  };
}));
if (!pendingOps.some(operation => operation.entity === "keywordVersion" && operation.patch.description === labels.savedNote)) throw new Error("Saved note was not queued for synchronization");
const evidence = { highlightedKeywords: await page.locator(".storylens-keyword").count(), replacement: initialReplacement, savedNote: await page.locator("#storylens-keyword-tooltip-root").innerText(), queuedOperations: pendingOps.length };
console.log("Verified local edit", evidence);
await page.waitForTimeout(5000);
const videoPath = await page.video().path();
await context.close();
server.close();
await writeFile(resolve(recordings, "capture.json"), JSON.stringify({ videoPath, chapters, duration: (Date.now() - startedAt) / 1000, evidence }, null, 2));
console.log(JSON.stringify({ videoPath, profile, extensionId }));
} catch (error) {
  await page.screenshot({ path: resolve(recordings, "error.png") }).catch(() => {});
  console.error(await page.locator("#storylens-page-launcher iframe").count() ? await page.frameLocator("#storylens-page-launcher iframe").locator("body").innerText().catch(() => "") : "Popup closed");
  throw error;
} finally {
  await context.close();
  server.close();
}
