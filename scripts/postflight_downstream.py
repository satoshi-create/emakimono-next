#!/usr/bin/env python3
"""
postflight_downstream.py — Run downstream gates after sync (JSON, thumb, OGP, build).

Usage:
  py -3.14 scripts/postflight_downstream.py scrolls/tsukumogami/
  py -3.14 scripts/postflight_downstream.py scrolls/tsukumogami/ --skip-build
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

import sync_scroll as ss
from postflight_sync import run_postflight_sync
from scroll_checks.report import ValidationReport
from scroll_checks.thumb import check_thumb_assets, run_ogp_check

REPO_ROOT = Path(__file__).resolve().parent.parent
PYTHON = sys.executable


def resolve_config_path(arg: str) -> Path:
    path = Path(arg)
    if not path.is_absolute():
        path = REPO_ROOT / path
    if path.is_dir():
        path = path / "scroll_config.yaml"
    return path.resolve()


def run_step(label: str, cmd: list[str]) -> int:
    print(f"\n========== {label} ==========")
    print(" ", " ".join(cmd))
    return subprocess.run(cmd, cwd=REPO_ROOT).returncode


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Downstream validation after scroll sync")
    parser.add_argument("path", help="scrolls/{scroll_id}/ or scroll_config.yaml")
    parser.add_argument("--skip-build", action="store_true", help="Skip npm run build")
    parser.add_argument("--skip-thumb", action="store_true", help="Skip thumb checks")
    parser.add_argument("--skip-ogp", action="store_true", help="Skip OGP check")
    parser.add_argument(
        "--allow-missing-text",
        action="store_true",
        help="Allow missing emaki-text-data JSON in postflight_sync",
    )
    args = parser.parse_args(argv)

    config_path = resolve_config_path(args.path)
    if not config_path.is_file():
        print(f"Config not found: {config_path}")
        return 1

    config = ss.load_yaml(str(config_path))
    titleen = (config.get("metadata") or {}).get("titleen", config_path.parent.name)
    print(f"\n=== Postflight downstream: {titleen} ===")

    report = run_postflight_sync(
        config_path,
        require_text_json=not args.allow_missing_text,
    )
    if not report.ok:
        print("\nPostflight sync FAILED")
        for msg in report.errors:
            print(f"  x {msg}")
        return 1
    if report.warnings:
        print("\nPostflight sync warnings:")
        for msg in report.warnings:
            print(f"  ! {msg}")
    print("\nPostflight sync OK")

    if not args.skip_thumb:
        thumb_report = ValidationReport()
        check_thumb_assets(titleen, report=thumb_report, check_ogp=not args.skip_ogp)
        if not thumb_report.ok:
            print("\nPostflight thumb FAILED")
            for msg in thumb_report.errors:
                print(f"  x {msg}")
            return 1
        if thumb_report.warnings:
            for msg in thumb_report.warnings:
                print(f"  ! {msg}")
        print("Postflight thumb OK")

    if not args.skip_ogp:
        code, output = run_ogp_check(titleen=titleen)
        print(output.rstrip())
        if code != 0:
            print("\nPostflight downstream FAILED at: OGP check")
            return code

    if not args.skip_build:
        build_code = run_step("npm run build", ["npm", "run", "build"])
        if build_code != 0:
            print("\nPostflight downstream FAILED at: build")
            return build_code

    print("\nPostflight downstream OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
