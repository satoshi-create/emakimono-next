#!/usr/bin/env python3
"""
sync_all.py — Unified pipeline for emakimono-next.

Reads an extended scroll_config.yaml and:
  1. Uploads images to Cloudinary  (via sync_scroll.py)
  2. Updates dataEmakis.json with new metadata + Cloudinary URLs
  3. Upserts image-metadata-cache.json for this scroll (or full rebuild with --regenerate-cache)
  4. Generates emaki-text-data/{titleen}.json from scenes[].text (when present)

Usage:
  python scripts/sync_all.py [path/to/scroll_config.yaml]

Env:
  CLOUDINARY_URL  (required for upload)
  SCROLL_IMAGES_DIR  (optional; auto-detects scrolls/{scroll_id}/images/)
  SYNC_UPLOAD_WORKERS / SYNC_UPLOAD_TIMEOUT / SYNC_UPLOAD_RETRIES  (see sync_scroll.py)

Flags:
  --dry-run           Print plan without uploading or writing files
  --skip-upload       Skip Cloudinary upload (update JSON only)
  --force-upload      Re-upload all images even if unchanged on Cloudinary
  --remote-check      Query Cloudinary when local .upload-cache.json misses
  --workers N         Parallel upload threads (default: 3)
  --skip-cache        Skip image-metadata-cache update
  --skip-text         Skip emaki-text-data JSON generation
  --regenerate-cache  Rebuild entire cache from all JSON (default: upsert one entry)
  --preflight         Run preflight checks only (no upload, no file writes)
  --skip-preflight    Skip preflight validation (not recommended)
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

import yaml

# We reuse sync_scroll's helpers
import preflight_scroll as pf
import sync_scroll as ss  # noqa: N812

# ---------------------------------------------------------------------------
#  Paths (relative to repo root)
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_EMAKIS_PATH = REPO_ROOT / "src/data/json-data/dataEmakis.json"
CACHE_DIR = REPO_ROOT / "src/data/image-metadata-cache"
EMAKI_TEXT_DIR = REPO_ROOT / "src/data/emaki-text-data"
GENERATE_CACHE_SCRIPT = REPO_ROOT / "src/script/generateImageMetadata.js"
CACHE_PATH = CACHE_DIR / "image-metadata-cache.json"


def data_entry_to_cache_entry(entry: dict) -> dict:
    """Convert a dataEmakis entry to image-metadata-cache format."""
    emakis = []
    for emaki in entry.get("emakis", []):
        cached = dict(emaki)
        src = cached.get("src", "")
        if isinstance(src, str) and src.startswith("/") and cached.get("config") == "cloudinary":
            cached["src"] = src.lstrip("/")
        if cached.get("srcWidth") == "":
            cached["srcWidth"] = 0
        if cached.get("srcHeight") == "":
            cached["srcHeight"] = 0
        if cached.get("cat") == "image" and cached.get("config") == "cloudinary":
            cached["srcWidth"] = int(cached.get("srcWidth") or 0)
            cached["srcHeight"] = int(cached.get("srcHeight") or 0)
        emakis.append(cached)
    return {**entry, "emakis": emakis}


def upsert_cache_entry(new_entry: dict, dry_run: bool = False) -> None:
    """Insert or replace one scroll in image-metadata-cache.json by titleen."""
    cache_entry = data_entry_to_cache_entry(new_entry)
    titleen = cache_entry["titleen"]

    if CACHE_PATH.exists():
        with open(CACHE_PATH, "r", encoding="utf-8") as f:
            cache = json.load(f)
    else:
        cache = []

    replaced = False
    for i, entry in enumerate(cache):
        if entry.get("titleen") == titleen:
            cache[i] = cache_entry
            replaced = True
            break
    if not replaced:
        cache.append(cache_entry)

    if dry_run:
        action = "replace" if replaced else "append"
        print(f"  [dry-run] Would {action} cache entry titleen='{titleen}' ({len(cache)} total)")
        return

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    with open(CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)
    action = "Replaced" if replaced else "Added"
    print(f"  {action} cache entry titleen='{titleen}' ({len(cache)} total)")


# ---------------------------------------------------------------------------
#  emaki-text-data from scenes[].text
# ---------------------------------------------------------------------------

def text_json_path(titleen: str) -> Path:
    return EMAKI_TEXT_DIR / f"{titleen}.json"


def scene_has_text(scene: dict) -> bool:
    text = scene.get("text") or {}
    return any(str(text.get(k, "")).strip() for k in ("gendaibun", "kobun", "desc", "descen"))


def scene_includes_text_json_entry(scene: dict) -> bool:
    """True when a scene should appear in emaki-text-data (body text and/or chapter title)."""
    if scene_has_text(scene):
        return True
    return bool(str(scene.get("title", "")).strip() or str(scene.get("titleen", "")).strip())


def _normalize_text_value(value: str) -> str:
    return value.strip() if isinstance(value, str) else value


def build_text_json(config: dict) -> list[dict]:
    """Build emaki-text-data JSON array from scenes[].text in scroll_config.yaml."""
    entries: list[dict] = []
    for scene in ss.get_scenes_config(config):
        if not scene_includes_text_json_entry(scene):
            continue
        text = scene.get("text") or {}
        entry: dict = {
            "chapter": str(scene["id"]),
            "title": _normalize_text_value(text.get("title") or scene.get("title", "")),
            "gendaibun": _normalize_text_value(text.get("gendaibun", "")),
            "kobun": _normalize_text_value(text.get("kobun", "")),
            "desc": _normalize_text_value(text.get("desc", "")),
        }
        if text.get("descen"):
            entry["descen"] = text["descen"]
        if scene.get("titleen"):
            entry["titleen"] = scene["titleen"]
        entries.append(entry)
    return entries


def write_text_json(config: dict, dry_run: bool = False) -> list[dict]:
    """Write emaki-text-data/{titleen}.json from YAML scenes[].text."""
    meta = config.get("metadata", {})
    titleen = meta.get("titleen", "")
    if not titleen:
        print("  Skipped: metadata.titleen is missing")
        return []

    entries = build_text_json(config)
    path = text_json_path(titleen)
    kotobagaki = meta.get("kotobagaki", False)

    if not entries:
        if kotobagaki:
            print(f"  Warning: kotobagaki=true but no scenes[].text found for '{titleen}'")
        else:
            print(f"  No scenes[].text — skipped emaki-text-data for '{titleen}'")
        return []

    if dry_run:
        print(f"  [dry-run] Would write {len(entries)} chapter(s) to {path}")
        for e in entries:
            preview = (e.get("gendaibun") or "")[:40].replace("\n", " ")
            print(f"    chapter {e['chapter']}: {e.get('title', '')[:50]} … {preview!r}")
        return entries

    EMAKI_TEXT_DIR.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)
    print(f"  Wrote {len(entries)} chapter(s) to {path}")
    return entries


def ekotoba_text_fields(scene: dict) -> dict:
    """Optional gendaibun/kobun/desc fields for an ekotoba emakis slot."""
    if not scene_has_text(scene):
        return {}
    text = scene.get("text") or {}
    fields: dict = {}
    for key in ("gendaibun", "kobun", "desc", "descen"):
        if text.get(key):
            fields[key] = _normalize_text_value(text[key])
    return fields


def _image_row_to_src(ir: dict) -> str:
    src = ir.get("src", "")
    if src and not str(src).startswith("/"):
        return f"/{src}"
    return src or ""


def _build_image_emaki_slot(ir: dict) -> dict:
    return {
        "cat": "image",
        "chapter": "",
        "config": "cloudinary" if ir.get("src") else "",
        "src": _image_row_to_src(ir),
        "name": ir["public_id"],
        "srcHeight": str(ir["height"]) if ir.get("height") else "",
        "srcWidth": str(ir["width"]) if ir.get("width") else "",
    }


def _build_ekotoba_emaki_slot(scene: dict, ir: dict | None = None) -> dict:
    ekotoba: dict = {
        "cat": "ekotoba",
        "chapter": str(scene["id"]),
        "config": "",
        "src": "",
        "name": "",
        "srcHeight": "",
        "srcWidth": "",
    }
    if ir is not None:
        ekotoba["config"] = "cloudinary" if ir.get("src") else ""
        ekotoba["src"] = _image_row_to_src(ir)
        ekotoba["name"] = ir["public_id"]
        ekotoba["srcHeight"] = str(ir["height"]) if ir.get("height") else ""
        ekotoba["srcWidth"] = str(ir["width"]) if ir.get("width") else ""
    ekotoba.update(ekotoba_text_fields(scene))
    return ekotoba


def _build_emakis_default(config: dict, image_rows: list[dict]) -> list[dict]:
    """Standard layout: empty ekotoba per scene + all range images as image slots."""
    emakis: list[dict] = []
    for scene in ss.get_scenes_config(config):
        start_global, end_global = scene["range"]
        emakis.append(_build_ekotoba_emaki_slot(scene))
        for ir in image_rows:
            if start_global <= ir["index"] <= end_global:
                emakis.append(_build_image_emaki_slot(ir))
    return emakis


def _build_emakis_explicit(config: dict, image_rows: list[dict]) -> list[dict]:
    """Per-index slot layout via scenes[].slots (image | ekotoba).

    Preserves scene range / chapter ids for upload public_ids while allowing
    non-alternating kotobagaki patterns (e.g. 絵師草紙: 絵→词書→絵×n).
    """
    emakis: list[dict] = []
    for scene in ss.get_scenes_config(config):
        start_global, end_global = scene["range"]
        slots = scene.get("slots") or []
        scene_rows = sorted(
            (ir for ir in image_rows if start_global <= ir["index"] <= end_global),
            key=lambda x: x["index"],
        )
        if not scene_rows:
            continue
        if len(slots) != len(scene_rows):
            raise ValueError(
                f"Scene id={scene['id']} range [{start_global}, {end_global}]: "
                f"slots length {len(slots)} != image count {len(scene_rows)}"
            )
        for slot_type, ir in zip(slots, scene_rows, strict=True):
            if slot_type == "ekotoba":
                emakis.append(_build_ekotoba_emaki_slot(scene, ir))
            elif slot_type == "image":
                emakis.append(_build_image_emaki_slot(ir))
            else:
                raise ValueError(
                    f"Scene id={scene['id']}: invalid slot {slot_type!r} "
                    f"(expected 'image' or 'ekotoba')"
                )
    return emakis


def _build_emakis_alternating(config: dict, image_rows: list[dict]) -> list[dict]:
    """Kotobagaki layout: odd global indices → ekotoba+src, even → image (per scene range).

    Scene flag ``ekotoba_src: false`` — text-only ekotoba (no kotobagaki image) then all
    indices in range as image slots (e.g. 狐狼地獄: 词書なし + 絵画13).
    """
    emakis: list[dict] = []
    for scene in ss.get_scenes_config(config):
        start_global, end_global = scene["range"]
        scene_rows = sorted(
            (ir for ir in image_rows if start_global <= ir["index"] <= end_global),
            key=lambda x: x["index"],
        )
        if not scene_rows:
            continue
        if scene.get("ekotoba_src") is False:
            emakis.append(_build_ekotoba_emaki_slot(scene, None))
            for ir in scene_rows:
                emakis.append(_build_image_emaki_slot(ir))
            continue
        start_odd = scene_rows[0]["index"] % 2 == 1
        for i, ir in enumerate(scene_rows):
            is_ekotoba = (start_odd and i % 2 == 0) or (not start_odd and i % 2 == 1)
            if is_ekotoba:
                emakis.append(_build_ekotoba_emaki_slot(scene, ir))
            else:
                emakis.append(_build_image_emaki_slot(ir))
    return emakis


def _merge_existing_image_src(emakis: list[dict], existing_entry: dict | None) -> list[dict]:
    """When skipping upload, preserve Cloudinary src/dimensions from an existing entry by name."""
    if not existing_entry:
        return emakis
    by_name: dict[str, dict] = {}
    for slot in existing_entry.get("emakis", []):
        name = slot.get("name")
        if name:
            by_name[name] = slot
    merged: list[dict] = []
    for slot in emakis:
        out = dict(slot)
        name = out.get("name")
        if name and name in by_name:
            old = by_name[name]
            for key in ("src", "srcSp", "srcTb", "srcWidth", "srcHeight", "config", "load"):
                if old.get(key) not in (None, ""):
                    out[key] = old[key]
        merged.append(out)
    return merged


# ---------------------------------------------------------------------------
#  Build a dataEmakis.json entry from YAML + Cloudinary results
# ---------------------------------------------------------------------------

def build_emaki_entry(config: dict, image_rows: list[dict], existing_entry: dict | None = None, skip_images: bool = False) -> dict:
    """Construct one entry dict for dataEmakis.json from YAML metadata + upload results.
    
    If skip_images is True and an existing_entry is provided, the emakis array is
    preserved from the existing entry (only metadata fields are updated).
    """
    meta = config["metadata"]

    if meta.get("kotobagaki_mode") == "explicit":
        emakis = _build_emakis_explicit(config, image_rows)
    elif meta.get("kotobagaki_mode") == "alternating":
        emakis = _build_emakis_alternating(config, image_rows)
    else:
        emakis = _build_emakis_default(config, image_rows)

    if skip_images and existing_entry:
        emakis = _merge_existing_image_src(emakis, existing_entry)

    return {
        "id": meta["id"],
        "title": meta["title"],
        "titleen": meta["titleen"],
        "author": meta.get("author", ""),
        "authoren": meta.get("authoren", ""),
        "edition": meta.get("edition", ""),
        "encodeUrl": meta.get("encodeUrl", ""),
        "backgroundImage": meta.get("backgroundImage", ""),
        "thumb": meta.get("thumb", ""),
        "thumb2": meta.get("thumb2", ""),
        "video": meta.get("video", ""),
        "era": meta.get("era", ""),
        "eraen": meta.get("eraen", ""),
        "desc": meta.get("desc", ""),
        "descen": meta.get("descen", ""),
        "readMore": meta.get("readMore", False),
        "type": meta.get("type", ""),
        "typeen": meta.get("typeen", ""),
        "keyword": meta.get("keywords", []),
        "kotobagaki": meta.get("kotobagaki", False),
        "favorite": meta.get("favorite", False),
        "sourceImageUrl": meta.get("sourceImageUrl", ""),
        "sourceImage": meta.get("sourceImage", ""),
        "metadesc": meta.get("metadesc", ""),
        "gif": meta.get("gif", ""),
        "sourceEkotoba": meta.get("sourceEkotoba", ""),
        "reference": meta.get("reference", []),
        "emakis": emakis,
    }


# ---------------------------------------------------------------------------
#  Update dataEmakis.json (upsert by titleen)
# ---------------------------------------------------------------------------

def upsert_data_emakis(new_entry: dict, dry_run: bool = False) -> tuple[list[dict], dict | None]:
    """Insert or replace the entry in dataEmakis.json matching titleen.
    Returns (all_entries, existing_entry_if_replaced).
    """
    if not DATA_EMAKIS_PATH.exists():
        entries = []
    else:
        with open(DATA_EMAKIS_PATH, "r", encoding="utf-8") as f:
            entries = json.load(f)

    titleen = new_entry["titleen"]
    existing_entry = None
    replaced = False
    for i, entry in enumerate(entries):
        if entry.get("titleen") == titleen:
            existing_entry = entry
            entries[i] = new_entry
            replaced = True
            if not dry_run:
                print(f"  Replaced entry titleen='{titleen}' (id={new_entry['id']})")
            break

    if not replaced:
        # Append new entry
        entries.append(new_entry)
        if not dry_run:
            print(f"  Added new entry titleen='{titleen}' (id={new_entry['id']})")

    if not dry_run:
        with open(DATA_EMAKIS_PATH, "w", encoding="utf-8") as f:
            json.dump(entries, f, ensure_ascii=False, indent=2)
        print(f"  Wrote {len(entries)} entries to {DATA_EMAKIS_PATH}")
    else:
        print(f"  [dry-run] Would write {len(entries)} entries")

    return entries, existing_entry


# ---------------------------------------------------------------------------
#  Regenerate image-metadata-cache.json via Node.js
# ---------------------------------------------------------------------------

def regenerate_cache(dry_run: bool = False) -> None:
    """Run generateImageMetadata.js to rebuild image-metadata-cache.json."""
    if not GENERATE_CACHE_SCRIPT.exists():
        print(f"  Warning: {GENERATE_CACHE_SCRIPT} not found, skipping cache regeneration")
        return
    if dry_run:
        print(f"  [dry-run] Would run: node {GENERATE_CACHE_SCRIPT}")
        return

    print("  Regenerating image-metadata-cache.json...", end=" ", flush=True)
    # The script must be run from its parent directory (src/script/ or repo root?)
    # generateImageMetadata.js uses relative paths like "../libs/json-data/"
    # so we must run it from the repo root
    result = subprocess.run(
        ["node", str(GENERATE_CACHE_SCRIPT.resolve())],
        cwd=str(REPO_ROOT),
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print("FAILED")
        print(result.stderr, file=sys.stderr)
        raise SystemExit(f"Cache generation failed (exit code {result.returncode})")
    print("OK")
    if result.stdout.strip():
        for line in result.stdout.strip().split("\n"):
            print(f"    {line}")


# ---------------------------------------------------------------------------
#  Upload plan helpers
# ---------------------------------------------------------------------------

def build_image_rows_from_plan(config: dict) -> list[dict]:
    """Build image_rows with public_id placeholders (dry-run / skip-upload)."""
    image_rows = ss.build_upload_plan(config)
    volume_num = int(config.get("volume_num", 1))
    for ir in image_rows:
        ir["public_id"] = ss.image_public_id(
            config["scroll_id"],
            volume_num,
            ir["chapter"],
            ir.get("ordinal", ir["index"]),
        )
        ir["src"] = ""
        ir["width"] = 0
        ir["height"] = 0
    return image_rows


# ---------------------------------------------------------------------------
#  Main
# ---------------------------------------------------------------------------

def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Unified sync pipeline for emakimono-next")
    parser.add_argument("config_path", nargs="?", help="Path to scroll_config.yaml")
    parser.add_argument("--dry-run", action="store_true", help="Print plan only")
    parser.add_argument("--skip-upload", action="store_true", help="Skip Cloudinary upload")
    parser.add_argument(
        "--force-upload",
        action="store_true",
        help="Re-upload all images even if unchanged on Cloudinary",
    )
    parser.add_argument(
        "--remote-check",
        action="store_true",
        help="Query Cloudinary Admin API when local upload cache misses",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=int(os.environ.get("SYNC_UPLOAD_WORKERS", "3")),
        help="Parallel upload threads (default: 3)",
    )
    parser.add_argument("--skip-cache", action="store_true", help="Skip cache update")
    parser.add_argument(
        "--regenerate-cache",
        action="store_true",
        help="Rebuild entire cache from all JSON sources (default: upsert one entry)",
    )
    parser.add_argument(
        "--skip-text",
        action="store_true",
        help="Skip emaki-text-data JSON generation",
    )
    parser.add_argument(
        "--preflight",
        action="store_true",
        help="Run preflight validation only (no upload, no file writes)",
    )
    parser.add_argument(
        "--skip-preflight",
        action="store_true",
        help="Skip preflight validation before sync",
    )
    args = parser.parse_args()

    # 1. Load YAML
    config_path = ss.get_config_path(REPO_ROOT, args.config_path)
    if not config_path.exists():
        raise SystemExit(f"Config not found: {config_path}")
    config = ss.load_yaml(str(config_path))
    scroll_id = config["scroll_id"]
    meta = config.get("metadata", {})
    print(f"\n=== Sync: scroll_id={scroll_id}, titleen={meta.get('titleen', '(no metadata)')} ===")

    if args.preflight:
        report = pf.run_preflight(config_path, skip_upload=args.skip_upload)
        pf.print_report(report, scroll_id=scroll_id, image_count=len(ss.build_upload_plan(config)))
        raise SystemExit(0 if report.ok else 1)

    if not args.skip_preflight:
        print("\n[Preflight] Validating scroll config...")
        report = pf.run_preflight(config_path, skip_upload=args.skip_upload)
        pf.print_report(report, scroll_id=scroll_id, image_count=len(ss.build_upload_plan(config)))
        if not report.ok:
            raise SystemExit(1)

    # 2. Check that metadata section exists
    if not meta:
        raise SystemExit("Error: YAML must have a 'metadata' section (use the extended format)")

    # 3. Upload to Cloudinary
    if args.dry_run:
        print("\n[Upload] SKIPPED (dry-run)")
        image_rows = build_image_rows_from_plan(config)
        print(f"  Planned {len(image_rows)} image(s)")
    elif args.skip_upload:
        print("\n[Upload] SKIPPED (--skip-upload)")
        image_rows = build_image_rows_from_plan(config)
    else:
        print("\n[Upload] Running sync_scroll.py upload...")
        upload_args: list[str] = []
        if args.config_path:
            upload_args.append(args.config_path)
        if args.force_upload:
            upload_args.append("--force-upload")
        if args.remote_check:
            upload_args.append("--remote-check")
        upload_args.extend(["--workers", str(max(1, args.workers))])
        image_rows = ss.main(upload_args)
        print(f"  Processed {len(image_rows)} image(s)")

    # 4. Generate emaki-text-data JSON from scenes[].text
    if args.skip_text:
        print("\n[TextData] SKIPPED (--skip-text)")
    else:
        print("\n[TextData] Generating emaki-text-data JSON...")
        write_text_json(config, dry_run=args.dry_run)

    # 5. Update dataEmakis.json
    print("\n[dataEmakis] Updating entry...")

    existing_entry = None
    if DATA_EMAKIS_PATH.exists():
        with open(DATA_EMAKIS_PATH, "r", encoding="utf-8") as f:
            all_entries = json.load(f)
        titleen = config.get("metadata", {}).get("titleen", "")
        for e in all_entries:
            if e.get("titleen") == titleen:
                existing_entry = e
                break

    skip_images = args.skip_upload or args.dry_run
    new_entry = build_emaki_entry(config, image_rows, existing_entry, skip_images=skip_images)
    upsert_data_emakis(new_entry, dry_run=args.dry_run)

    # 6. Update image-metadata-cache.json
    if args.skip_cache:
        print("\n[Cache] SKIPPED (--skip-cache)")
    elif args.regenerate_cache:
        print("\n[Cache] Full regeneration from all JSON...")
        regenerate_cache(dry_run=args.dry_run)
    else:
        print("\n[Cache] Upserting entry...")
        upsert_cache_entry(new_entry, dry_run=args.dry_run)

    if args.dry_run:
        print("\n  (dry-run: no files were written)")

    print(f"\n=== Done: {scroll_id} ===\n")


if __name__ == "__main__":
    main()
