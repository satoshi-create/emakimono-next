#!/usr/bin/env python3
"""
postflight_sync.py — Validate JSON outputs after sync_all.py (no Cloudinary upload).

Usage:
  py -3.14 scripts/postflight_sync.py scrolls/tsukumogami/
  py -3.14 scripts/postflight_sync.py scrolls/tsukumogami/scroll_config.yaml --titleen tsukumogami
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import sync_scroll as ss
from scroll_checks.post_sync import check_post_sync
from scroll_checks.report import ValidationReport

REPO_ROOT = Path(__file__).resolve().parent.parent


def resolve_config_path(arg: str) -> Path:
    path = Path(arg)
    if not path.is_absolute():
        path = REPO_ROOT / path
    if path.is_dir():
        path = path / "scroll_config.yaml"
    return path.resolve()


def print_report(report: ValidationReport, *, titleen: str) -> None:
    print(f"\n=== Postflight sync: titleen={titleen} ===")
    if report.warnings:
        print("\nWarnings:")
        for msg in report.warnings:
            print(f"  ! {msg}")
    if report.errors:
        print("\nErrors:")
        for msg in report.errors:
            print(f"  x {msg}")
        print("\nPostflight sync FAILED")
    else:
        print("\nPostflight sync OK")


def run_postflight_sync(
    config_path: Path,
    *,
    require_text_json: bool = True,
) -> ValidationReport:
    report = ValidationReport()
    if not config_path.is_file():
        report.error(f"Config not found: {config_path}")
        return report
    config = ss.load_yaml(str(config_path))
    check_post_sync(config, report=report, require_text_json=require_text_json)
    return report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate sync outputs in src/data/")
    parser.add_argument("path", help="scrolls/{scroll_id}/ or scroll_config.yaml")
    parser.add_argument(
        "--allow-missing-text",
        action="store_true",
        help="Do not error when emaki-text-data JSON is missing",
    )
    args = parser.parse_args(argv)

    config_path = resolve_config_path(args.path)
    config = ss.load_yaml(str(config_path)) if config_path.is_file() else {}
    titleen = (config.get("metadata") or {}).get("titleen", config_path.parent.name)

    report = run_postflight_sync(
        config_path,
        require_text_json=not args.allow_missing_text,
    )
    print_report(report, titleen=titleen)
    return 0 if report.ok else 1


if __name__ == "__main__":
    sys.exit(main())
