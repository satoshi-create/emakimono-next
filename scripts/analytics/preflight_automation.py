#!/usr/bin/env python3
"""
preflight_automation.py — Verify GitHub + analytics readiness for weekly review.

Usage:
  py -3.14 scripts/analytics/preflight_automation.py
  py -3.14 scripts/analytics/preflight_automation.py --check-github-only
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from _github import ANALYTICS_LABELS, github_request  # noqa: E402


def check_github_labels() -> list[str]:
    missing: list[str] = []
    labels = github_request("GET", "/labels?per_page=100") or []
    existing = {item["name"] for item in labels}
    for spec in ANALYTICS_LABELS:
        if spec["name"] not in existing:
            missing.append(spec["name"])
    return missing


def check_env_for_fetch(skip_gsc: bool) -> list[str]:
    missing: list[str] = []
    for name in ("GOOGLE_APPLICATION_PROPERTY_ID", "GOOGLE_CREDENTIALS_BASE64"):
        if not os.environ.get(name, "").strip():
            missing.append(name)
    if not skip_gsc and not os.environ.get("GSC_SITE_URL", "").strip():
        missing.append("GSC_SITE_URL")
    return missing


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Preflight for analytics weekly review")
    parser.add_argument("--check-github-only", action="store_true")
    parser.add_argument("--skip-gsc", action="store_true")
    parser.add_argument("--report-dir", type=Path, help="Verify merged.json exists")
    args = parser.parse_args(argv)

    print("=== Analytics automation preflight ===\n")
    errors: list[str] = []

    if not os.environ.get("GITHUB_TOKEN", "").strip():
        errors.append("GITHUB_TOKEN not set (required for Issue creation in CI)")
    elif not os.environ.get("GITHUB_REPOSITORY", "").strip():
        errors.append("GITHUB_REPOSITORY not set (owner/repo)")
    else:
        try:
            missing_labels = check_github_labels()
            if missing_labels:
                print(f"  WARN   Missing labels (will be auto-created): {', '.join(missing_labels)}")
            else:
                print("  OK     GitHub analytics labels present")
        except Exception as exc:
            errors.append(f"GitHub labels check failed: {exc}")

    if not args.check_github_only:
        missing_env = check_env_for_fetch(args.skip_gsc)
        if missing_env:
            for name in missing_env:
                errors.append(f"Missing env: {name}")
        else:
            print("  OK     Fetch env vars present")

    if args.report_dir:
        merged = args.report_dir / "merged.json"
        if merged.is_file():
            print(f"  OK     Report: {merged}")
        else:
            errors.append(f"Missing {merged}")

    if errors:
        for err in errors:
            print(f"  ERROR  {err}", file=sys.stderr)
        print("\nPreflight failed.", file=sys.stderr)
        return 1

    print("\nPreflight OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
