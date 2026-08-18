#!/usr/bin/env python3
"""
analyze_cloudinary_assets.py — Analyze Cloudinary asset sizes grouped by emaki.

Usage:
  py -3.14 scripts/analyze_cloudinary_assets.py
  py -3.14 scripts/analyze_cloudinary_assets.py --prefix emakimono/chouju --json
  py -3.14 scripts/analyze_cloudinary_assets.py --max-results 1000
  py -3.14 scripts/analyze_cloudinary_assets.py --format-by type   # group by format
  py -3.14 scripts/analyze_cloudinary_assets.py --min-bytes 500000  # only assets >= 500KB

Exit codes:
  0 = OK
  1 = CLOUDINARY_URL missing or API error
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

try:
    from dotenv import load_dotenv

    load_dotenv(ROOT / ".env.local")
except ImportError:
    pass


GROUP_CATEGORIES = {
    # public_id: "jigokusoushi-genke__jigokusoushi-genke_1_03__02"
    #   → "__" の前が絵巻名
    "emaki": lambda pid: pid.split("__")[0] if "__" in pid else pid,
    "prefix": lambda pid: pid.split("__")[0] if "__" in pid else pid,
    "raw": lambda pid: pid,
    "format": lambda pid: pid.rsplit(".", 1)[-1] if "." in pid else "(webp)",
}


def fetch_all_resources(prefix: str, max_results: int, fields: list[str]) -> list[dict]:
    import cloudinary
    import cloudinary.api

    url = os.environ.get("CLOUDINARY_URL")
    if not url:
        raise SystemExit(
            "Missing CLOUDINARY_URL. Set it in .env.local or the environment."
        )

    cloudinary.config(cloudinary_url=url)

    resources: list[dict] = []
    next_cursor = None

    while True:
        params = dict(
            type="upload",
            prefix=prefix,
            max_results=min(max_results - len(resources), 500),
            fields=fields,
        )
        if next_cursor:
            params["next_cursor"] = next_cursor

        result = cloudinary.api.resources(**params)
        resources.extend(result.get("resources", []))

        next_cursor = result.get("next_cursor")
        if not next_cursor or len(resources) >= max_results:
            break

    return resources


def analyze(
    resources: list[dict],
    group_by: str,
    min_bytes: int = 0,
) -> dict:
    total_count = len(resources)
    total_bytes = sum(a.get("bytes", 0) for a in resources)
    get_key = GROUP_CATEGORIES.get(group_by, GROUP_CATEGORIES["prefix"])

    groups: dict[str, dict] = defaultdict(
        lambda: {"count": 0, "total_bytes": 0, "max_bytes": 0, "min_bytes": float("inf"), "formats": defaultdict(int)}
    )

    for asset in resources:
        pid = asset["public_id"]
        key = get_key(pid)
        b = asset.get("bytes", 0)
        if b < min_bytes:
            total_count -= 1
            total_bytes -= b
            continue

        groups[key]["count"] += 1
        groups[key]["total_bytes"] += b
        groups[key]["max_bytes"] = max(groups[key]["max_bytes"], b)
        groups[key]["min_bytes"] = min(groups[key]["min_bytes"], b)
        groups[key]["formats"][asset.get("format", "?")] += 1

    # fix inf min_bytes
    for g in groups.values():
        if g["min_bytes"] == float("inf"):
            g["min_bytes"] = 0

    return {
        "summary": {
            "total_assets": total_count,
            "total_bytes": total_bytes,
            "total_mb": round(total_bytes / 1024**2, 2),
            "total_gb": round(total_bytes / 1024**3, 4),
            "grouped_by": group_by,
        },
        "groups": {
            name: {
                "count": data["count"],
                "total_mb": round(data["total_bytes"] / 1024**2, 2),
                "avg_kb": round(data["total_bytes"] / data["count"] / 1024, 1),
                "max_kb": round(data["max_bytes"] / 1024, 1),
                "min_kb": round(data["min_bytes"] / 1024, 1),
                "formats": dict(data["formats"]),
            }
            for name, data in sorted(groups.items(), key=lambda x: -x[1]["total_bytes"])
        },
    }


def print_report(result: dict) -> None:
    s = result["summary"]
    print(f"=== Cloudinary Asset Analysis ===")
    print(f"  group_by:   {s['grouped_by']}")
    print(f"  assets:     {s['total_assets']}")
    print(f"  total:      {s['total_mb']:.1f} MB ({s['total_gb']:.3f} GB)")
    print()

    print(f"{'Group':30s} {'Count':>6s} {'Total(MB)':>10s} {'Avg(KB)':>8s} {'Max(KB)':>8s} {'Min(KB)':>8s} {'Formats':>30s}")
    print("-" * 100)
    for name, data in result["groups"].items():
        fmt_str = ", ".join(f"{k}:{v}" for k, v in data["formats"].items())
        print(
            f"{name:30s} {data['count']:6d} {data['total_mb']:9.1f}MB "
            f"{data['avg_kb']:7.1f}K {data['max_kb']:7.1f}K {data['min_kb']:7.1f}K "
            f"{fmt_str:>30s}"
        )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Analyze Cloudinary asset sizes grouped by emaki"
    )
    parser.add_argument(
        "--prefix",
        default="emakimono/",
        help="Asset folder prefix (default: emakimono/)",
    )
    parser.add_argument(
        "--max-results",
        type=int,
        default=500,
        help="Max assets to fetch (default: 500, use higher for full inventory)",
    )
    parser.add_argument(
        "--group-by",
        default="prefix",
        choices=list(GROUP_CATEGORIES.keys()),
        help="Grouping: prefix (emaki name via __ delimiter), emaki (same as prefix), raw (full public_id), format (file type)",
    )
    parser.add_argument(
        "--min-bytes",
        type=int,
        default=0,
        help="Skip assets smaller than this byte count (default: 0)",
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
        help="Save JSON report to file (default: print only)",
    )
    args = parser.parse_args(argv)

    try:
        resources = fetch_all_resources(
            prefix=args.prefix,
            max_results=args.max_results,
            fields=["public_id", "bytes", "width", "height", "format", "created_at", "context"],
        )
    except SystemExit:
        raise
    except Exception as exc:
        print(f"Error fetching Cloudinary resources: {exc}", file=sys.stderr)
        return 1

    report = analyze(resources, group_by=args.group_by, min_bytes=args.min_bytes)

    print_report(report)

    if args.json:
        print()
        print(json.dumps(report, indent=2, ensure_ascii=False))

    if args.output:
        args.output.write_text(
            json.dumps(report, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        print(f"\nSaved to {args.output.resolve()}")

    return 0


if __name__ == "__main__":
    sys.exit(main())