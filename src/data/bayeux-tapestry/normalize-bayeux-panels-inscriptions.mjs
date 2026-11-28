/**
 * One-shot normalizer: TUROLD panel removal + inscription cascade.
 * Run: node src/data/bayeux-tapestry/normalize-bayeux-panels-inscriptions.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "../..");
const extraPath = path.join(
  __dirname,
  "bayeux_panels_and_inscriptions.json"
);
const scrollPath = path.join(
  root,
  "data/scroll-metadata/scrolls/bayeux_tapestry.json"
);

const NARRATIVE_KEYS = [
  "title",
  "titleen",
  "title_zh",
  "summary",
  "actors",
  "location",
  "motifs",
  "border_motifs",
];

function fixTitleNumbers(panel) {
  const n = panel.panel_number;
  const mark = panel.embroidered_mark;
  if (typeof panel.title === "string") {
    const rest = panel.title.replace(/^場面\d+（[^）]*）：/, "");
    panel.title = `場面${n}（${mark}）：${rest}`;
  }
  if (typeof panel.titleen === "string") {
    const rest = panel.titleen.replace(/^Panel \d+ \([^)]+\):\s*/, "");
    const enMark = mark === "I." ? "I." : mark;
    panel.titleen = `Panel ${n} (${enMark}): ${rest}`;
  }
  if (typeof panel.title_zh === "string") {
    const rest = panel.title_zh.replace(/^场面\d+（[^）]*）：/, "");
    panel.title_zh = `场面${n}（${mark}）：${rest}`;
  }
}

function mergeTuroldIntoPanel10(panel10) {
  const turoldJa =
    "交渉の最中、使者たちの馬の手綱を握る小柄な人物「テュロルド」が描かれます。バイユー司教オドの側近として知られる人物の名が同じ場面に刻まれています。";
  const turoldEn =
    "During the parley, a diminutive figure labeled 'Turold' holds the reins of the Norman envoys' horses—likely a retainer of Bishop Odo of Bayeux.";
  const turoldZh =
    "谈判期间，名为“图罗尔德”的矮小侍从握着使者马匹缰绳，他被认为是巴约主教厄德的亲信。";
  if (!panel10?.summary) return;
  if (String(panel10.summary.desc || "").includes("テュロルド")) return;
  panel10.summary.desc = `${panel10.summary.desc}${turoldJa}`;
  panel10.summary.descen = `${panel10.summary.descen} ${turoldEn}`;
  panel10.summary.desc_zh = `${panel10.summary.desc_zh}${turoldZh}`;
}

function normalizePanels(panels) {
  const byNum = new Map(panels.map((p) => [p.panel_number, p]));
  const p10 = byNum.get(10);
  mergeTuroldIntoPanel10(p10);

  for (let n = 11; n <= 56; n++) {
    const target = byNum.get(n);
    const source = byNum.get(n + 1);
    if (!target || !source) throw new Error(`Missing panel ${n} or ${n + 1}`);
    for (const key of NARRATIVE_KEYS) {
      target[key] = JSON.parse(JSON.stringify(source[key]));
    }
    fixTitleNumbers(target);
  }

  const p57 = byNum.get(57);
  const p58 = byNum.get(58);
  if (!p57 || !p58) throw new Error("Missing panel 57 or 58");
  for (const key of NARRATIVE_KEYS) {
    p57[key] = JSON.parse(JSON.stringify(p58[key]));
  }
  fixTitleNumbers(p57);
  p57.slice_range = [58, 59];

  const filtered = panels.filter((p) => p.panel_number !== 58);
  if (filtered.length !== 57) {
    throw new Error(`Expected 57 panels, got ${filtered.length}`);
  }
  return filtered;
}

function normalizeInscriptions(inscriptions, validSliceNames) {
  const list = inscriptions.filter((ins) => {
    if (!ins?.sliceName || typeof ins.sliceName !== "string") return false;
    if (!validSliceNames.has(ins.sliceName)) return false;
    return true;
  });

  for (const ins of list) {
    if (ins.id === "panel-inscription-1" && ins.sliceName.endsWith("_1_01__01")) {
      ins.id = "panel-inscription-1-a";
    }
    if (ins.id === "panel-inscription-1" && ins.sliceName.endsWith("_1_01__02")) {
      ins.id = "panel-inscription-1-b";
    }
  }

  const byPanelId = new Map();
  for (const ins of list) {
    if (ins.id === "inscription-turold") continue;
    if (typeof ins.panel_id !== "number") continue;
    byPanelId.set(ins.panel_id, ins);
  }

  for (let pid = 11; pid <= 56; pid++) {
    const target = byPanelId.get(pid);
    const source = byPanelId.get(pid + 1);
    if (!target || !source) {
      throw new Error(`Missing inscription for panel_id ${pid} or ${pid + 1}`);
    }
    const keepId = target.id;
    Object.assign(target, JSON.parse(JSON.stringify(source)));
    target.id = keepId.startsWith("panel-inscription-")
      ? `panel-inscription-${pid}`
      : keepId;
    target.panel_id = pid;
  }

  byPanelId.delete(58);
  const out = list.filter((ins) => ins.panel_id !== 58);
  return out;
}

function verify(extra, validSliceNames) {
  const errors = [];
  for (const ins of extra.inscriptions) {
    if (!ins.sliceName || !validSliceNames.has(ins.sliceName)) {
      errors.push(`invalid sliceName: ${ins.id}`);
    }
  }
  const ids = new Set();
  for (const ins of extra.inscriptions) {
    if (ids.has(ins.id)) errors.push(`duplicate id: ${ins.id}`);
    ids.add(ins.id);
  }
  if (extra.panels.length !== 57) errors.push(`panels length ${extra.panels.length}`);
  const p11 = extra.panels.find((p) => p.panel_number === 11);
  if (p11?.title?.includes("テュロルド")) errors.push("panel 11 still Turold");
  if (errors.length) throw new Error(errors.join("; "));
}

const scroll = JSON.parse(fs.readFileSync(scrollPath, "utf8"));
const validSliceNames = new Set(
  scroll.emakis
    .filter((e) => e.cat === "image" && e.name)
    .map((e) => String(e.name))
);

const extra = JSON.parse(fs.readFileSync(extraPath, "utf8"));
extra.panels = normalizePanels(extra.panels);
extra.inscriptions = normalizeInscriptions(extra.inscriptions, validSliceNames);
verify(extra, validSliceNames);

fs.writeFileSync(extraPath, `${JSON.stringify(extra, null, 2)}\n`);

const lastEmaki = scroll.emakis.filter((e) => e.cat === "image").at(-1);
if (lastEmaki && lastEmaki.panel_id === 58) {
  lastEmaki.panel_id = 57;
  lastEmaki.chapter = "57";
  fs.writeFileSync(scrollPath, `${JSON.stringify(scroll, null, 2)}\n`);
}

function pickIns(idOrPred) {
  return extra.inscriptions.filter((ins) =>
    typeof idOrPred === "function" ? idOrPred(ins) : ins.id === idOrPred
  );
}

const report = {
  inscriptions_head: pickIns((i) =>
    ["panel-inscription-1-a", "panel-inscription-1-b", "panel-inscription-2"].includes(
      i.id
    )
  ).map((i) => ({
    id: i.id,
    sliceName: i.sliceName,
    x: i.x,
    name: i.name,
  })),
  inscriptions_panel10: pickIns(
    (i) => i.panel_id === 10 || i.id === "inscription-turold"
  ).map((i) => ({
    id: i.id,
    sliceName: i.sliceName,
    x: i.x,
    name: i.name,
  })),
  inscriptions_11_31: pickIns(
    (i) => i.panel_id === 11 || i.panel_id === 31
  ).map((i) => ({
    id: i.id,
    sliceName: i.sliceName,
    x: i.x,
    name: i.name,
  })),
  inscriptions_tail: pickIns((i) => i.panel_id >= 56).map((i) => ({
    id: i.id,
    sliceName: i.sliceName,
    x: i.x,
    name: i.name,
  })),
  panels: [10, 11, 31].map((n) => {
    const p = extra.panels.find((x) => x.panel_number === n);
    return { panel_number: p?.panel_number, title: p?.title };
  }),
};

console.log(JSON.stringify(report, null, 2));