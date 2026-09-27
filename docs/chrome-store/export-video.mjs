import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { locale } from "./capture-locales.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const output = resolve(here, "assets", locale === "ar" ? "ar" : "");
const recordings = resolve(here, "recordings", locale === "ar" ? "ar" : "");
const capture = JSON.parse(await readFile(resolve(recordings, "capture.json"), "utf8"));
const start = capture.chapters[0].seconds;
const formatTime = seconds => {
  const ms = Math.round(seconds * 1000);
  return `${String(Math.floor(ms / 3600000)).padStart(2, "0")}:${String(Math.floor(ms / 60000) % 60).padStart(2, "0")}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`;
};
const subtitles = capture.chapters.map((chapter, i) => {
  const from = Math.max(0, chapter.seconds - start);
  const to = (capture.chapters[i + 1]?.seconds ?? capture.duration) - start;
  return `${i + 1}\n${formatTime(from)} --> ${formatTime(to)}\n${chapter.title}\n`;
}).join("\n");
await writeFile(resolve(output, "storylens-demo.srt"), subtitles);
const textFilters = capture.chapters.map((chapter, i) => {
  const from = Math.max(0, chapter.seconds - start);
  const to = (capture.chapters[i + 1]?.seconds ?? capture.duration) - start;
  const title = chapter.title.replaceAll("'", "");
  return `drawtext=text='${title}':fontsize=20:fontcolor=white:x=(w-tw)/2:y=h-30:enable='between(t,${from},${to})'`;
});
const captionInputs = [];
let filter = ["drawbox=x=0:y=ih-43:w=iw:h=43:color=0x202132:t=fill", ...textFilters].join(",");
let filterArguments = ["-vf", filter];
if (locale === "ar") {
  // Chromium supplies Arabic shaping and bidi ordering regardless of which
  // optional text-rendering libraries the user's FFmpeg build includes.
  const require = createRequire(resolve(here, "../../apps/website/package.json"));
  const { chromium } = require("@playwright/test");
  const browser = await chromium.launch({ channel: "chromium" });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 43 }, deviceScaleFactor: 1 });
    await page.setContent('<html lang="ar" dir="rtl"><style>html,body{margin:0;background:#202132;color:white;font:22px Arial,sans-serif}body{height:43px;display:flex;align-items:center;justify-content:center}</style><body></body></html>');
    for (const [i, chapter] of capture.chapters.entries()) {
      await page.evaluate(title => { document.body.textContent = title; }, chapter.title);
      const filename = resolve(recordings, `caption-${i}.png`);
      await page.screenshot({ path: filename });
      captionInputs.push("-i", filename);
    }
  } finally {
    await browser.close();
  }
  filter = capture.chapters.map((chapter, i) => {
    const from = Math.max(0, chapter.seconds - start);
    const to = (capture.chapters[i + 1]?.seconds ?? capture.duration) - start;
    const previous = i === 0 ? "0:v" : `caption${i - 1}`;
    return `[${previous}][${i + 1}:v]overlay=x=0:y=main_h-overlay_h:enable='between(t,${from},${to})'[caption${i}]`;
  }).join(";");
  filterArguments = ["-filter_complex", filter, "-map", `[caption${capture.chapters.length - 1}]`];
}
const result = spawnSync(process.env.FFMPEG ?? "ffmpeg", [
  "-y", "-hide_banner", "-loglevel", "error", "-ss", String(start), "-i", capture.videoPath,
  ...captionInputs, ...filterArguments,
  "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", "30", "-an", "-movflags", "+faststart",
  resolve(output, "storylens-demo.mp4"),
], { encoding: "utf8" });
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(result.stderr);
console.log(`Exported ${locale} storylens-demo.mp4 and matching captions.`);
