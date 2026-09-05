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
  SYNC_UPLOAD_WORKERS  — parallel upload threads (default: 3)
  SYNC_UPLOAD_TIMEOUT  — per-request timeout seconds (default: 120)
  SYNC_UPLOAD_RETRIES  — max attempts per file (default: 5)
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import quote, urlparse

import requests
import yaml

try:
    import cloudinary
    import cloudinary.utils
except ImportError:
    cloudinary = None  # type: ignore[assignment]
    cloudinary.utils = None  # type: ignore[assignment]

REPO_ROOT = Path(__file__).resolve().parent.parent

try:
    from dotenv import load_dotenv

    load_dotenv(REPO_ROOT / ".env.local")
except ImportError:
    pass

from scroll_image_utils import (  # noqa: E402
    INDEX_IN_FILENAME_RE,
    collect_images_by_index,
    extract_index_from_path,
    pick_file_for_index,
    resolution_from_path,
)

# Backward-compatible aliases used within this module
_extract_index_from_path = extract_index_from_path
_resolution_from_path = resolution_from_path


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
        if s.get("slots"):
            scene["slots"] = s["slots"]
        # 源氏帖番号など、Cloudinary scene id と別のビューア用 chapter キー
        if s.get("genji_chapter") is not None:
            scene["genji_chapter"] = s["genji_chapter"]
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
#  Cloudinary (requests-based — avoids SDK TCP keep-alive hangs on some networks)
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class CloudinaryCredentials:
    api_key: str
    api_secret: str
    cloud_name: str


def get_cloudinary_credentials() -> CloudinaryCredentials:
    if cloudinary is None:
        raise SystemExit("cloudinary package required: pip install -r scripts/requirements-sync.txt")
    url = os.environ.get("CLOUDINARY_URL")
    if url:
        parsed = urlparse(url)
        if parsed.scheme != "cloudinary":
            raise SystemExit("Invalid CLOUDINARY_URL scheme. Expecting 'cloudinary://'")
        return CloudinaryCredentials(
            api_key=parsed.username or "",
            api_secret=parsed.password or "",
            cloud_name=parsed.hostname or "",
        )
    return CloudinaryCredentials(
        api_key=ensure_env("CLOUDINARY_API_KEY"),
        api_secret=ensure_env("CLOUDINARY_API_SECRET"),
        cloud_name=ensure_env("CLOUDINARY_CLOUD_NAME"),
    )


def _cloudinary_signature(params: dict[str, str], api_secret: str) -> str:
    if cloudinary is None or cloudinary.utils is None:
        raise SystemExit("cloudinary package required for API signing")
    return cloudinary.utils.api_sign_request(params, api_secret)


def upload_cache_path(config_path: Path) -> Path:
    return config_path.parent / ".upload-cache.json"


def load_upload_cache(config_path: Path) -> dict[str, dict]:
    path = upload_cache_path(config_path)
    if not path.exists():
        return {}
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def save_upload_cache(config_path: Path, cache: dict[str, dict]) -> None:
    path = upload_cache_path(config_path)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(cache, handle, ensure_ascii=False, indent=2)


def _local_file_fingerprint(file_path: Path) -> tuple[int, float]:
    stat = file_path.stat()
    return stat.st_size, stat.st_mtime


def _match_local_cache(
    cache: dict[str, dict],
    public_id: str,
    file_path: Path,
) -> dict | None:
    entry = cache.get(public_id)
    if not entry:
        return None
    size, mtime = _local_file_fingerprint(file_path)
    if entry.get("bytes") != size:
        return None
    cached_mtime = entry.get("mtime")
    if cached_mtime is not None and cached_mtime != mtime:
        return None
    return entry


def _full_public_id(folder: str | None, public_id: str) -> str:
    return f"{folder}/{public_id}" if folder else public_id


def _src_has_version(src: str | None) -> bool:
    """True when cache src already embeds Cloudinary version (v123/... )."""
    return bool(re.match(r"^v\d+/", str(src or "").lstrip("/")))


def _upload_result_from_api(data: dict, file_path: Path | None = None) -> dict:
    """Normalize Cloudinary upload/resource JSON into cache row fields.

    ``src`` prefers versioned form required by naming-convention.md:
    ``v{version}/{public_id}.{ext}`` so CDN derived URLs bust after overwrite.
    """
    stored_public_id = data.get("public_id", "")
    ext = data.get("format") or (file_path.suffix.lstrip(".") if file_path else "jpg") or "jpg"
    version = data.get("version")
    if version and stored_public_id:
        src_relative = f"v{version}/{stored_public_id}.{ext}"
    elif stored_public_id:
        src_relative = f"{stored_public_id}.{ext}" if ext else stored_public_id
    else:
        src_relative = ""
    return {
        "src": src_relative,
        "width": int(data.get("width") or 0),
        "height": int(data.get("height") or 0),
        "public_id": stored_public_id,
        "version": int(version) if version is not None else None,
    }


def fetch_existing_resource(
    creds: CloudinaryCredentials,
    folder: str | None,
    public_id: str,
) -> dict | None:
    """Return Cloudinary resource metadata if it exists, else None.

    Admin API uses HTTP Basic auth (api_key / api_secret), not signed upload params.
    """
    full_id = _full_public_id(folder, public_id)
    encoded_id = quote(full_id, safe="")
    url = f"https://api.cloudinary.com/v1_1/{creds.cloud_name}/resources/image/upload/{encoded_id}"
    try:
        response = requests.get(
            url,
            auth=(creds.api_key, creds.api_secret),
            timeout=int(os.environ.get("SYNC_UPLOAD_TIMEOUT", "30")),
        )
    except requests.RequestException as exc:
        print(f"  Warning: could not check {full_id}: {exc}", file=sys.stderr, flush=True)
        return None
    if response.status_code == 404:
        return None
    if response.status_code != 200:
        print(
            f"  Warning: resource check failed ({response.status_code}) for {full_id}",
            file=sys.stderr,
            flush=True,
        )
        return None
    return response.json()


def upload_to_cloudinary(
    file_path: Path,
    public_id: str,
    creds: CloudinaryCredentials,
    folder: str | None = None,
    timeout: int | None = None,
    retries: int | None = None,
) -> dict:
    """Upload to Cloudinary via REST API; return metadata dict."""
    timeout = timeout if timeout is not None else int(os.environ.get("SYNC_UPLOAD_TIMEOUT", "120"))
    retries = retries if retries is not None else int(os.environ.get("SYNC_UPLOAD_RETRIES", "5"))

    ts = str(int(time.time()))
    params: dict[str, str] = {
        "timestamp": ts,
        "public_id": public_id,
        "overwrite": "true",
        # Purge CDN derived transforms for the same public_id (must be signed).
        "invalidate": "true",
    }
    if folder:
        params["folder"] = folder
    sig = _cloudinary_signature(params, creds.api_secret)
    api = f"https://api.cloudinary.com/v1_1/{creds.cloud_name}/image/upload"
    form = {**params, "api_key": creds.api_key, "signature": sig}

    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            with open(file_path, "rb") as handle:
                response = requests.post(
                    api,
                    data=form,
                    files={"file": handle},
                    timeout=timeout,
                )
            response.raise_for_status()
            return _upload_result_from_api(response.json(), file_path)
        except requests.RequestException as exc:
            last_error = exc
            if attempt >= retries:
                break
            wait = 3 * attempt
            print(
                f"    retry {attempt}/{retries} in {wait}s ({file_path.name}): {exc}",
                file=sys.stderr,
                flush=True,
            )
            time.sleep(wait)

    raise SystemExit(
        f"Upload failed for {file_path.name} after {retries} attempts: {last_error}"
    ) from last_error


def enrich_upload_cache_from_data_emakis(
    config: dict,
    cache: dict,
    images_dir: Path,
    index_to_paths: dict[int, list[Path]],
) -> int:
    """Seed local upload cache from an existing dataEmakis.json Cloudinary entry."""
    titleen = config.get("metadata", {}).get("titleen", "")
    if not titleen:
        return 0
    data_path = REPO_ROOT / "local-data/pipeline/dataEmakis.json"
    if not data_path.exists():
        return 0

    with open(data_path, "r", encoding="utf-8") as handle:
        entries = json.load(handle)

    entry = next((e for e in entries if e.get("titleen") == titleen), None)
    if not entry:
        return 0

    by_name = {
        slot["name"]: slot
        for slot in entry.get("emakis", [])
        if slot.get("cat") == "image" and slot.get("name") and slot.get("config") == "cloudinary"
    }

    scroll_id = config["scroll_id"]
    volume_num = int(config.get("volume_num", 1))
    added = 0
    for ch_id, _title, index, ordinal in expand_chapters(config):
        public_id = image_public_id(scroll_id, volume_num, ch_id, ordinal)
        if public_id in cache or public_id not in by_name:
            continue
        file_path = _resolve_upload_file(images_dir, index_to_paths, public_id, index)
        if file_path is None:
            continue
        slot = by_name[public_id]
        src = slot.get("src", "")
        if isinstance(src, str) and src.startswith("/"):
            src = src.lstrip("/")
        size, mtime = _local_file_fingerprint(file_path)
        cache[public_id] = {
            "bytes": size,
            "mtime": mtime,
            "src": src,
            "width": int(slot.get("srcWidth") or 0),
            "height": int(slot.get("srcHeight") or 0),
            "public_id": f"emakimono/{public_id}",
        }
        added += 1
    return added


def _resolve_upload_file(
    images_dir: Path,
    index_to_paths: dict[int, list[Path]],
    public_id: str,
    global_index: int,
) -> Path | None:
    if images_dir.exists():
        found = find_image_file(images_dir, public_id)
        if found:
            return found
    return pick_file_for_index(index_to_paths, global_index)


def _cache_entry_from_upload(file_path: Path, upload_result: dict) -> dict:
    size, mtime = _local_file_fingerprint(file_path)
    entry = {
        "bytes": size,
        "mtime": mtime,
        "src": upload_result["src"],
        "width": upload_result["width"],
        "height": upload_result["height"],
        "public_id": upload_result["public_id"],
    }
    if upload_result.get("version") is not None:
        entry["version"] = upload_result["version"]
    return entry


def _row_from_cache_entry(
    task: dict,
    entry: dict,
    *,
    skipped: bool,
) -> dict:
    stored_id = entry.get("public_id") or task["public_id"]
    return {
        "public_id": strip_cloudinary_folder(stored_id),
        "ordinal": task["ordinal"],
        "chapter": task["chapter"],
        "index": task["index"],
        "src": entry["src"],
        "width": int(entry.get("width") or 0),
        "height": int(entry.get("height") or 0),
        "sort_key": task["sort_key"],
        "_skipped": skipped,
        "_uploaded": False,
    }


def _process_upload_task(
    task: dict,
    creds: CloudinaryCredentials,
    folder: str | None,
    cache: dict[str, dict],
    cache_lock: threading.Lock,
    *,
    force_upload: bool,
    remote_check: bool,
) -> dict:
    """Upload one planned image (or skip if unchanged on Cloudinary)."""
    index = task["index"]
    public_id = task["public_id"]
    file_path = task["file_path"]

    if file_path is None:
        print(
            f"  [{index:3d}] WARNING: no file (public_id={public_id})",
            file=sys.stderr,
            flush=True,
        )
        return {
            "public_id": public_id,
            "ordinal": task["ordinal"],
            "chapter": task["chapter"],
            "index": index,
            "src": "",
            "width": 0,
            "height": 0,
            "sort_key": task["sort_key"],
            "_skipped": False,
            "_uploaded": False,
        }

    if not force_upload:
        cached = _match_local_cache(cache, public_id, file_path)
        if cached is not None:
            if not _src_has_version(cached.get("src")):
                existing = fetch_existing_resource(creds, folder, public_id)
                if existing is not None:
                    print(
                        f"  [{index:3d}] refresh version {public_id}",
                        file=sys.stderr,
                        flush=True,
                    )
                    upload_result = _upload_result_from_api(existing, file_path)
                    with cache_lock:
                        cache[public_id] = _cache_entry_from_upload(file_path, upload_result)
                    return _row_from_cache_entry(task, cache[public_id], skipped=True)
            print(f"  [{index:3d}] skip (local cache) {public_id}", file=sys.stderr, flush=True)
            return _row_from_cache_entry(task, cached, skipped=True)

        if remote_check:
            local_bytes = file_path.stat().st_size
            existing = fetch_existing_resource(creds, folder, public_id)
            if existing is not None and existing.get("bytes") == local_bytes:
                print(f"  [{index:3d}] skip (cloudinary) {public_id}", file=sys.stderr, flush=True)
                upload_result = _upload_result_from_api(existing, file_path)
                with cache_lock:
                    cache[public_id] = _cache_entry_from_upload(file_path, upload_result)
                return _row_from_cache_entry(task, cache[public_id], skipped=True)

    print(f"  [{index:3d}] uploading {file_path.name} -> {public_id}", file=sys.stderr, flush=True)
    upload_result = upload_to_cloudinary(file_path, public_id, creds, folder=folder)
    with cache_lock:
        cache[public_id] = _cache_entry_from_upload(file_path, upload_result)
    return {
        "public_id": strip_cloudinary_folder(upload_result["public_id"]),
        "ordinal": task["ordinal"],
        "chapter": task["chapter"],
        "index": index,
        "src": upload_result["src"],
        "width": upload_result["width"],
        "height": upload_result["height"],
        "sort_key": task["sort_key"],
        "_skipped": False,
        "_uploaded": True,
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
    parser.add_argument("--force-upload", action="store_true", help="Re-upload even if unchanged")
    parser.add_argument(
        "--remote-check",
        action="store_true",
        help="Query Cloudinary Admin API when local cache misses (slower; optional)",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=int(os.environ.get("SYNC_UPLOAD_WORKERS", "3")),
        help="Parallel upload threads (default: 3)",
    )
    parser.add_argument("--json-output", action="store_true", help="Print image plan as JSON")
    parsed = parser.parse_args(args) if isinstance(args, list) else (args or parser.parse_args())

    repo_root = REPO_ROOT
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
        print(f"Found {num_indices} images in {images_dir}", file=sys.stderr, flush=True)

    image_rows: list[dict] = []

    if parsed.skip_upload or parsed.dry_run:
        for item in plan:
            ordinal = item.get("ordinal", item["index"])
            public_id = image_public_id(scroll_id, volume_num, item["chapter"], ordinal)
            image_rows.append({
                "public_id": public_id,
                "ordinal": ordinal,
                "chapter": item["chapter"],
                "index": item["index"],
                "src": "",
                "width": 0,
                "height": 0,
                "sort_key": (item["chapter"] * 100) + ordinal,
            })
    else:
        creds = get_cloudinary_credentials()
        upload_cache = load_upload_cache(config_path)
        seeded = enrich_upload_cache_from_data_emakis(
            config, upload_cache, images_dir, index_to_paths
        )
        if seeded:
            print(
                f"Seeded {seeded} image(s) into local upload cache from dataEmakis.json",
                file=sys.stderr,
                flush=True,
            )
        cache_lock = threading.Lock()
        tasks: list[dict] = []
        for item in plan:
            ordinal = item.get("ordinal", item["index"])
            public_id = image_public_id(scroll_id, volume_num, item["chapter"], ordinal)
            tasks.append({
                "index": item["index"],
                "ordinal": ordinal,
                "chapter": item["chapter"],
                "public_id": public_id,
                "sort_key": (item["chapter"] * 100) + ordinal,
                "file_path": _resolve_upload_file(
                    images_dir, index_to_paths, public_id, item["index"]
                ),
            })

        workers = max(1, parsed.workers)
        print(
            f"Uploading {len(tasks)} image(s) with {workers} worker(s)...",
            file=sys.stderr,
            flush=True,
        )

        results: list[dict] = []
        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = {
                executor.submit(
                    _process_upload_task,
                    task,
                    creds,
                    cloudinary_folder,
                    upload_cache,
                    cache_lock,
                    force_upload=parsed.force_upload,
                    remote_check=parsed.remote_check,
                ): task
                for task in tasks
            }
            for future in as_completed(futures):
                results.append(future.result())

        image_rows = sorted(results, key=lambda row: row["index"])
        uploaded = sum(1 for row in results if row.get("_uploaded"))
        skipped = sum(1 for row in results if row.get("_skipped"))
        for row in image_rows:
            row.pop("_uploaded", None)
            row.pop("_skipped", None)

        save_upload_cache(config_path, upload_cache)

        print(
            f"Done: scroll_id={scroll_id} uploaded={uploaded} skipped={skipped} total={len(image_rows)}",
            file=sys.stderr,
            flush=True,
        )

    if parsed.dry_run:
        print("=== Upload plan ===")
        for row in image_rows:
            print(f"  [{row['index']:3d}] chapter={row['chapter']:2d}  ordinal={row['ordinal']:2d}  "
                  f"public_id={row['public_id']}")
        print(f"\nTotal: {len(image_rows)} images")
        return image_rows

    if parsed.skip_upload:
        print(
            f"Done: scroll_id={scroll_id} volume_num={volume_num} images={len(image_rows)} (skip-upload)",
            file=sys.stderr,
            flush=True,
        )

    if parsed.json_output:
        print(json.dumps(image_rows, ensure_ascii=False))

    return image_rows


if __name__ == "__main__":
    main()
