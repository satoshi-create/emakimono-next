#!/usr/bin/env python3
"""
build_content_map.py — Build analytics/content-map.json from dataEmakis.json.

Usage:
  py -3.14 scripts/analytics/build_content_map.py
  py -3.14 scripts/analytics/build_content_map.py --if-stale
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from _config import load_project_config  # noqa: E402
from _paths import REPO_ROOT  # noqa: E402




def load_emaki_entries(source: Path) -> list[dict]:
    if source.is_file():
        data = json.loads(source.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    if source.is_dir():
        order_path = source / "_order.json"
        order = json.loads(order_path.read_text(encoding="utf-8"))
        if not isinstance(order, list):
            return []
        entries: list[dict] = []
        for titleen in order:
            if not isinstance(titleen, str):
                continue
            scroll_path = source / f"{titleen}.json"
            item = json.loads(scroll_path.read_text(encoding="utf-8"))
            if isinstance(item, dict):
                entries.append(item)
        return entries
    raise FileNotFoundError(source)


def source_mtime(source: Path) -> float:
    if source.is_file():
        return source.stat().st_mtime
    if source.is_dir():
        mtimes = [source.stat().st_mtime]
        order_path = source / "_order.json"
        if order_path.is_file():
            mtimes.append(order_path.stat().st_mtime)
        for path in source.glob("*.json"):
            if path.name != "_order.json":
                mtimes.append(path.stat().st_mtime)
        return max(mtimes)
    return 0.0

def build_content_map(project: dict) -> dict:
    emakis_path = REPO_ROOT / project["content"]["emakis_json"]
    slug_field = project["content"]["slug_field"]
    entries = load_emaki_entries(emakis_path)

    by_slug: dict[str, dict] = {}
    for item in entries:
        slug = item.get(slug_field)
        if not slug:
            continue
        keywords = item.get("keyword") or []
        by_slug[slug] = {
            "id": item.get("id"),
            "title": item.get("title"),
            "titleen": slug,
            "author": item.get("author"),
            "era": item.get("era"),
            "encodeUrl": item.get("encodeUrl"),
            "keywords": [k.get("slug") or k.get("name") for k in keywords if isinstance(k, dict)],
        }

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": project["content"]["emakis_json"],
        "slug_field": slug_field,
        "count": len(by_slug),
        "by_slug": by_slug,
    }


def is_stale(output_path: Path, source_path: Path) -> bool:
    if not output_path.is_file():
        return True
    return source_mtime(source_path) > output_path.stat().st_mtime


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Build analytics content map from dataEmakis.json")
    parser.add_argument("--if-stale", action="store_true", help="Skip if content-map is up to date")
    parser.add_argument("--output", type=Path, help="Override output path")
    args = parser.parse_args(argv)

    project = load_project_config(expand_env=False)
    source_path = REPO_ROOT / project["content"]["emakis_json"]
    output_path = args.output or (REPO_ROOT / project["content"]["content_map"])

    if args.if_stale and not is_stale(output_path, source_path):
        print(f"Content map up to date: {output_path.relative_to(REPO_ROOT)}")
        return 0

    payload = build_content_map(project)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {output_path.relative_to(REPO_ROOT)} ({payload['count']} emaki)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
