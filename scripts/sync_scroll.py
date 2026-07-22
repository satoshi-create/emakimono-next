#!/usr/bin/env python3
"""
Sync scroll: read scroll_config.yaml, upload images to Cloudinary.

This script is both a standalone CLI tool and a module for sync_all.py.

ID format (B — canonical):
  - public_id: {scroll_id}__{scroll_id}_{volume}_{chapter:02d}__{ordinal:02d}
  - Cloudinary path: emakimono/{public_id}.jpg
  - Local images: scrolls/{scroll_id}/images/ (or SCROLL_IMAGES_DIR)

Usage:
  python scripts/sync_scroll.py [path/to/scroll_config.yaml]

Env:
  SCROLL_IMAGES_DIR, CLOUDINARY_URL (or CLOUDINARY_CLOUD_NAME + API_KEY + API_SECRET)
"""

from __future__ import annotations

import os
import re
import sys
import json
import argparse
from pathlib import Path

import yaml
import cloudinary
import cloudinary.uploader

# Regex to extract frame index from filenames like "_01-375.jpg" or "_01.jpg"
INDEX_IN_FILENAME_RE = re.compile(r"_(\d+)[-.]", re.IGNORECASE)


# ---------------------------------------------------------------------------
#  YAML helpers
# ---------------------------------------------------------------------------

def load_yaml(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def get_config_path(repo_root: Path, arg_path: str | None) -> Path:
    if arg_path:
        p = Path(arg_path)
        return p if p.is_absolute() else (repo_root / p)
    raise SystemExit(
        "Config path required.\n"
        "Example: python scripts/sync_scroll.py scrolls/my-scroll/scroll_config.yaml"
    )


def ensure_env(name: str, optional_keys: list[str] | None = None) -> str:
    v = os.environ.get(name)
    if v:
        return v
    if optional_keys:
        for k in optional_keys:
            v = os.environ.get(k)
            if v:
                return v
    raise SystemExit(f"Missing env: {name} (or {optional_keys})")


# ---------------------------------------------------------------------------
#  Naming
# ---------------------------------------------------------------------------

def scene_key(scroll_id: str, volume_num: int, chapter: int) -> str:
    """Scene segment inside a B-format public_id."""
    return f"{scroll_id}_{volume_num}_{chapter:02d}"


def image_public_id(scroll_id: str, volume_num: int, chapter: int, ordinal: int) -> str:
    """Cloudinary public_id (B format, no folder prefix).

    Example: choju-giga-yamazaki-kou__choju-giga-yamazaki-kou_1_01__01
    """
    key = scene_key(scroll_id, volume_num, chapter)
    return f"{scroll_id}__{key}__{ordinal:02d}"


def strip_cloudinary_folder(public_id: str) -> str:
    """Remove emakimono/ prefix from a stored public_id."""
    return public_id.replace("emakimono/", "", 1) if public_id else ""


def resolve_images_dir(
    repo_root: Path,
    scroll_id: str,
    config_path: Path | None = None,
) -> Path:
    """Find the image directory for a scroll (first match wins)."""
    if config_path is not None:
        sibling = config_path.parent / "images"
        if sibling.is_dir():
            return sibling.resolve()

    env_dir = os.environ.get("SCROLL_IMAGES_DIR", "").strip()
    if env_dir:
        base = Path(env_dir)
        if not base.is_absolute():
            base = (repo_root / base).resolve()
        nested = base / scroll_id
        return nested if nested.is_dir() else base

    candidates = [
        repo_root / "scrolls" / scroll_id / "images",
        repo_root / "images" / scroll_id,
        repo_root / "public" / "images" / scroll_id,
    ]
    for path in candidates:
        if path.is_dir():
            return path.resolve()
    return candidates[0]


# ---------------------------------------------------------------------------
#  Image scanning
# ---------------------------------------------------------------------------

def find_image_file(images_dir: Path, base: str) -> Path | None:
    for ext in (".jpg", ".jpeg", ".png", ".webp"):
        p = images_dir / f"{base}{ext}"
        if p.exists():
            return p
    return None


def _extract_index_from_path(file_path: Path) -> int | None:
    m = INDEX_IN_FILENAME_RE.search(file_path.stem)
    return int(m.group(1)) if m else None


def _resolution_from_path(file_path: Path) -> int:
    mm = re.findall(r"-(\d{2,5})(?:[-.]|$)", file_path.stem)
    if mm:
        try:
            return int(mm[-1])
        except ValueError:
            pass
    return 0


def collect_images_by_index(images_dir: Path) -> dict[int, list[Path]]:
    index_to_paths: dict[int, list[Path]] = {}
    for ext in ("*.jpg", "*.jpeg", "*.png", "*.webp"):
        for p in images_dir.rglob(ext):
            if not p.is_file():
                continue
            idx = _extract_index_from_path(p)
            if idx is not None:
                index_to_paths.setdefault(idx, []).append(p)
    for paths in index_to_paths.values():
        paths.sort(key=lambda x: (-_resolution_from_path(x), x.name))
    return index_to_paths


def pick_file_for_index(index_to_paths: dict[int, list[Path]], global_index: int) -> Path | None:
    paths = index_to_paths.get(global_index)
    return paths[0] if paths else None


# ---------------------------------------------------------------------------
#  Scene helpers
# ---------------------------------------------------------------------------

def get_scenes_config(config: dict) -> list[dict]:
    """Return scenes/chapters list with unified 'id' key and optional text fields."""
    items = config.get("scenes") or config.get("chapters") or []
    scenes: list[dict] = []
    for s in items:
        scene: dict = {
            "id": s.get("scene_id") or s.get("id"),
            "title": s.get("title", ""),
            "range": s["range"],
        }
        if s.get("titleen"):
            scene["titleen"] = s["titleen"]
        if s.get("text"):
            scene["text"] = s["text"]
        if "ekotoba_src" in s:
            scene["ekotoba_src"] = s["ekotoba_src"]
        scenes.append(scene)
    return scenes


def expand_chapters(config: dict) -> list[tuple[int, str, int, int]]:
    """(chapter_id, title, global_index, ordinal_within_chapter)"""
    out = []
    for ch in get_scenes_config(config):
        ch_id = ch["id"]
        title = ch["title"]
        start, end = ch["range"]
        for pos, idx in enumerate(range(start, end + 1), start=1):
            out.append((ch_id, title, idx, pos))
    return out


# ---------------------------------------------------------------------------
#  Cloudinary
# ---------------------------------------------------------------------------

def configure_cloudinary() -> None:
    url = os.environ.get("CLOUDINARY_URL")
    if url:
        cloudinary.config(cloudinary_url=url)
        return
    cloudinary.config(
        cloud_name=ensure_env("CLOUDINARY_CLOUD_NAME"),
        api_key=ensure_env("CLOUDINARY_API_KEY"),
        api_secret=ensure_env("CLOUDINARY_API_SECRET"),
    )


def upload_to_cloudinary(file_path: Path, public_id: str, folder: str | None = None) -> dict:
    """Upload to Cloudinary; return metadata dict."""
    opts = {"public_id": public_id, "overwrite": True}
    if folder:
        opts["folder"] = folder
    result = cloudinary.uploader.upload(str(file_path), **opts)
    stored_public_id = result.get("public_id") or public_id
    ext = result.get("format") or file_path.suffix.lstrip(".") or "jpg"
    src_relative = f"{stored_public_id}.{ext}" if ext else stored_public_id
    return {
        "src": src_relative,
        "width": int(result.get("width") or 0),
        "height": int(result.get("height") or 0),
        "public_id": stored_public_id,
    }


# ---------------------------------------------------------------------------
#  Build upload plan from YAML config
# ---------------------------------------------------------------------------

def build_upload_plan(config: dict) -> list[dict]:
    """Build a list of {scroll_id, volume_num, chapter, index, ordinal, title}."""
    plan = []
    scroll_id = config["scroll_id"]
    volume_num = int(config.get("volume_num", 1))
    for ch_id, title, index, ordinal in expand_chapters(config):
        plan.append({
            "scroll_id": scroll_id,
            "volume_num": volume_num,
            "chapter": ch_id,
            "index": index,
            "ordinal": ordinal,
            "title": title,
        })
    return plan


# ---------------------------------------------------------------------------
#  Main (standalone)
# ---------------------------------------------------------------------------

def main(args: argparse.Namespace | None = None) -> list[dict]:
    """
    Run the sync pipeline for one config file.
    Returns list of image_rows (dicts with Cloudinary metadata).
    """
    parser = argparse.ArgumentParser(description="Sync scroll to Cloudinary")
    parser.add_argument("config_path", nargs="?", help="Path to scroll_config.yaml")
    parser.add_argument("--dry-run", action="store_true", help="Only print plan")
    parser.add_argument("--skip-upload", action="store_true", help="Skip Cloudinary upload")
    parser.add_argument("--json-output", action="store_true", help="Print image plan as JSON")
    parsed = parser.parse_args(args) if isinstance(args, list) else (args or parser.parse_args())

    repo_root = Path(__file__).resolve().parent.parent
    config_path = get_config_path(repo_root, parsed.config_path)
    if not config_path.exists():
        raise SystemExit(f"Config not found: {config_path}")

    config = load_yaml(str(config_path))
    scroll_id = config["scroll_id"]
    volume_num = int(config.get("volume_num", 1))
    folder = config.get("folder", "emakimono")

    images_dir = resolve_images_dir(repo_root, scroll_id, config_path)

    plan = build_upload_plan(config)
    cloudinary_folder = os.environ.get("CLOUDINARY_FOLDER", folder)

    index_to_paths = collect_images_by_index(images_dir) if images_dir.exists() else {}
    num_indices = len(index_to_paths)
    if not parsed.dry_run:
        print(f"Found {num_indices} images in {images_dir}", file=sys.stderr)

    image_rows = []
    for item in plan:
        ordinal = item.get("ordinal", item["index"])
        public_id = image_public_id(scroll_id, volume_num, item["chapter"], ordinal)
        sort_key_val = (item["chapter"] * 100) + ordinal

        upload_result = None
        file_path = None
        if parsed.skip_upload or parsed.dry_run:
            src_val = ""
            width_val, height_val = 0, 0
        else:
            configure_cloudinary()
            file_path = find_image_file(images_dir, public_id) if images_dir.exists() else None
            if not file_path:
                file_path = pick_file_for_index(index_to_paths, item["index"])
            if file_path:
                upload_result = upload_to_cloudinary(file_path, public_id, folder=cloudinary_folder)
                src_val = upload_result["src"]
                width_val = upload_result["width"]
                height_val = upload_result["height"]
            else:
                print(f"Warning: no file for index {item['index']} (public_id={public_id})",
                      file=sys.stderr)
                src_val = ""
                width_val, height_val = 0, 0

        stored_id = public_id
        if upload_result:
            stored_id = upload_result.get("public_id") or public_id
        image_rows.append({
            "public_id": strip_cloudinary_folder(stored_id),
            "ordinal": ordinal,
            "chapter": item["chapter"],
            "index": item["index"],
            "src": src_val,
            "width": width_val,
            "height": height_val,
            "sort_key": sort_key_val,
        })

    if parsed.dry_run:
        print("=== Upload plan ===")
        for r in image_rows:
            print(f"  [{r['index']:3d}] chapter={r['chapter']:2d}  ordinal={r['ordinal']:2d}  "
                  f"public_id={r['public_id']}")
        print(f"\nTotal: {len(image_rows)} images")
        return image_rows

    print(f"Done: scroll_id={scroll_id} volume_num={volume_num} images={len(image_rows)}",
          file=sys.stderr)

    if parsed.json_output:
        print(json.dumps(image_rows, ensure_ascii=False))

    return image_rows


if __name__ == "__main__":
    main()
