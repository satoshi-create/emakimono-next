#!/usr/bin/env python3
"""
run_weekly_review.py — CI entry point mirroring Cursor Automation Run once.

Steps: ensure labels → generate actions → create Issues (optional).

Usage:
  py -3.14 scripts/analytics/run_weekly_review.py --report-dir analytics/reports/2026-07-24
  py -3.14 scripts/analytics/run_weekly_review.py --report-dir ... --dry-run
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from _github import ensure_analytics_labels  # noqa: E402
from create_analytics_issues import create_from_report  # noqa: E402
from generate_actions import generate  # noqa: E402


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run weekly analytics review (CI / smoke test)")
    parser.add_argument("--report-dir", type=Path, required=True)
    parser.add_argument("--dry-run", action="store_true", help="Generate actions only; do not create Issues")
    parser.add_argument("--skip-labels", action="store_true")
    args = parser.parse_args(argv)

    report_dir = args.report_dir.resolve()
    print(f"=== Weekly review — {report_dir.name} ===\n")

    if not args.skip_labels:
        created = ensure_analytics_labels()
        if created:
            print(f"  Created labels: {', '.join(created)}")
        else:
            print("  OK     Analytics labels already exist")

    gen = generate(report_dir)
    print(f"  OK     {gen['actions_md']} ({gen['recommendation_count']} recommendations)")

    issue_result = create_from_report(report_dir, dry_run=args.dry_run)
    print(json.dumps(issue_result, indent=2, ensure_ascii=False))

    print("\nWeekly review OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
