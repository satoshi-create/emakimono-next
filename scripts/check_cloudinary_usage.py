#!/usr/bin/env python3
"""
check_cloudinary_usage.py — Fetch Cloudinary usage via Admin API.

Usage:
  py -3.14 scripts/check_cloudinary_usage.py
  py -3.14 scripts/check_cloudinary_usage.py --warn-at 18 --fail-at 20
  py -3.14 scripts/check_cloudinary_usage.py --no-save
  py -3.14 scripts/check_cloudinary_usage.py --date 2026-07-15

Exit codes:
  0 = OK (usage below --fail-at)
  1 = --fail-at exceeded, missing CLOUDINARY_URL, or API error
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

try:
    from dotenv import load_dotenv

    load_dotenv(ROOT / ".env.local")
except ImportError:
    pass


def _credit_usage(result: dict) -> tuple[float | None, float | None, float | None]:
    """Return (usage, limit, used_percent) from usage API payload."""
    credits = result.get("credits")
    if isinstance(credits, dict):
        usage = credits.get("usage")
        limit = credits.get("limit")
        used_percent = credits.get("used_percent")
        if usage is not None:
            return float(usage), (float(limit) if limit is not None else None), (
                float(used_percent) if used_percent is not None else None
            )

    units = result.get("units")
    if isinstance(units, dict):
        usage = units.get("usage")
        limit = units.get("limit")
        used_percent = units.get("used_percent")
        if usage is not None:
            return float(usage), (float(limit) if limit is not None else None), (
                float(used_percent) if used_percent is not None else None
            )

    return None, None, None


def _bytes_to_gb(value: int | float | None) -> float | None:
    if value is None:
        return None
    return float(value) / (1024**3)


def print_summary(result: dict) -> None:
    usage, limit, used_percent = _credit_usage(result)
    bandwidth = result.get("bandwidth") or {}
    storage = result.get("storage") or {}
    transformations = result.get("transformations") or {}

    print("\n=== Cloudinary usage ===")
    print(f"  plan:            {result.get('plan', '(unknown)')}")
    print(f"  last_updated:    {result.get('last_updated', '(unknown)')}")

    if usage is not None:
        limit_str = f" / {limit}" if limit is not None else ""
        pct_str = f" ({used_percent:.1f}%)" if used_percent is not None else ""
        print(f"  credits.usage:   {usage}{limit_str}{pct_str}")
    else:
        print("  credits.usage:   (not reported)")

    bw_gb = _bytes_to_gb(bandwidth.get("usage"))
    if bw_gb is not None:
        print(f"  bandwidth:       {bw_gb:.2f} GB")

    st_gb = _bytes_to_gb(storage.get("usage"))
    if st_gb is not None:
        print(f"  storage:         {st_gb:.2f} GB")

    if transformations.get("usage") is not None:
        print(f"  transformations: {transformations.get('usage')}")

    if result.get("impressions", {}).get("usage") is not None:
        print(f"  impressions:     {result['impressions']['usage']}")


def fetch_usage(date: str | None = None) -> dict:
    import cloudinary
    import cloudinary.api

    url = os.environ.get("CLOUDINARY_URL")
    if not url:
        raise SystemExit(
            "Missing CLOUDINARY_URL. Set it in .env.local or the environment."
        )

    cloudinary.config(cloudinary_url=url)
    if date:
        return cloudinary.api.usage(date=date)
    return cloudinary.api.usage()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Fetch Cloudinary account usage")
    parser.add_argument(
        "--date",
        help="Usage period (YYYY-MM-DD for a specific day, or omit for current billing period). "
        "NOTA: YYYY-MM (month only) causes API error 400.",
    )
    parser.add_argument(
        "--warn-at",
        type=float,
        metavar="CREDITS",
        help="Print warning when credits.usage >= this value (default: none)",
    )
    parser.add_argument(
        "--fail-at",
        type=float,
        metavar="CREDITS",
        help="Exit 1 when credits.usage >= this value (default: none)",
    )
    parser.add_argument(
        "--no-save",
        action="store_true",
        help="Do not write JSON to disk",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=ROOT / "cloudinary-usage.json",
        help="JSON output path (default: cloudinary-usage.json in repo root)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print full JSON payload to stdout after summary",
    )
    args = parser.parse_args(argv)

    try:
        result = fetch_usage(args.date)
    except SystemExit:
        raise
    except Exception as exc:
        print(f"Error fetching Cloudinary usage: {exc}", file=sys.stderr)
        return 1

    print_summary(result)

    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))

    if not args.no_save:
        args.output.write_text(
            json.dumps(result, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        print(f"\nSaved to {args.output.resolve()}")

    usage, limit, _ = _credit_usage(result)
    if usage is None:
        print("\nWarning: credits.usage not found in API response", file=sys.stderr)
        return 0

    if args.warn_at is not None and usage >= args.warn_at:
        limit_note = f" / {limit}" if limit is not None else ""
        print(
            f"\nWarning: credits.usage {usage}{limit_note} >= warn threshold {args.warn_at}",
            file=sys.stderr,
        )

    if args.fail_at is not None and usage >= args.fail_at:
        limit_note = f" / {limit}" if limit is not None else ""
        print(
            f"\nError: credits.usage {usage}{limit_note} >= fail threshold {args.fail_at}",
            file=sys.stderr,
        )
        return 1

    print("\nUsage check OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
