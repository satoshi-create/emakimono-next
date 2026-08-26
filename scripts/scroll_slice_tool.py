#!/usr/bin/env python3
"""
scroll_slice_tool.py — Figma-free panorama trim/cut workflow (Phase A/B/C).

Subcommands:
  propose  Stitch tiles if needed, propose trim+cuts → sources/geometry.yaml
  preview  Write overlay preview.jpg (+ optional HTML strip)
  export   Crop slices → images/_raw/slice_NN.jpg
  review   Local browser UI to adjust trim/cuts and mark reviewed

Usage:
  py -3.14 scripts/scroll_slice_tool.py propose scrolls/{id}/
  py -3.14 scripts/scroll_slice_tool.py preview scrolls/{id}/
  py -3.14 scripts/scroll_slice_tool.py export scrolls/{id}/ --force
  py -3.14 scripts/scroll_slice_tool.py review scrolls/{id}/
"""

from __future__ import annotations

import argparse
import json
import sys
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT / "scripts") not in sys.path:
    sys.path.insert(0, str(REPO_ROOT / "scripts"))

from scroll_geometry import (  # noqa: E402
    DEFAULT_TARGET_ASPECT,
    build_proposed_geometry,
    export_slices,
    geometry_path,
    load_geometry,
    open_panorama,
    render_preview,
    resolve_panorama_path,
    resolve_scroll_dir,
    save_geometry,
    segments_from_geometry,
    validate_geometry,
    attach_tile_seams,
)

PREVIEW_NAME = "geometry_preview.jpg"


def cmd_propose(args: argparse.Namespace) -> int:
    scroll_dir = resolve_scroll_dir(args.scroll_path, REPO_ROOT)
    path = geometry_path(scroll_dir)
    existing = load_geometry(path) if path.is_file() and not args.reset else None

    print(f"\n=== propose geometry: {scroll_dir.name} ===")
    data = build_proposed_geometry(
        scroll_dir,
        target_aspect=args.target_aspect,
        keep_existing_cuts=args.keep_cuts,
        existing=existing,
        dry_run=args.dry_run,
        restitch=args.restitch or args.reset,
        stitch=args.stitch,
        estimate_overlaps=args.estimate_overlaps,
        keep_overlaps=args.keep_overlaps,
        tile_overlaps=(
            [int(p.strip()) for p in args.tile_overlaps.split(",") if p.strip()]
            if args.tile_overlaps
            else None
        ),
        tile_y_offsets=(
            [int(p.strip()) for p in args.tile_y_offsets.split(",") if p.strip()]
            if getattr(args, "tile_y_offsets", None)
            else None
        ),
    )
    if args.status:
        data["status"] = args.status

    errs = validate_geometry(data)
    if errs:
        print("WARNING: geometry has issues:")
        for e in errs:
            print(f"  - {e}")

    segs = segments_from_geometry(data) if not errs else []
    trim = data.get("trim") or {}
    print(f"  panorama: {data.get('panorama')}")
    print(f"  stitch: {data.get('stitch')}  order: {data.get('order')}")
    print(f"  tile_overlaps: {data.get('tile_overlaps')}")
    print(f"  tile_y_offsets: {data.get('tile_y_offsets')}")
    print(f"  trim: {trim}")
    print(f"  cuts: {len(data.get('cuts') or [])}  segments: {len(segs)}")
    print(f"  status: {data.get('status')}")
    for seg in segs:
        print(f"    [{seg.index:02d}] {seg.width}x{seg.height} @ x={seg.x0}")

    save_geometry(path, data, dry_run=args.dry_run)
    if not args.dry_run:
        print(f"  wrote {path.relative_to(scroll_dir)}")
        print("Next: preview → review/edit → export → process_figma_slices")
    return 0


def cmd_preview(args: argparse.Namespace) -> int:
    scroll_dir = resolve_scroll_dir(args.scroll_path, REPO_ROOT)
    path = geometry_path(scroll_dir)
    data = load_geometry(path)
    panorama = resolve_panorama_path(scroll_dir, data)
    if not panorama or not panorama.is_file():
        raise SystemExit("panorama missing; run propose first")

    out = Path(args.output) if args.output else scroll_dir / "sources" / PREVIEW_NAME
    if not out.is_absolute():
        out = (REPO_ROOT / out).resolve()

    print(f"\n=== preview geometry: {scroll_dir.name} ===")
    with open_panorama(panorama) as img:
        errs = validate_geometry(data, panorama_size=img.size)
        if errs:
            raise SystemExit("Invalid geometry:\n  - " + "\n  - ".join(errs))
        preview = render_preview(img, data, max_width=args.max_width)
        if args.dry_run:
            print(f"  [dry-run] Would write {out} ({preview.size[0]}x{preview.size[1]})")
        else:
            out.parent.mkdir(parents=True, exist_ok=True)
            preview.save(out, format="JPEG", quality=85, optimize=True)
            print(f"  wrote {out}")
            print("  Open in an image viewer (not Cursor chat) to judge trim/cuts.")
        preview.close()

    segs = segments_from_geometry(data)
    print(f"  segments: {len(segs)}  status={data.get('status')}")
    return 0


def cmd_export(args: argparse.Namespace) -> int:
    scroll_dir = resolve_scroll_dir(args.scroll_path, REPO_ROOT)
    data = load_geometry(geometry_path(scroll_dir))
    out = Path(args.output_dir) if args.output_dir else scroll_dir / "images" / "_raw"
    if not out.is_absolute():
        out = (REPO_ROOT / out).resolve()

    print(f"\n=== export slices: {scroll_dir.name} ===")
    if data.get("status") != "reviewed" and not args.allow_draft:
        raise SystemExit(
            "geometry status is not 'reviewed'. "
            "Mark reviewed after visual check, or pass --allow-draft."
        )

    written = export_slices(
        scroll_dir,
        data,
        output_dir=out,
        dry_run=args.dry_run,
        force=args.force,
    )
    print(f"  {len(written)} slice(s) → {out}")
    if not args.dry_run:
        rel = scroll_dir.relative_to(REPO_ROOT)
        print("Next:")
        print(f"  py -3.14 scripts/generate_contact_sheet.py {rel}/")
        print(
            f"  py -3.14 scripts/process_figma_slices.py {rel}/ "
            f"--input-dir {rel}/images/_raw --scene-text --force"
        )
    return 0


REVIEW_HTML = r"""<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Scroll geometry review</title>
<style>
  :root { color-scheme: light; --bg:#1a1814; --fg:#f3efe6; --accent:#e8c56b; --cut:#ff5a5a; --seam:#22c55e; --trim:#3ec6ff; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: "Segoe UI", "Hiragino Sans", sans-serif; background:var(--bg); color:var(--fg); }
  header { display:flex; flex-wrap:wrap; gap:8px; align-items:center; padding:10px 14px; border-bottom:1px solid #333; position:sticky; top:0; background:var(--bg); z-index:2; }
  header strong { color:var(--accent); margin-right:8px; }
  button, select { background:#2a2620; color:var(--fg); border:1px solid #555; border-radius:4px; padding:6px 10px; cursor:pointer; }
  button.primary { background:#5a4a20; border-color:var(--accent); }
  button:hover { filter:brightness(1.1); }
  #meta { font-size:12px; opacity:.85; }
  #wrap { overflow:auto; max-height: calc(100vh - 58px); padding:12px; }
  #stage { position:relative; display:inline-block; line-height:0; }
  #pano { max-width:none; height:auto; user-select:none; -webkit-user-drag:none; }
  .line { position:absolute; top:0; bottom:0; width:2px; margin-left:-1px; background:var(--cut); cursor:ew-resize; z-index:3; }
  .line.active { background:#fff; width:3px; }
  .seam { position:absolute; top:0; bottom:0; width:3px; margin-left:-1px; background:var(--seam); cursor:ew-resize; z-index:5; box-shadow:0 0 0 1px #052e16; }
  .seam.active { background:#86efac; width:4px; }
  #trimBox { position:absolute; border:2px solid var(--trim); pointer-events:none; z-index:2; box-shadow:0 0 0 9999px rgba(0,0,0,.45); }
  .label { position:absolute; top:8px; transform:translateX(-50%); background:#000c; color:#ff0; font-size:11px; padding:1px 5px; z-index:4; pointer-events:none; }
  #help { font-size:12px; opacity:.75; margin-left:auto; }
</style>
</head>
<body>
<header>
  <strong id="title">geometry</strong>
  <span id="meta"></span>
  <button type="button" id="btnAdd">+ cut</button>
  <button type="button" id="btnDel">− cut</button>
  <select id="order"></select>
  <label style="font-size:12px">overlaps <input id="overlaps" size="16" placeholder="280,300" title="tile_overlaps reading-order px"/></label>
  <label style="font-size:12px">y <input id="yOffsets" size="12" placeholder="0,-8" title="tile_y_offsets: +で右タイルを下へ"/></label>
  <button type="button" id="btnOvPlus" title="選択中の緑線の重複を広く">接合 +40</button>
  <button type="button" id="btnOvMinus" title="選択中の緑線の重複を狭く">接合 −40</button>
  <button type="button" id="btnYUp" title="右タイルを上へ">接合 ↑</button>
  <button type="button" id="btnYDown" title="右タイルを下へ">接合 ↓</button>
  <button type="button" id="btnRestitch">Restitch</button>
  <button type="button" id="btnSave">Save draft</button>
  <button type="button" class="primary" id="btnReviewed">Mark reviewed + save</button>
  <button type="button" id="btnExport">Export _raw</button>
  <button type="button" id="btnPreview">Regen preview.jpg</button>
  <span id="help">赤=段カット · 緑=接合（横ドラッグ=重複 / 縦ドラッグ=上下ずれ · ↑↓ボタン）</span>
</header>
<div id="wrap"><div id="stage">
  <img id="pano" alt="panorama"/>
  <div id="trimBox"></div>
</div></div>
<script>
const state = { geom: null, naturalW: 1, naturalH: 1, selected: -1, selectedSeam: -1, scale: 1 };

async function api(path, opts) {
  const res = await fetch(path, opts);
  if (!res.ok) throw new Error(await res.text());
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

function displayScale() {
  const img = document.getElementById("pano");
  return img.clientWidth / state.naturalW;
}

function syncOverlay() {
  const g = state.geom;
  const s = displayScale();
  state.scale = s;
  const box = document.getElementById("trimBox");
  const t = g.trim;
  box.style.left = (t.x * s) + "px";
  box.style.top = (t.y * s) + "px";
  box.style.width = (t.width * s) + "px";
  box.style.height = (t.height * s) + "px";

  document.querySelectorAll(".line,.label,.seam").forEach(el => el.remove());
  const stage = document.getElementById("stage");
  const cuts = g.cuts.slice().sort((a,b)=>a-b);
  g.cuts = cuts;
  const seamXs = (g.meta && g.meta.tile_seams_x) ? g.meta.tile_seams_x : [];
  seamXs.forEach((x, i) => {
    const seam = document.createElement("div");
    seam.className = "seam" + (i === state.selectedSeam ? " active" : "");
    seam.title = "tile seam " + (i + 1);
    seam.style.left = (Number(x) * s) + "px";
    seam.style.top = (t.y * s) + "px";
    seam.style.height = (t.height * s) + "px";
    seam.dataset.index = String(i);
    seam.addEventListener("pointerdown", onSeamDragStart);
    stage.appendChild(seam);
  });
  cuts.forEach((x, i) => {
    const line = document.createElement("div");
    line.className = "line" + (i === state.selected ? " active" : "");
    line.style.left = (x * s) + "px";
    line.style.top = (t.y * s) + "px";
    line.style.height = (t.height * s) + "px";
    line.dataset.index = String(i);
    line.addEventListener("pointerdown", onDragStart);
    line.addEventListener("click", ev => { ev.stopPropagation(); state.selected = i; syncOverlay(); });
    stage.appendChild(line);
  });

  // segment labels (RTL/LTR)
  const edges = [t.x, ...cuts, t.x + t.width];
  let parts = [];
  for (let i = 0; i < edges.length - 1; i++) parts.push([edges[i], edges[i+1]]);
  if ((g.order || "rtl") === "rtl") parts = parts.reverse();
  parts.forEach((p, idx) => {
    const lab = document.createElement("div");
    lab.className = "label";
    lab.textContent = String(idx + 1).padStart(2, "0");
    lab.style.left = (((p[0] + p[1]) / 2) * s) + "px";
    lab.style.top = (t.y * s + 4) + "px";
    stage.appendChild(lab);
  });

  document.getElementById("meta").textContent =
    `${state.naturalW}×${state.naturalH} · trim ${t.width}×${t.height} · cuts ${cuts.length} · seams ${seamXs.length} · segs ${parts.length} · ${g.status}`;
  document.getElementById("order").value = g.order || "rtl";
  document.getElementById("overlaps").value = (g.tile_overlaps || []).join(",");
  document.getElementById("yOffsets").value = (g.tile_y_offsets || []).join(",");
}

function overlapIndexForSeam(i) {
  const n = (state.geom.tiles || []).length;
  const stitch = String(state.geom.stitch || "horizontal-rtl");
  if (stitch.indexOf("rtl") >= 0) return n - 2 - i;
  return i;
}

function bumpOverlap(seamIndex, delta) {
  const ov = (state.geom.tile_overlaps || []).slice();
  const idx = overlapIndexForSeam(seamIndex);
  if (idx < 0 || idx >= ov.length) return;
  ov[idx] = Math.max(0, Math.round(Number(ov[idx] || 0) + delta));
  state.geom.tile_overlaps = ov;
  document.getElementById("overlaps").value = ov.join(",");
}

async function restitchNow() {
  const body = payload(state.geom.status || "draft");
  await api("/api/geometry", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
  const msg = await api("/api/restitch", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ keep_overlaps: true }) });
  if (!msg.ok) { alert(msg.error || "restitch failed"); return; }
  await loadAll();
}

function bumpYOffset(seamIndex, delta) {
  const ys = (state.geom.tile_y_offsets || []).slice();
  const idx = overlapIndexForSeam(seamIndex);
  while (ys.length < idx + 1) ys.push(0);
  if (idx < 0) return;
  ys[idx] = Math.round(Number(ys[idx] || 0) + delta);
  state.geom.tile_y_offsets = ys;
  document.getElementById("yOffsets").value = ys.join(",");
}

function onSeamDragStart(ev) {
  ev.preventDefault();
  ev.stopPropagation();
  const i = Number(ev.currentTarget.dataset.index);
  state.selectedSeam = i;
  state.selected = -1;
  const startX = ev.clientX;
  const startY = ev.clientY;
  const idx = overlapIndexForSeam(i);
  const startOv = Number((state.geom.tile_overlaps || [])[idx] || 0);
  const startDy = Number((state.geom.tile_y_offsets || [])[idx] || 0);
  const move = (e) => {
    const ov = (state.geom.tile_overlaps || []).slice();
    const ys = (state.geom.tile_y_offsets || []).slice();
    while (ys.length < idx + 1) ys.push(0);
    ov[idx] = Math.max(0, startOv + Math.round((startX - e.clientX) / state.scale));
    // Drag down → positive dy (right tile moves down)
    ys[idx] = startDy + Math.round((e.clientY - startY) / state.scale);
    state.geom.tile_overlaps = ov;
    state.geom.tile_y_offsets = ys;
    document.getElementById("overlaps").value = ov.join(",");
    document.getElementById("yOffsets").value = ys.join(",");
    syncOverlay();
  };
  const up = async () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    await restitchNow();
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  syncOverlay();
}

function onDragStart(ev) {
  ev.preventDefault();
  const i = Number(ev.currentTarget.dataset.index);
  state.selected = i;
  const move = (e) => {
    const rect = document.getElementById("pano").getBoundingClientRect();
    let x = Math.round((e.clientX - rect.left) / state.scale);
    const t = state.geom.trim;
    x = Math.max(t.x + 1, Math.min(t.x + t.width - 1, x));
    state.geom.cuts[i] = x;
    syncOverlay();
  };
  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    state.geom.cuts = [...new Set(state.geom.cuts)].sort((a,b)=>a-b);
    syncOverlay();
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  syncOverlay();
}

async function loadAll() {
  state.geom = await api("/api/geometry");
  document.getElementById("title").textContent = state.geom._scroll_id || "geometry";
  const img = document.getElementById("pano");
  img.src = "/api/panorama?" + Date.now();
  await img.decode();
  state.naturalW = img.naturalWidth;
  state.naturalH = img.naturalHeight;
  syncOverlay();
}

function payload(status) {
  const g = state.geom;
  const ov = document.getElementById("overlaps").value.split(/[,\s]+/).filter(Boolean).map(Number);
  const ys = document.getElementById("yOffsets").value.split(/[,\s]+/).filter(Boolean).map(Number);
  return {
    version: g.version || 1,
    status: status || g.status || "draft",
    order: document.getElementById("order").value || "rtl",
    panorama: g.panorama,
    tiles: g.tiles,
    stitch: g.stitch,
    tile_overlaps: ov,
    tile_y_offsets: ys,
    trim: g.trim,
    cuts: g.cuts.slice().sort((a,b)=>a-b),
    notes: g.notes || "",
    meta: g.meta || {},
  };
}

document.getElementById("btnAdd").onclick = () => {
  const t = state.geom.trim;
  const x = Math.round(t.x + t.width / 2);
  state.geom.cuts.push(x);
  state.geom.cuts = [...new Set(state.geom.cuts)].sort((a,b)=>a-b);
  syncOverlay();
};
document.getElementById("btnDel").onclick = () => {
  if (state.selected < 0 || state.selected >= state.geom.cuts.length) return;
  state.geom.cuts.splice(state.selected, 1);
  state.selected = -1;
  syncOverlay();
};
document.getElementById("order").innerHTML = '<option value="rtl">order: rtl (_01=right)</option><option value="ltr">order: ltr (_01=left)</option>';
document.getElementById("order").onchange = () => { state.geom.order = document.getElementById("order").value; syncOverlay(); };

document.getElementById("btnSave").onclick = async () => {
  await api("/api/geometry", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload("draft")) });
  await loadAll();
  alert("Saved draft");
};
document.getElementById("btnReviewed").onclick = async () => {
  await api("/api/geometry", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload("reviewed")) });
  await loadAll();
  alert("Marked reviewed");
};
document.getElementById("btnExport").onclick = async () => {
  const msg = await api("/api/export", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ force:true, allow_draft:true }) });
  alert(msg.ok ? ("Exported " + msg.count + " slices") : msg.error);
};
document.getElementById("btnPreview").onclick = async () => {
  const msg = await api("/api/preview", { method:"POST" });
  alert(msg.ok ? ("Wrote " + msg.path) : msg.error);
};
document.getElementById("btnRestitch").onclick = async () => {
  await restitchNow();
};
document.getElementById("btnOvPlus").onclick = async () => {
  const i = state.selectedSeam >= 0 ? state.selectedSeam : 0;
  state.selectedSeam = i;
  bumpOverlap(i, 40);
  await restitchNow();
};
document.getElementById("btnOvMinus").onclick = async () => {
  const i = state.selectedSeam >= 0 ? state.selectedSeam : 0;
  state.selectedSeam = i;
  bumpOverlap(i, -40);
  await restitchNow();
};
document.getElementById("btnYUp").onclick = async () => {
  const i = state.selectedSeam >= 0 ? state.selectedSeam : 0;
  state.selectedSeam = i;
  bumpYOffset(i, -4);
  await restitchNow();
};
document.getElementById("btnYDown").onclick = async () => {
  const i = state.selectedSeam >= 0 ? state.selectedSeam : 0;
  state.selectedSeam = i;
  bumpYOffset(i, 4);
  await restitchNow();
};

document.getElementById("pano").addEventListener("dblclick", (ev) => {
  const rect = ev.target.getBoundingClientRect();
  let x = Math.round((ev.clientX - rect.left) / state.scale);
  const t = state.geom.trim;
  if (x <= t.x || x >= t.x + t.width) return;
  state.geom.cuts.push(x);
  state.geom.cuts = [...new Set(state.geom.cuts)].sort((a,b)=>a-b);
  syncOverlay();
});
window.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") { state.selected = -1; syncOverlay(); }
  if (ev.key === "Delete" || ev.key === "Backspace") document.getElementById("btnDel").click();
});
window.addEventListener("resize", () => syncOverlay());
loadAll().catch(err => alert(String(err)));
</script>
</body>
</html>
"""


def cmd_review(args: argparse.Namespace) -> int:
    scroll_dir = resolve_scroll_dir(args.scroll_path, REPO_ROOT)
    path = geometry_path(scroll_dir)
    if not path.is_file():
        print("geometry.yaml missing — running propose first…")
        ns = argparse.Namespace(
            scroll_path=args.scroll_path,
            target_aspect=DEFAULT_TARGET_ASPECT,
            keep_cuts=False,
            reset=False,
            restitch=False,
            stitch=None,
            estimate_overlaps=False,
            keep_overlaps=False,
            tile_overlaps=None,
            tile_y_offsets=None,
            status="draft",
            dry_run=False,
        )
        cmd_propose(ns)

    host = args.host
    port = args.port

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, fmt: str, *fmt_args) -> None:
            print("  http:", fmt % fmt_args)

        def _send(self, code: int, body: bytes, content_type: str) -> None:
            self.send_response(code)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)

        def _json(self, code: int, obj: object) -> None:
            raw = json.dumps(obj, ensure_ascii=False).encode("utf-8")
            self._send(code, raw, "application/json; charset=utf-8")

        def do_GET(self) -> None:  # noqa: N802
            route = urlparse(self.path).path
            if route in ("/", "/index.html"):
                self._send(200, REVIEW_HTML.encode("utf-8"), "text/html; charset=utf-8")
                return
            if route == "/api/geometry":
                data = attach_tile_seams(scroll_dir, load_geometry(path))
                data["_scroll_id"] = scroll_dir.name
                self._json(200, data)
                return
            if route == "/api/panorama":
                data = load_geometry(path)
                panorama = resolve_panorama_path(scroll_dir, data)
                if not panorama or not panorama.is_file():
                    self._send(404, b"panorama missing", "text/plain")
                    return
                # Must keep full pixel size so cut coords map 1:1 in the UI.
                suffix = panorama.suffix.lower()
                size = panorama.stat().st_size
                if size <= 120_000_000 and suffix in {".jpg", ".jpeg", ".png", ".webp"}:
                    ctype = {
                        ".jpg": "image/jpeg",
                        ".jpeg": "image/jpeg",
                        ".png": "image/png",
                        ".webp": "image/webp",
                    }[suffix]
                    self._send(200, panorama.read_bytes(), ctype)
                    return
                from io import BytesIO

                with open_panorama(panorama) as img:
                    buf = BytesIO()
                    img.save(buf, format="JPEG", quality=78, optimize=True)
                    self._send(200, buf.getvalue(), "image/jpeg")
                return
            self._send(404, b"not found", "text/plain")

        def do_POST(self) -> None:  # noqa: N802
            route = urlparse(self.path).path
            length = int(self.headers.get("Content-Length") or 0)
            raw = self.rfile.read(length) if length else b"{}"
            try:
                payload = json.loads(raw.decode("utf-8") or "{}")
            except json.JSONDecodeError:
                self._json(400, {"ok": False, "error": "invalid JSON"})
                return

            if route == "/api/geometry":
                for key in ("tiles", "stitch", "panorama", "meta", "notes", "tile_y_offsets"):
                    if key not in payload and path.is_file():
                        old = load_geometry(path)
                        if key in old:
                            payload[key] = old[key]
                payload.pop("_scroll_id", None)
                errs = validate_geometry(payload)
                if errs:
                    self._json(400, {"ok": False, "error": "; ".join(errs)})
                    return
                # Drop private keys
                clean = {
                    k: payload[k]
                    for k in (
                        "version",
                        "status",
                        "order",
                        "panorama",
                        "tiles",
                        "stitch",
                        "tile_overlaps",
                        "tile_y_offsets",
                        "trim",
                        "cuts",
                        "notes",
                        "meta",
                    )
                    if k in payload and payload[k] is not None
                }
                save_geometry(path, clean)
                self._json(200, {"ok": True})
                return

            if route == "/api/restitch":
                data = load_geometry(path)
                keep = bool(payload.get("keep_overlaps", True))
                try:
                    from scroll_geometry import build_proposed_geometry

                    updated = build_proposed_geometry(
                        scroll_dir,
                        existing=data,
                        restitch=True,
                        keep_overlaps=keep,
                        keep_existing_cuts=True,
                        estimate_overlaps=not keep,
                    )
                    updated["status"] = data.get("status") or "draft"
                    save_geometry(path, updated)
                except SystemExit as exc:
                    self._json(400, {"ok": False, "error": str(exc)})
                    return
                self._json(
                    200,
                    {
                        "ok": True,
                        "tile_overlaps": updated.get("tile_overlaps"),
                        "tile_seams_x": (updated.get("meta") or {}).get("tile_seams_x"),
                    },
                )
                return

            if route == "/api/export":
                data = load_geometry(path)
                try:
                    written = export_slices(
                        scroll_dir,
                        data,
                        dry_run=False,
                        force=bool(payload.get("force", True)),
                    )
                except SystemExit as exc:
                    self._json(400, {"ok": False, "error": str(exc)})
                    return
                self._json(200, {"ok": True, "count": len(written)})
                return

            if route == "/api/preview":
                data = load_geometry(path)
                panorama = resolve_panorama_path(scroll_dir, data)
                if not panorama or not panorama.is_file():
                    self._json(400, {"ok": False, "error": "panorama missing"})
                    return
                out = scroll_dir / "sources" / PREVIEW_NAME
                with open_panorama(panorama) as img:
                    preview = render_preview(img, data, max_width=3600)
                    preview.save(out, format="JPEG", quality=85, optimize=True)
                    preview.close()
                self._json(200, {"ok": True, "path": str(out)})
                return

            self._json(404, {"ok": False, "error": "not found"})

    server = ThreadingHTTPServer((host, port), Handler)
    url = f"http://{host}:{port}/"
    print(f"\n=== geometry review: {scroll_dir.name} ===")
    print(f"  Open {url}")
    print("  Ctrl+C to stop")
    if not args.no_browser:
        threading.Timer(0.4, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  stopped")
    finally:
        server.server_close()
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Figma-free scroll slice tool (propose / preview / export / review)"
    )
    sub = parser.add_subparsers(dest="command", required=True)

    p_prop = sub.add_parser("propose", help="Propose trim+cuts → geometry.yaml")
    p_prop.add_argument("scroll_path")
    p_prop.add_argument("--target-aspect", type=float, default=DEFAULT_TARGET_ASPECT)
    p_prop.add_argument("--keep-cuts", action="store_true", help="Keep existing cuts; only refresh trim/panorama")
    p_prop.add_argument("--reset", action="store_true", help="Ignore existing geometry.yaml and restitch panorama")
    p_prop.add_argument(
        "--restitch",
        action="store_true",
        help="Rebuild sources/panorama.jpg from tiles even if it already exists",
    )
    p_prop.add_argument(
        "--stitch",
        choices=("horizontal-rtl", "horizontal", "rtl", "ltr"),
        default=None,
        help="Tile paste direction (default: horizontal-rtl = 巻頭 on the right)",
    )
    p_prop.add_argument(
        "--estimate-overlaps",
        action="store_true",
        help="Re-estimate tile_overlaps even if already set",
    )
    p_prop.add_argument(
        "--keep-overlaps",
        action="store_true",
        help="Keep existing tile_overlaps when restitcing",
    )
    p_prop.add_argument(
        "--tile-overlaps",
        default=None,
        help="Comma-separated overlap px in reading order (skips estimate)",
    )
    p_prop.add_argument(
        "--tile-y-offsets",
        default=None,
        help="Comma-separated vertical shifts in reading order (+ = right tile down)",
    )
    p_prop.add_argument("--status", choices=("draft", "reviewed"), default=None)
    p_prop.add_argument("--dry-run", action="store_true")
    p_prop.set_defaults(func=cmd_propose)

    p_prev = sub.add_parser("preview", help="Write sources/geometry_preview.jpg")
    p_prev.add_argument("scroll_path")
    p_prev.add_argument("--output", default=None)
    p_prev.add_argument("--max-width", type=int, default=3600)
    p_prev.add_argument("--dry-run", action="store_true")
    p_prev.set_defaults(func=cmd_preview)

    p_exp = sub.add_parser("export", help="Crop to images/_raw/slice_NN.jpg")
    p_exp.add_argument("scroll_path")
    p_exp.add_argument("--output-dir", default=None)
    p_exp.add_argument("--force", action="store_true")
    p_exp.add_argument("--allow-draft", action="store_true")
    p_exp.add_argument("--dry-run", action="store_true")
    p_exp.set_defaults(func=cmd_export)

    p_rev = sub.add_parser("review", help="Local browser UI for trim/cut confirmation")
    p_rev.add_argument("scroll_path")
    p_rev.add_argument("--host", default="127.0.0.1")
    p_rev.add_argument("--port", type=int, default=8765)
    p_rev.add_argument("--no-browser", action="store_true")
    p_rev.set_defaults(func=cmd_review)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return int(args.func(args) or 0)


if __name__ == "__main__":
    sys.exit(main())
