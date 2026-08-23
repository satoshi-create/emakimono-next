#!/usr/bin/env python3
"""
postflight_thumb.py — Validate thumb files and JSON thumb paths.

Usage:
  py -3.14 scripts/postflight_thumb.py tsukumogami
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import sync_scroll as ss
from scroll_checks.report import ValidationReport
from scroll_checks.thumb import check_thumb_assets, run_ogp_check

REPO_ROOT = Path(__file__).resolve().parent.parent


def resolve_titleen(arg: str) -> str:
    path = Path(arg)
    if not path.is_absolute():
        path = REPO_ROOT / path
    if path.name == "scroll_config.yaml":
        config = ss.load_yaml(str(path))
        return (config.get("metadata") or {}).get("titleen", path.parent.name)
    if path.is_dir() and (path / "scroll_config.yaml").is_file():
        config = ss.load_yaml(str(path / "scroll_config.yaml"))
        return (config.get("metadata") or {}).get("titleen", path.name)
    return arg


def print_report(report: ValidationReport, *, titleen: str) -> None:
    print(f"\n=== Postflight thumb: titleen={titleen} ===")
    if report.warnings:
        print("\nWarnings:")
        for msg in report.warnings:
            print(f"  ! {msg}")
    if report.errors:
        print("\nErrors:")
        for msg in report.errors:
            print(f"  x {msg}")
        print("\nPostflight thumb FAILED")
    else:
        print("\nPostflight thumb OK")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate thumb assets")
    parser.add_argument("titleen", help="titleen or scrolls/{scroll_id}/ path")
    parser.add_argument("--skip-ogp", action="store_true", help="Skip OGP file warning")
    parser.add_argument(
        "--check-ogp-script",
        action="store_true",
        help="Run generateOgImages.js --check for this titleen",
    )
    args = parser.parse_args(argv)

    titleen = resolve_titleen(args.titleen)
    report = ValidationReport()
    check_thumb_assets(titleen, report=report, check_ogp=not args.skip_ogp)

    if args.check_ogp_script:
        code, output = run_ogp_check(titleen=titleen)
        print(output.rstrip())
        if code != 0:
            report.error("generateOgImages.js --check failed")

    print_report(report, titleen=titleen)
    return 0 if report.ok else 1


if __name__ == "__main__":
    sys.exit(main())
