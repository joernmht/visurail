#!/usr/bin/env node
/* Record every visual essay as a film (MP4, H.264), landscape 16:9 and portrait 9:16.

   The essay page has a film mode (?film): a timeline with a title card, every step and an end
   card, and window.__film.seek(t) renders the exact frame at time t (all animations paused).
   This script seeks frame by frame at 30 fps in headless Chromium, screenshots each frame and
   encodes them with ffmpeg. Frame-exact: smooth motion however slow the machine is.

   Usage:
     python3 -m http.server 8765 &            # from the repo root
     node scripts/record_films.js [slug ...]   # default: all entries; existing films are kept unless FORCE=1
   Needs: playwright (Chromium), ffmpeg with libx264 on PATH.
   Output: viz/<slug>/film-{16x9,9x16}.{mp4,webm} and matching .jpg posters. */
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const BASE = process.env.VISURAIL_BASE || "http://localhost:8765";
const LAYOUTS = [
  { name: "16x9", layout: "landscape", width: 1600, height: 900 },
  { name: "9x16", layout: "portrait", width: 720, height: 1280 },
];

function slugs() {
  const src = fs.readFileSync(path.join(ROOT, "assets/js/entries.js"), "utf8");
  return [...src.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
}

const FPS = 30;

async function record(browser, slug, L) {
  const done = ["mp4", "webm", "jpg"].every((x) => fs.existsSync(path.join(ROOT, "viz", slug, `film-${L.name}.${x}`)));
  if (done && !process.env.FORCE) return console.log(`${slug} ${L.name}: exists (FORCE=1 to re-record)`);
  const page = await browser.newPage({ viewport: { width: L.width, height: L.height }, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/viz/${slug}/?film&layout=${L.layout}`);
  await page.waitForFunction(() => window.__film && document.fonts.status === "loaded");
  const total = await page.evaluate(() => { window.__film.manual = true; return window.__film.total; });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `film-${slug}-`));
  const n = Math.ceil(total * FPS);
  for (let k = 0; k < n; k++) {
    await page.evaluate((t) => window.__film.seek(t), k / FPS);
    const file = path.join(dir, `f${String(k).padStart(5, "0")}.jpg`);
    for (let tries = 0; ; tries++) {
      try { await page.screenshot({ path: file, type: "jpeg", quality: 95, timeout: 60000 }); break; }
      catch (e) { if (tries >= 3) throw e; }
    }
  }
  await page.close();
  const out = path.join(ROOT, "viz", slug, `film-${L.name}.mp4`);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", path.join(dir, "f%05d.jpg"),
    "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-tune", "animation", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]);
  // WebM (VP9) as well: open-source Chromium builds cannot play H.264
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", path.join(dir, "f%05d.jpg"),
    "-c:v", "libvpx-vp9", "-crf", "36", "-b:v", "0", "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", "-pix_fmt", "yuv420p",
    out.replace(/\.mp4$/, ".webm")]);
  // poster: a frame from the middle of the first step
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", path.join(dir, `f${String(Math.round(5.5 * FPS)).padStart(5, "0")}.jpg`),
    "-q:v", "4", path.join(ROOT, "viz", slug, `film-${L.name}.jpg`)]);
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(`${slug} ${L.name}: ${n} frames, ${total.toFixed(1)} s, ${Math.round(fs.statSync(out).size / 1024)} kB`);
}

(async () => {
  const want = process.argv.slice(2);
  const list = want.length ? want : slugs();
  const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  for (const slug of list) for (const L of LAYOUTS) await record(browser, slug, L);
  await browser.close();
})();
