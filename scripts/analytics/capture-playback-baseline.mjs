#!/usr/bin/env node
/**
 * Step 0: 本番サーバー上で再生モード Performance Trace を取得
 *
 * 前提: npm run build && npm start （別ターミナル、PORT=3000）
 *
 * Usage:
 *   node scripts/analytics/capture-playback-baseline.mjs
 *   node scripts/analytics/capture-playback-baseline.mjs --url /kusouzumaki
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUT_DIR = path.join(
  ROOT,
  "analytics/auto-scroll/refactor lazyimage-loading"
);

const CHROME_PATHS = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
].filter(Boolean);

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const slugArg = process.argv.find((a) => a.startsWith("--url="));
const SLUG_PATH =
  slugArg ? slugArg.slice(6) : process.argv[2]?.startsWith("/") ? process.argv[2] : "/Chōjū-jinbutsu-giga_first";
const TARGET_URL = `${BASE_URL.replace(/\/$/, "")}${encodeURI(SLUG_PATH)}`;
const RECORD_MS = Number(process.env.RECORD_MS || 25000);
const SETTLE_MS = Number(process.env.SETTLE_MS || 8000);

function timestampJst() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

function findChrome() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function waitForServer(url, attempts = 30) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok || res.status === 404) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server not reachable: ${url}`);
}

async function main() {
  let puppeteer;
  try {
    puppeteer = await import("puppeteer-core");
  } catch {
    console.error(
      "puppeteer-core is required. Run: npm install --save-dev puppeteer-core"
    );
    process.exit(1);
  }

  const chromePath = findChrome();
  if (!chromePath) {
    console.error("Chrome not found. Set CHROME_PATH env var.");
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`Waiting for ${BASE_URL} ...`);
  await waitForServer(BASE_URL);

  const ts = timestampJst();
  const outFile = path.join(OUT_DIR, `Trace-step0-${ts}.json`);

  console.log(`Launching Chrome: ${chromePath}`);
  console.log(`Target: ${TARGET_URL}`);
  console.log(`Output: ${outFile}`);

  const browser = await puppeteer.default.launch({
    executablePath: chromePath,
    headless: process.env.HEADLESS === "1" ? "shell" : false,
    defaultViewport: { width: 1280, height: 800 },
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-features=ServiceWorker"],
  });

  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  let tracingStarted = false;

  try {
    const client = await page.createCDPSession();
    await client.send("ServiceWorker.enable");
    await client.send("ServiceWorker.unregister", {
      scopeURL: new URL("/", BASE_URL).href,
    }).catch(() => {});

    await page.tracing.start({
      path: outFile,
      categories: [
        "devtools.timeline",
        "disabled-by-default-devtools.timeline",
        "disabled-by-default-devtools.timeline.frame",
        "latency",
        "disabled-by-default-v8.cpu_profiler",
      ],
    });
    tracingStarted = true;

    await page.goto(TARGET_URL, { waitUntil: "networkidle2", timeout: 120000 });
    await page.waitForSelector("article", { timeout: 60000 });

    // UI 表示（idle UI / pointer-events 対策）
    await page.mouse.move(640, 400);
    await new Promise((r) => setTimeout(r, SETTLE_MS));

    const article = await page.$("article");
    if (article) {
      await article.click({ offset: { x: 100, y: 100 } });
      await new Promise((r) => setTimeout(r, 500));
    }

    await page.mouse.move(1200, 400);
    await new Promise((r) => setTimeout(r, 300));

    const playSelectors = [
      'button[aria-label="Auto-play"]',
      'button[aria-label="自動再生"]',
      '[aria-label="Auto-play"]',
      '[aria-label="自動再生"]',
    ];
    let playBtn = null;
    for (const sel of playSelectors) {
      playBtn = await page.$(sel);
      if (playBtn) break;
    }

    if (playBtn) {
      await playBtn.click();
      console.log(`Recording playback (▶ UI) for ${RECORD_MS}ms ...`);
      await new Promise((r) => setTimeout(r, RECORD_MS));
    } else {
      console.warn(
        "Play button not found — falling back to programmatic scrollLeft rAF (baseline equivalent)."
      );
      const started = await page.evaluate((recordMs) => {
        const el = document.querySelector("article");
        if (!el) return false;
        const speed = 144;
        let last = performance.now();
        let rafId = 0;
        const endAt = last + recordMs;
        const tick = (now) => {
          if (now >= endAt) return;
          const dt = Math.min((now - last) / 1000, 0.05);
          last = now;
          el.scrollLeft -= speed * dt;
          rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
        window.__playbackBaselineRaf = rafId;
        return true;
      }, RECORD_MS);
      if (!started) {
        throw new Error(`article not found on ${TARGET_URL}`);
      }
      console.log(`Recording programmatic scrollLeft for ${RECORD_MS}ms ...`);
      await new Promise((r) => setTimeout(r, RECORD_MS + 500));
    }
  } finally {
    if (tracingStarted) {
      await page.tracing.stop();
    }
    await browser.close();
  }

  console.log(`Trace saved: ${outFile}`);
  console.log("\nAggregate (--steady):");
  console.log(
    `  node scripts/analytics/aggregate-playback-trace.mjs "${outFile}" --steady`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
