#!/usr/bin/env node
/**
 * Performance Trace JSON → measures.csv 用メトリクス集計
 * Usage: node scripts/analytics/aggregate-playback-trace.mjs <trace.json> [--steady]
 */
import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const steadyOnly = args.includes("--steady");
const tracePath = args.find((a) => !a.startsWith("--"));

if (!tracePath) {
  console.error(
    "Usage: node scripts/analytics/aggregate-playback-trace.mjs <trace.json> [--steady]"
  );
  process.exit(1);
}

const abs = path.resolve(tracePath);
const raw = JSON.parse(fs.readFileSync(abs, "utf8"));
const ev = raw.traceEvents || [];

let ts0 = Infinity;
let ts1 = -Infinity;
for (const e of ev) {
  if (e.ts) {
    if (e.ts < ts0) ts0 = e.ts;
    if (e.ts > ts1) ts1 = e.ts;
  }
}

const sum = (arr) => arr.reduce((s, e) => s + (e.dur || 0), 0);
const maxD = (arr) => arr.reduce((m, e) => Math.max(m, e.dur || 0), 0);

const layerAll = ev.filter((e) => e.name === "Layerize" && e.dur);
const buckets = {};
for (const e of layerAll) {
  const s = Math.floor((e.ts - ts0) / 1e6);
  buckets[s] = (buckets[s] || 0) + 1;
}
const steadySecs = Object.entries(buckets)
  .filter(([, c]) => c >= 55 && c <= 65)
  .map(([s]) => +s)
  .sort((a, b) => a - b);

let winStart = ts0 + 2e6;
let winEnd = ts0 + 20e6;
let windowLabel = "2-20s";

if (steadyOnly && steadySecs.length > 0) {
  winStart = ts0 + steadySecs[0] * 1e6;
  winEnd = ts0 + (steadySecs[steadySecs.length - 1] + 1) * 1e6;
  windowLabel = `steady ${steadySecs[0]}-${steadySecs[steadySecs.length - 1]}s`;
}

const mid = ev.filter((e) => e.ts >= winStart && e.ts <= winEnd);
const layer = mid.filter((e) => e.name === "Layerize" && e.dur);
const gaps = [];
for (let i = 1; i < layer.length; i++) {
  gaps.push((layer[i].ts - layer[i - 1].ts) / 1000);
}
gaps.sort((a, b) => a - b);
const gapMed = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 0;

const scrollEv = mid.filter(
  (e) => /scroll/i.test(e.name || "") || /Scroll/i.test(e.cat || "")
);
const io = mid.filter(
  (e) => e.name === "IntersectionObserverController::computeIntersections" && e.dur
);
const decode = mid.filter((e) => e.name === "ImageDecodeTask" && e.dur);
const paint = mid.filter((e) => e.name === "Paint" && e.dur);
const dropped = mid.filter((e) => e.name === "DroppedFrame");
const durSec = Math.max(1, (winEnd - winStart) / 1e6);

const result = {
  file: path.basename(abs),
  duration_s: +((ts1 - ts0) / 1e6).toFixed(1),
  window: windowLabel,
  layerize_sum_ms: Math.round(sum(layer) / 1000),
  layerize_med_ms: layer.length
    ? +(sum(layer) / layer.length / 1000).toFixed(2)
    : null,
  layerize_max_ms: +(maxD(layer) / 1000).toFixed(2),
  layerize_per_s: +(layer.length / durSec).toFixed(1),
  gap_med_ms: +gapMed.toFixed(1),
  paint_sum_ms: Math.round(sum(paint) / 1000),
  decode_max_ms: +(maxD(decode) / 1000).toFixed(1),
  scroll_events_per_s: +(scrollEv.length / durSec).toFixed(0),
  io_sum_ms: Math.round(sum(io) / 1000),
  io_per_s: +(io.length / durSec).toFixed(0),
  dropped_per_s: +(dropped.length / durSec).toFixed(2),
  steady_seconds: steadySecs.length
    ? `${steadySecs[0]}-${steadySecs[steadySecs.length - 1]}`
    : "none",
};

console.log(JSON.stringify(result, null, 2));
