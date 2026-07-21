#!/usr/bin/env python3
"""
sync_all.py — Unified pipeline for emakimono-next.

Reads an extended scroll_config.yaml and:
  1. Uploads images to Cloudinary  (via sync_scroll.py)
  2. Updates dataEmakis.json with new metadata + Cloudinary URLs
  3. Regenerates image-metadata-cache.json (via Node.js)
  4. Verifies emaki-text-data/ exists

Usage:
  python scripts/sync_all.py [path/to/scroll_config.yaml]

Env:
  CLOUDINARY_URL  (required for upload)
  SCROLL_IMAGES_DIR  (optional, defaults to images/<scroll_id>/)

Flags:
  --dry-run       Print plan without uploading or writing files
  --skip-upload   Skip Cloudinary upload (update JSON only)
  --skip-cache    Skip image-metadata-cache regeneration
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
import sync_scroll as ss  # noqa: N812

# ---------------------------------------------------------------------------
#  Paths (relative to repo root)
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_EMAKIS_PATH = REPO_ROOT / "src/data/json-data/dataEmakis.json"
CACHE_DIR = REPO_ROOT / "src/data/image-metadata-cache"
EMAKI_TEXT_DIR = REPO_ROOT / "src/data/emaki-text-data"
GENERATE_CACHE_SCRIPT = REPO_ROOT / "src/script/generateImageMetadata.js"


# ---------------------------------------------------------------------------
#  Build a dataEmakis.json entry from YAML + Cloudinary results
# ---------------------------------------------------------------------------

def build_emaki_entry(config: dict, image_rows: list[dict]) -> dict:
    """Construct one entry dict for dataEmakis.json from YAML metadata + upload results."""
    meta = config["metadata"]

    # Build the emakis array: ekotoba entries interleaved with image entries
    emakis: list[dict] = []
    for scene in ss.get_scenes_config(config):
        ch_id = scene["id"]
        start_global, end_global = scene["range"]

        # ekotoba entry
        emakis.append({
            "cat": "ekotoba",
            "chapter": str(ch_id),
            "config": "",
            "src": "",
            "name": "",
            "srcHeight": "",
            "srcWidth": "",
        })

        # image entries whose index falls within this scene's range
        for ir in image_rows:
            global_idx = ir["index"]
            if start_global <= global_idx <= end_global:
                # Use the Cloudinary src (with leading / for consistency with existing data)
                src_val = f"/{ir['src']}" if ir["src"] and not ir["src"].startswith("/") else ir["src"]
                emakis.append({
                    "cat": "image",
                    "chapter": "",
                    "config": "cloudinary",
                    "src": src_val,
                    "name": ir["public_id"],
                    "srcHeight": str(ir["height"]) if ir["height"] else "",
                    "srcWidth": str(ir["width"]) if ir["width"] else "",
                })

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
        "emakis": emakis,
    }


# ---------------------------------------------------------------------------
#  Update dataEmakis.json (upsert by titleen)
# ---------------------------------------------------------------------------

def upsert_data_emakis(new_entry: dict, dry_run: bool = False) -> list[dict]:
    """Insert or replace the entry in dataEmakis.json matching titleen. Returns all entries."""
    if not DATA_EMAKIS_PATH.exists():
        entries = []
    else:
        with open(DATA_EMAKIS_PATH, "r", encoding="utf-8") as f:
            entries = json.load(f)

    titleen = new_entry["titleen"]
    replaced = False
    for i, entry in enumerate(entries):
        if entry.get("titleen") == titleen:
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

    return entries


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
#  Check emaki-text-data
# ---------------------------------------------------------------------------

def check_text_data(config: dict) -> None:
    """Verify that emaki-text-data JSON exists for this scroll (warning only)."""
    titleen = config.get("metadata", {}).get("titleen", "")
    if not titleen:
        return
    text_path = EMAKI_TEXT_DIR / f"{titleen}.json"
    if not text_path.exists():
        print(f"  Info: emaki-text-data/{titleen}.json not found (create it manually if needed)")


# ---------------------------------------------------------------------------
#  Main
# ---------------------------------------------------------------------------

def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Unified sync pipeline for emakimono-next")
    parser.add_argument("config_path", nargs="?", help="Path to scroll_config.yaml")
    parser.add_argument("--dry-run", action="store_true", help="Print plan only")
    parser.add_argument("--skip-upload", action="store_true", help="Skip Cloudinary upload")
    parser.add_argument("--skip-cache", action="store_true", help="Skip cache regeneration")
    args = parser.parse_args()

    # 1. Load YAML
    config_path = ss.get_config_path(REPO_ROOT, args.config_path)
    if not config_path.exists():
        raise SystemExit(f"Config not found: {config_path}")
    config = ss.load_yaml(str(config_path))
    scroll_id = config["scroll_id"]
    meta = config.get("metadata", {})
    print(f"\n=== Sync: scroll_id={scroll_id}, titleen={meta.get('titleen', '(no metadata)')} ===")

    # 2. Check that metadata section exists
    if not meta:
        raise SystemExit("Error: YAML must have a 'metadata' section (use the extended format)")

    # 3. Upload to Cloudinary
    if args.skip_upload:
        print("\n[Upload] SKIPPED (--skip-upload)")
        image_rows = ss.build_upload_plan(config)
        # Fill with placeholder data
        for ir in image_rows:
            ir["src"] = ""
            ir["width"] = 0
            ir["height"] = 0
    else:
        print("\n[Upload] Running sync_scroll.py upload...")
        # Build upload args and let sync_scroll's own parser handle them
        upload_args = []
        if args.config_path:
            upload_args.append(args.config_path)
        if args.dry_run:
            upload_args.append("--dry-run")
        image_rows = ss.main(upload_args)
        if args.dry_run:
            print("\n  (dry-run: no files were uploaded)")
            return
        print(f"  Uploaded {len(image_rows)} images")

    # 4. Update dataEmakis.json
    print("\n[dataEmakis] Updating entry...")
    new_entry = build_emaki_entry(config, image_rows)
    upsert_data_emakis(new_entry, dry_run=args.dry_run)

    # 5. Regenerate image-metadata-cache.json
    if args.skip_cache:
        print("\n[Cache] SKIPPED (--skip-cache)")
    else:
        print("\n[Cache] Regenerating...")
        regenerate_cache(dry_run=args.dry_run)

    # 6. Check text data
    print("\n[TextData] Checking...")
    check_text_data(config)

    print(f"\n=== Done: {scroll_id} ===\n")


if __name__ == "__main__":
    main()
