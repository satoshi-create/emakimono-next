#!/usr/bin/env python3
"""
Sync scroll: read scroll_config.yaml, upload images to Cloudinary,
upsert scene_titles and images to Supabase.

Supabase schema:
  - scene_titles: scene_id, scroll_id, chapter, sort_key, theme_id, common_id (choju_m_N)
  - images: image_id ({folder}/{public_id}), scene_id, scroll_id, src (secure_url), width, height, sort_key

ID形式:
  - public_id (Cloudinary): {scroll_id}__{scroll_id}_{volume_num}_{chapter:02d}_{ordinal:02d} (ダブルID)
  - image_id: {folder}/{public_id}
  - common_id: choju_m_{N} (最大値+1から連番)

Usage:
  python scripts/sync_scroll.py [path/to/scroll_config.yaml]

Env:
  SCROLL_IMAGES_DIR, CLOUDINARY_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
"""

from __future__ import annotations

import os
import re
import sys
import argparse
from pathlib import Path

import yaml
import cloudinary
import cloudinary.uploader
from supabase import create_client, Client

INDEX_IN_FILENAME_RE = re.compile(r"_(\d{1,4})[-.]", re.IGNORECASE)


def load_yaml(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def get_config_path(repo_root: Path, arg_path: str | None) -> Path:
    if arg_path:
        p = Path(arg_path)
        return p if p.is_absolute() else (repo_root / p)
    return repo_root / "scroll_config.yaml"


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


def image_public_id(scroll_id: str, volume_num: int, chapter: int, ordinal: int) -> str:
    """Cloudinary public_id: ダブルID形式 {scroll_id}__{scroll_id}_{volume_num}_{chapter:02d}_{ordinal:02d}"""
    return f"{scroll_id}__{scroll_id}_{volume_num}_{chapter:02d}_{ordinal:02d}"


def scene_id(scroll_id: str, volume_num: int, chapter: int) -> str:
    """scene_titles.scene_id = {scroll_id}_{volume_num}_{chapter:02d}"""
    return f"{scroll_id}_{volume_num}_{chapter:02d}"


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


def expand_chapters(config: dict) -> list[tuple[int, str, int, int]]:
    """(chapter_id, title, index, ordinal). ordinal = 1-based within chapter."""
    out = []
    for ch in config.get("chapters") or []:
        ch_id = ch["id"]
        title = ch["title"]
        start, end = ch["range"]
        for pos, idx in enumerate(range(start, end + 1), start=1):
            out.append((ch_id, title, idx, pos))
    return out


def build_scene_titles(config: dict, common_id_start: int = 1) -> list[dict]:
    """scene_titles rows: scene_id, scroll_id, chapter, sort_key, theme_id, common_id."""
    scroll_id = config["scroll_id"]
    volume_num = int(config["volume_num"])
    theme_id = config.get("theme_id") or "choju-giga"
    seen = set()
    rows = []
    seq = common_id_start
    for ch in config.get("chapters") or []:
        key = (scroll_id, volume_num, ch["id"])
        if key in seen:
            continue
        seen.add(key)
        ch_id = ch["id"]
        rows.append({
            "scene_id": scene_id(scroll_id, volume_num, ch_id),
            "scroll_id": scroll_id,
            "chapter": ch_id,
            "sort_key": ch_id * 100,
            "theme_id": theme_id,
            "common_id": f"choju_m_{seq}",
        })
        seq += 1
    return rows


def build_images_plan(config: dict) -> list[dict]:
    plan = []
    scroll_id = config["scroll_id"]
    volume_num = int(config["volume_num"])
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


def configure_cloudinary() -> None:
    url = os.environ.get("CLOUDINARY_URL")
    if url:
        cloudinary.config(cloudinary_url=url)
        return
    cloudinary.config(
        cloud_name=ensure_env("CLOUDINARY_CLOUD_NAME", []),
        api_key=ensure_env("CLOUDINARY_API_KEY", []),
        api_secret=ensure_env("CLOUDINARY_API_SECRET", []),
    )


def upload_to_cloudinary(file_path: Path, public_id: str, folder: str | None = None) -> dict:
    """Upload to Cloudinary; return {src: secure_url, width, height, public_id}."""
    opts = {"public_id": public_id, "overwrite": True}
    if folder:
        opts["folder"] = folder
    result = cloudinary.uploader.upload(str(file_path), **opts)
    return {
        "src": result.get("secure_url") or result.get("url") or "",
        "width": int(result.get("width") or 0),
        "height": int(result.get("height") or 0),
        "public_id": result.get("public_id") or public_id,
    }


def get_supabase() -> Client:
    url = ensure_env("SUPABASE_URL", ["NEXT_PUBLIC_SUPABASE_URL"])
    key = ensure_env("SUPABASE_SERVICE_ROLE_KEY", ["SUPABASE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"])
    return create_client(url, key)


def fetch_max_common_id(supabase: Client) -> int:
    """scene_titles から common_id (choju_m_N 形式) の最大連番を取得。なければ 0。"""
    r = supabase.table("scene_titles").select("common_id").execute()
    max_n = 0
    pat = re.compile(r"choju_m_(\d+)", re.IGNORECASE)
    for row in (r.data or []):
        cid = row.get("common_id") or ""
        m = pat.search(cid)
        if m:
            max_n = max(max_n, int(m.group(1)))
    return max_n


def upsert_scene_titles(supabase: Client, rows: list[dict], on_conflict: str = "scene_id") -> list[dict]:
    if not rows:
        return []
    r = supabase.table("scene_titles").upsert(rows, on_conflict=on_conflict).execute()
    return list(r.data) if r.data else []


def upsert_images(supabase: Client, rows: list[dict], on_conflict: str = "image_id") -> None:
    if not rows:
        return
    supabase.table("images").upsert(rows, on_conflict=on_conflict).execute()


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync scroll from YAML to Cloudinary and Supabase")
    parser.add_argument("config_path", nargs="?", help="Path to scroll_config.yaml")
    parser.add_argument("--dry-run", action="store_true", help="Only print plan")
    parser.add_argument("--skip-upload", action="store_true", help="Skip Cloudinary upload")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parent.parent
    config_path = get_config_path(repo_root, args.config_path)
    if not config_path.exists():
        raise SystemExit(f"Config not found: {config_path}")

    config = load_yaml(str(config_path))
    scroll_id = config["scroll_id"]
    volume_num = int(config["volume_num"])

    images_dir_str = os.environ.get("SCROLL_IMAGES_DIR", "")
    images_dir = Path(images_dir_str).resolve() if images_dir_str else (repo_root / "images" / scroll_id)
    if not args.skip_upload and not args.dry_run and not images_dir.exists():
        raise SystemExit(f"SCROLL_IMAGES_DIR not found: {images_dir}")

    common_id_start = 1
    if not args.dry_run:
        supabase_pre = get_supabase()
        max_common = fetch_max_common_id(supabase_pre)
        common_id_start = max_common + 1
    scene_title_rows = build_scene_titles(config, common_id_start)
    plan = build_images_plan(config)
    cloudinary_folder = os.environ.get("CLOUDINARY_FOLDER", "emakimono")

    index_to_paths = collect_images_by_index(images_dir) if images_dir.exists() else {}

    image_rows = []
    for item in plan:
        ordinal = item.get("ordinal", item["index"])
        public_id = image_public_id(scroll_id, volume_num, item["chapter"], ordinal)
        scene_id_val = scene_id(scroll_id, volume_num, item["chapter"])
        # sort_key: NOT nullable. formula = (chapter * 100) + ordinal
        sort_key_val = (item["chapter"] * 100) + ordinal

        # image_id = {folder}/{public_id} 形式
        image_id_val = f"{cloudinary_folder}/{public_id}"

        if args.skip_upload:
            src_val = os.environ.get(f"IMAGE_SRC_{public_id}", "")
            width_val, height_val = 0, 0
        else:
            file_path = find_image_file(images_dir, public_id) if images_dir.exists() else None
            if not file_path:
                file_path = pick_file_for_index(index_to_paths, item["index"])
            if file_path:
                if args.dry_run:
                    src_val = f"[would upload] {file_path.name} -> public_id={public_id}"
                    width_val, height_val = 0, 0
                else:
                    configure_cloudinary()
                    upload_result = upload_to_cloudinary(file_path, public_id, folder=cloudinary_folder)
                    src_val = upload_result["src"]  # secure_url（完全なURL）
                    width_val = upload_result["width"]
                    height_val = upload_result["height"]
                    # Cloudinary が folder 付きで返す場合はそれを使用
                    stored_pid = upload_result.get("public_id", public_id)
                    if "/" in stored_pid:
                        image_id_val = stored_pid
            else:
                if not args.dry_run:
                    print(f"Warning: no file for index {item['index']} (public_id={public_id})", file=sys.stderr)
                src_val = ""
                width_val, height_val = 0, 0

        image_rows.append({
            "image_id": image_id_val,
            "scene_id": scene_id_val,
            "scroll_id": scroll_id,
            "src": src_val,
            "width": width_val,
            "height": height_val,
            "sort_key": sort_key_val,
        })

    if args.dry_run:
        print("scene_titles (scene_id, scroll_id, chapter, sort_key):", scene_title_rows)
        print("images (image_id, scene_id, sort_key), first 5:", image_rows[:5])
        if len(image_rows) > 5:
            print("...", len(image_rows) - 5, "more images")
        return

    supabase = get_supabase()
    upsert_scene_titles(supabase, scene_title_rows)
    upsert_images(supabase, image_rows)
    print(f"Done: scroll_id={scroll_id} volume_num={volume_num} scene_titles={len(scene_title_rows)} images={len(image_rows)}")


if __name__ == "__main__":
    main()
