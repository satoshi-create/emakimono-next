#!/usr/bin/env python3
"""
Sync scroll: read scroll_config.yaml, upload images to Cloudinary,
upsert scene_titles and images to Supabase.

汎用化されたスクリプト。YAML の内容を変更するだけで各種絵巻物（鳥獣戯画、九相図など）
のメタデータ・シーン・画像を Supabase/Cloudinary と同期できます。

Supabase schema:
  - scene_titles: scene_id, scroll_id, chapter, sort_key, theme_id, common_id
  - images: image_id ({folder}/{public_id}), scene_id, scroll_id, src, width, height, sort_key

ID形式:
  - public_id (Cloudinary): {scroll_id}__{scroll_id}_{volume_num}_{chapter:02d}_{ordinal:02d}
  - image_id: {folder}/{public_id}
  - common_id: YAML で指定、未指定時は {scroll_id}_{chapter}

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

# ファイル名中の _数字 を抽出（末尾や拡張子に依存せず、数字の後の文字は任意）
INDEX_IN_FILENAME_RE = re.compile(r"_(\d+)", re.IGNORECASE)

# 画像拡張子（大文字小文字を区別しない）
IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")
IMAGE_EXT_SET = {e.lower() for e in IMAGE_EXTENSIONS}


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
    """base 名で画像を検索（再帰的）。拡張子は大文字小文字を区別しない。"""
    base_lower = base.lower()
    for p in images_dir.rglob("*"):
        if not p.is_file():
            continue
        if p.suffix.lower() not in IMAGE_EXT_SET:
            continue
        if p.stem == base or p.stem.lower() == base_lower:
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
    """画像を再帰的に収集。拡張子は大文字小文字を区別しない。"""
    index_to_paths: dict[int, list[Path]] = {}
    seen: set[Path] = set()
    for p in images_dir.rglob("*"):
        if not p.is_file() or p in seen:
            continue
        if p.suffix.lower() not in IMAGE_EXT_SET:
            continue
        seen.add(p)
        idx = _extract_index_from_path(p)
        if idx is not None:
            index_to_paths.setdefault(idx, []).append(p)
    for paths in index_to_paths.values():
        paths.sort(key=lambda x: (-_resolution_from_path(x), x.name))
    return index_to_paths


def pick_file_for_index(index_to_paths: dict[int, list[Path]], global_index: int) -> Path | None:
    paths = index_to_paths.get(global_index)
    return paths[0] if paths else None


def _safe_int(val, default: int = 0) -> int:
    """値を int に変換。失敗時は default を返す。"""
    if val is None:
        return default
    if isinstance(val, int):
        return val
    try:
        return int(val)
    except (ValueError, TypeError):
        return default


def get_scenes_config(config: dict) -> list[dict]:
    """chapters または scenes を取得。欠けている項目はデフォルトで補完。"""
    items = config.get("scenes") or config.get("chapters") or []
    result = []
    for i, s in enumerate(items):
        if not isinstance(s, dict):
            continue
        ch_id = s.get("scene_id") or s.get("id") or (i + 1)
        ch_id = _safe_int(ch_id, i + 1)
        range_val = s.get("range")
        if range_val is None or not isinstance(range_val, (list, tuple)) or len(range_val) < 2:
            range_val = [ch_id, ch_id]
        start = _safe_int(range_val[0], ch_id)
        end = _safe_int(range_val[1], ch_id)
        if start > end:
            start, end = end, start
        result.append({
            "id": ch_id,
            "title": s.get("title") or "",
            "range": [start, end],
            "common_id": s.get("common_id"),
        })
    return result


def expand_chapters(config: dict) -> list[tuple[int, str, int, int]]:
    """(chapter_id, title, index, ordinal). ordinal = 1-based within chapter."""
    out = []
    for ch in get_scenes_config(config):
        ch_id = _safe_int(ch["id"], 0)
        title = ch.get("title", "") or ""
        start, end = ch["range"][0], ch["range"][1]
        for pos, idx in enumerate(range(start, end + 1), start=1):
            out.append((ch_id, title, idx, pos))
    return out


def build_scene_titles(config: dict) -> list[dict]:
    """scene_titles 行を構築。common_id は YAML 優先、未定義時は {scroll_id}_{chapter}。"""
    scroll_id = config.get("scroll_id") or "unknown"
    volume_num = _safe_int(config.get("volume_num"), 1)
    theme_id = config.get("theme_id") or scroll_id
    seen = set()
    rows = []
    for ch in get_scenes_config(config):
        ch_id = _safe_int(ch["id"], 0)
        key = (scroll_id, volume_num, ch_id)
        if key in seen:
            continue
        seen.add(key)
        # common_id: YAML で定義されていればそれを使用、否則 {scroll_id}_{chapter}
        common_id_val = ch.get("common_id") or f"{scroll_id}_{ch_id}"
        if isinstance(common_id_val, str) and common_id_val.strip():
            pass
        else:
            common_id_val = f"{scroll_id}_{ch_id}"
        rows.append({
            "scene_id": scene_id(scroll_id, volume_num, ch_id),
            "scroll_id": scroll_id,
            "chapter": ch_id,
            "sort_key": ch_id * 100,
            "theme_id": theme_id,
            "common_id": str(common_id_val),
        })
    return rows


def build_images_plan(config: dict) -> list[dict]:
    plan = []
    scroll_id = config.get("scroll_id") or "unknown"
    volume_num = _safe_int(config.get("volume_num"), 1)
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
    """Upload to Cloudinary; return {src: emakimono/ で始まる相対パス, width, height, public_id}."""
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


def get_supabase() -> Client:
    url = ensure_env("SUPABASE_URL", ["NEXT_PUBLIC_SUPABASE_URL"])
    key = ensure_env("SUPABASE_SERVICE_ROLE_KEY", ["SUPABASE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"])
    return create_client(url, key)


# scene_titles テーブルに存在するカラムのみ送信（volume_num 等の余分なカラムを排除）
SCENE_TITLES_COLUMNS = ("scene_id", "scroll_id", "chapter", "sort_key", "theme_id", "common_id")
IMAGES_COLUMNS = ("image_id", "scene_id", "scroll_id", "src", "width", "height", "sort_key")


def _filter_row(row: dict, columns: tuple[str, ...]) -> dict:
    """指定カラムのみ抽出し、chapter/sort_key/width/height を int にキャスト。"""
    out = {}
    for k in columns:
        if k not in row:
            continue
        v = row[k]
        if k in ("chapter", "sort_key", "width", "height") and v is not None:
            try:
                v = int(v)
            except (ValueError, TypeError):
                pass
        out[k] = v
    return out


def upsert_scene_titles(supabase: Client, rows: list[dict], on_conflict: str = "scene_id") -> list[dict]:
    if not rows:
        return []
    filtered = [_filter_row(r, SCENE_TITLES_COLUMNS) for r in rows]
    r = supabase.table("scene_titles").upsert(filtered, on_conflict=on_conflict).execute()
    return list(r.data) if r.data else []


def upsert_images(supabase: Client, rows: list[dict], on_conflict: str = "image_id") -> None:
    if not rows:
        return
    filtered = [_filter_row(r, IMAGES_COLUMNS) for r in rows]
    supabase.table("images").upsert(filtered, on_conflict=on_conflict).execute()


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
    scroll_id = config.get("scroll_id")
    if not scroll_id:
        raise SystemExit("Config error: scroll_id is required")
    volume_num = _safe_int(config.get("volume_num"), 1)

    images_dir_str = os.environ.get("SCROLL_IMAGES_DIR", "")
    if images_dir_str:
        images_dir = (Path(images_dir_str) / scroll_id).resolve()
    else:
        images_dir = repo_root / "images" / scroll_id

    print(f"Sync target: scroll_id={scroll_id} | images_dir={images_dir}", file=sys.stderr)
    if not args.skip_upload and not args.dry_run and not images_dir.exists():
        raise SystemExit(f"Images directory not found: {images_dir}")

    scene_title_rows = build_scene_titles(config)
    plan = build_images_plan(config)
    cloudinary_folder = os.environ.get("CLOUDINARY_FOLDER", "emakimono")

    index_to_paths = collect_images_by_index(images_dir) if images_dir.exists() else {}
    num_indices = len(index_to_paths)
    print(f"Found {num_indices} images in {images_dir}", file=sys.stderr)
    missing_indices: list[tuple[int, str]] = []

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
                    src_val = upload_result["src"]  # emakimono/ で始まる相対パス
                    width_val = upload_result["width"]
                    height_val = upload_result["height"]
                    # Cloudinary が folder 付きで返す場合はそれを使用
                    stored_pid = upload_result.get("public_id", public_id)
                    if "/" in stored_pid:
                        image_id_val = stored_pid
            else:
                missing_indices.append((item["index"], public_id))
                src_val = ""
                width_val, height_val = 0, 0

        image_rows.append({
            "image_id": image_id_val,
            "scene_id": scene_id_val,
            "scroll_id": str(scroll_id),
            "src": src_val,
            "width": width_val,
            "height": height_val,
            "sort_key": sort_key_val,
        })

    if missing_indices:
        print("Missing images (これらの番号の画像が見つかりません):", file=sys.stderr)
        for idx, pid in missing_indices[:20]:  # 最大20件表示
            print(f"  - index {idx} (public_id={pid})", file=sys.stderr)
        if len(missing_indices) > 20:
            print(f"  ... and {len(missing_indices) - 20} more", file=sys.stderr)

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
