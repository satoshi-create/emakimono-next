#!/usr/bin/env python3
"""
prune_cloudinary_assets.py — Find and delete Cloudinary assets not referenced in production.

Compares emakimono/ uploads against image-metadata-cache.json (+ optional code refs).
Default is dry-run; pass --confirm to delete.

Usage:
  py -3.14 scripts/prune_cloudinary_assets.py
  py -3.14 scripts/prune_cloudinary_assets.py --json --output cloudinary-orphans.json
  py -3.14 scripts/prune_cloudinary_assets.py --scroll-id jigokusoushi-genke --confirm
  py -3.14 scripts/prune_cloudinary_assets.py --confirm

Exit codes:
  0 = OK (dry-run or delete succeeded)
  1 = CLOUDINARY_URL missing, API error, or delete had failures
  2 = --confirm requested but nothing to delete
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CACHE = ROOT / "src/data/image-metadata-cache/image-metadata-cache.json"

EMAKI_PATH_RE = re.compile(r"emakimono/[^\s\"'`,)]+")

try:
    from dotenv import load_dotenv

    load_dotenv(ROOT / ".env.local")
except ImportError:
    pass


def configure_cloudinary() -> None:
    import cloudinary

    url = os.environ.get("CLOUDINARY_URL")
    if not url:
        raise SystemExit(
            "Missing CLOUDINARY_URL. Set it in .env.local or the environment."
        )
    cloudinary.config(cloudinary_url=url)


def normalize_public_id(raw: str) -> str | None:
    """Return emakimono/... public_id without version prefix or file extension."""
    value = raw.strip().strip('"').strip("'")
    if not value:
        return None
    value = value.lstrip("/")
    if value.startswith("http://") or value.startswith("https://"):
        match = EMAKI_PATH_RE.search(value)
        if not match:
            return None
        value = match.group(0)
    if not value.startswith("emakimono/"):
        idx = value.find("emakimono/")
        if idx == -1:
            return None
        value = value[idx:]
    if "." in value.rsplit("/", 1)[-1]:
        value = re.sub(r"\.[a-zA-Z0-9]+$", "", value)
    return value


def scroll_id_from_public_id(public_id: str) -> str:
    local = public_id.replace("emakimono/", "", 1)
    if "__" in local:
        return local.split("__", 1)[0]
    return local


def load_cache_public_ids(cache_path: Path) -> tuple[set[str], dict[str, dict]]:
    """Return active public_ids and scroll_id → {title, titleen} from cache."""
    if not cache_path.exists():
        raise SystemExit(f"Cache not found: {cache_path}")

    with open(cache_path, encoding="utf-8") as f:
        cache = json.load(f)

    public_ids: set[str] = set()
    scroll_meta: dict[str, dict] = {}

    for entry in cache:
        title = entry.get("title") or entry.get("titleen") or ""
        titleen = entry.get("titleen") or ""
        entry_scroll_ids: set[str] = set()

        for emaki in entry.get("emakis", []):
            if emaki.get("config") != "cloudinary":
                continue
            for field in ("src", "name"):
                raw = emaki.get(field)
                if not isinstance(raw, str) or not raw:
                    continue
                pid = normalize_public_id(raw)
                if pid:
                    public_ids.add(pid)
                    entry_scroll_ids.add(scroll_id_from_public_id(pid))

        for sid in entry_scroll_ids:
            scroll_meta.setdefault(
                sid,
                {"title": title, "titleen": titleen},
            )

    return public_ids, scroll_meta


def load_code_ref_public_ids(repo_root: Path) -> set[str]:
    """Collect hardcoded emakimono paths from src (OGP, hub heroes, person profiles)."""
    paths = [
        repo_root / "src/libs/constants/emakiOgImages.js",
        repo_root / "src/data/personname-data/personprofiles.json",
        repo_root / "src/utils/buildChojuGigaHubData.js",
        repo_root / "src/utils/buildKusouzuHubData.js",
        repo_root / "src/components/personname/PersonProfile.js",
    ]
    found: set[str] = set()
    for path in paths:
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        for match in EMAKI_PATH_RE.finditer(text):
            pid = normalize_public_id(match.group(0))
            if pid:
                found.add(pid)
    return found


def fetch_all_resources(prefix: str, max_results: int) -> list[dict]:
    import cloudinary.api

    configure_cloudinary()

    resources: list[dict] = []
    next_cursor = None

    while True:
        params: dict = {
            "type": "upload",
            "prefix": prefix,
            "max_results": min(max_results - len(resources), 500),
            "fields": ["public_id", "bytes", "format", "created_at"],
        }
        if next_cursor:
            params["next_cursor"] = next_cursor

        result = cloudinary.api.resources(**params)
        resources.extend(result.get("resources", []))

        next_cursor = result.get("next_cursor")
        if not next_cursor or len(resources) >= max_results:
            break

    return resources


def group_resources(resources: list[dict]) -> dict[str, list[dict]]:
    groups: dict[str, list[dict]] = defaultdict(list)
    for asset in resources:
        pid = asset["public_id"]
        sid = scroll_id_from_public_id(pid)
        groups[sid].append(asset)
    return dict(groups)


def find_orphan_groups(
    resources: list[dict],
    keep_public_ids: set[str],
    keep_scroll_ids: set[str],
    target_scroll_ids: set[str] | None,
) -> dict[str, list[dict]]:
    groups = group_resources(resources)
    orphans: dict[str, list[dict]] = {}

    for sid, assets in groups.items():
        if target_scroll_ids is not None:
            if sid not in target_scroll_ids:
                continue
            orphans[sid] = assets
            continue

        if sid in keep_scroll_ids:
            continue

        orphan_assets = [a for a in assets if a["public_id"] not in keep_public_ids]
        if not orphan_assets:
            continue
        if len(orphan_assets) == len(assets):
            orphans[sid] = assets
        else:
            orphans[sid] = orphan_assets

    return orphans


def delete_by_prefix(prefix: str) -> dict:
    import cloudinary.api

    configure_cloudinary()
    return cloudinary.api.delete_resources_by_prefix(
        prefix,
        resource_type="image",
        type="upload",
    )


def delete_public_ids(public_ids: list[str]) -> dict:
    import cloudinary.api

    configure_cloudinary()
    deleted: dict = {"deleted": {}, "not_found": {}, "failed": {}}
    batch_size = 100
    for i in range(0, len(public_ids), batch_size):
        batch = public_ids[i : i + batch_size]
        result = cloudinary.api.delete_resources(
            batch,
            resource_type="image",
            type="upload",
        )
        for key in ("deleted", "not_found"):
            deleted[key].update(result.get(key, {}))
        if result.get("partial"):
            deleted["failed"].update(result.get("partial", {}))
    return deleted


def build_report(
    orphans: dict[str, list[dict]],
    scroll_meta: dict[str, dict],
    keep_public_ids: set[str],
    target_scroll_ids: set[str] | None,
) -> dict:
    groups = {}
    total_count = 0
    total_bytes = 0

    for sid, assets in sorted(orphans.items(), key=lambda x: -sum(a.get("bytes", 0) for a in x[1])):
        count = len(assets)
        bytes_sum = sum(a.get("bytes", 0) for a in assets)
        total_count += count
        total_bytes += bytes_sum
        meta = scroll_meta.get(sid, {})
        groups[sid] = {
            "count": count,
            "total_mb": round(bytes_sum / 1024**2, 2),
            "title": meta.get("title") or "",
            "titleen": meta.get("titleen") or "",
            "still_in_cache": sid in scroll_meta,
            "sample_public_id": assets[0]["public_id"],
            "public_ids": [a["public_id"] for a in assets],
        }

    return {
        "summary": {
            "orphan_scroll_ids": len(orphans),
            "orphan_assets": total_count,
            "orphan_mb": round(total_bytes / 1024**2, 2),
            "keep_public_ids": len(keep_public_ids),
            "targeted": target_scroll_ids is not None,
        },
        "groups": groups,
    }


def print_report(report: dict, *, dry_run: bool) -> None:
    s = report["summary"]
    mode = "DRY-RUN" if dry_run else "DELETE"
    print(f"=== Cloudinary Orphans ({mode}) ===")
    print(f"  scroll_ids:  {s['orphan_scroll_ids']}")
    print(f"  assets:      {s['orphan_assets']}")
    print(f"  total:       {s['orphan_mb']:.1f} MB")
    print(f"  keep refs:   {s['keep_public_ids']} public_id(s)")
    if s["targeted"]:
        print("  mode:        explicit --scroll-id")
    print()

    if not report["groups"]:
        print("Nothing to delete.")
        return

    print(f"{'scroll_id':32s} {'Count':>6s} {'MB':>8s} {'Title':20s} {'In cache':>9s}")
    print("-" * 85)
    for sid, data in report["groups"].items():
        title = (data["title"] or data["titleen"] or "-")[:20]
        in_cache = "yes" if data["still_in_cache"] else "no"
        print(
            f"{sid:32s} {data['count']:6d} {data['total_mb']:7.1f} "
            f"{title:20s} {in_cache:>9s}"
        )


def parse_scroll_ids(raw: list[str] | None) -> set[str] | None:
    if not raw:
        return None
    result: set[str] = set()
    for item in raw:
        for part in item.split(","):
            part = part.strip()
            if part:
                result.add(part)
    return result or None


def warn_cache_hits(report: dict) -> None:
    hits = [
        sid
        for sid, data in report["groups"].items()
        if data["still_in_cache"]
    ]
    if hits:
        print(
            f"\nWarning: {len(hits)} scroll_id(s) still referenced in cache: "
            + ", ".join(hits),
            file=sys.stderr,
        )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Find/delete Cloudinary emakimono assets not in image-metadata-cache"
    )
    parser.add_argument(
        "--prefix",
        default="emakimono/",
        help="Cloudinary folder prefix (default: emakimono/)",
    )
    parser.add_argument(
        "--cache-path",
        type=Path,
        default=DEFAULT_CACHE,
        help="Path to image-metadata-cache.json",
    )
    parser.add_argument(
        "--max-results",
        type=int,
        default=5000,
        help="Max Cloudinary assets to fetch (default: 5000)",
    )
    parser.add_argument(
        "--include-code-refs",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Treat hardcoded src paths in src/ as keep list (default: true)",
    )
    parser.add_argument(
        "--keep-scroll-id",
        action="append",
        default=[],
        metavar="ID",
        help="Extra scroll_id to keep (repeatable or comma-separated)",
    )
    parser.add_argument(
        "--scroll-id",
        action="append",
        default=[],
        metavar="ID",
        help="Delete only these scroll_id(s), ignoring orphan detection",
    )
    parser.add_argument(
        "--confirm",
        action="store_true",
        help="Actually delete (default: dry-run report only)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print full JSON report to stdout",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Save JSON report to file",
    )
    args = parser.parse_args(argv)

    cache_ids, scroll_meta = load_cache_public_ids(args.cache_path)
    keep_ids = set(cache_ids)

    if args.include_code_refs:
        code_ids = load_code_ref_public_ids(ROOT)
        keep_ids |= code_ids
        print(f"Keep list: {len(cache_ids)} from cache + {len(code_ids)} from code refs", file=sys.stderr)

    keep_scroll_ids = parse_scroll_ids(args.keep_scroll_id) or set()
    for pid in keep_ids:
        keep_scroll_ids.add(scroll_id_from_public_id(pid))

    target_scroll_ids = parse_scroll_ids(args.scroll_id)

    try:
        resources = fetch_all_resources(args.prefix, args.max_results)
    except SystemExit:
        raise
    except Exception as exc:
        print(f"Error fetching Cloudinary resources: {exc}", file=sys.stderr)
        return 1

    print(f"Fetched {len(resources)} asset(s) under {args.prefix!r}", file=sys.stderr)

    orphans = find_orphan_groups(
        resources,
        keep_public_ids=keep_ids,
        keep_scroll_ids=keep_scroll_ids,
        target_scroll_ids=target_scroll_ids,
    )

    report = build_report(orphans, scroll_meta, keep_ids, target_scroll_ids)
    dry_run = not args.confirm

    print_report(report, dry_run=dry_run)
    warn_cache_hits(report)

    if args.json:
        print()
        print(json.dumps(report, indent=2, ensure_ascii=False))

    if args.output:
        args.output.write_text(
            json.dumps(report, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        print(f"\nSaved to {args.output.resolve()}")

    if not report["groups"]:
        return 2 if args.confirm else 0

    if dry_run:
        print("\nDry-run only. Re-run with --confirm to delete.")
        return 0

    failed = 0
    for sid, data in report["groups"].items():
        prefix = f"emakimono/{sid}"
        try:
            if len(data["public_ids"]) == data["count"]:
                result = delete_by_prefix(prefix)
                deleted_count = len(result.get("deleted", {}))
                print(f"Deleted prefix {prefix}: {deleted_count} asset(s)")
            else:
                result = delete_public_ids(data["public_ids"])
                deleted_count = len(result.get("deleted", {}))
                print(f"Deleted {deleted_count}/{data['count']} asset(s) for {sid}")
            if result.get("partial"):
                failed += len(result["partial"])
        except Exception as exc:
            print(f"Error deleting {sid}: {exc}", file=sys.stderr)
            failed += 1

    if failed:
        print(f"\nDelete completed with {failed} failure(s)", file=sys.stderr)
        return 1

    print("\nDelete OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
