#!/usr/bin/env python3
"""
create_analytics_issues.py — Create GitHub Issues from actions.json.

Usage:
  GITHUB_TOKEN=... GITHUB_REPOSITORY=owner/repo \\
    py -3.14 scripts/analytics/create_analytics_issues.py \\
      --report-dir analytics/reports/2026-07-24

  py -3.14 scripts/analytics/create_analytics_issues.py --report-dir ... --dry-run
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from _github import create_issue, list_open_analytics_issue_titles  # noqa: E402
from _paths import REPO_ROOT  # noqa: E402


def _issue_title(priority: str, slug: str, summary: str) -> str:
    short = summary[:60] + ("…" if len(summary) > 60 else "")
    return f"[Analytics {priority}] {slug}: {short}"


def _duplicate(title_prefix: str, open_titles: list[str]) -> bool:
    prefix = title_prefix.lower()
    return any(t.lower().startswith(prefix) for t in open_titles)


def create_from_report(report_dir: Path, *, dry_run: bool = False) -> dict:
    actions_path = report_dir / "actions.json"
    if not actions_path.is_file():
        raise FileNotFoundError(
            f"Missing {actions_path.relative_to(REPO_ROOT)} — run generate_actions.py first"
        )

    payload = json.loads(actions_path.read_text(encoding="utf-8-sig"))
    recommendations = payload.get("recommendations") or []
    report_date = payload.get("report_date") or report_dir.name

    open_titles = list_open_analytics_issue_titles() if not dry_run else []
    created: list[str] = []
    skipped: list[str] = []

    for item in recommendations:
        priority = item.get("priority") or "P3"
        slug = item.get("slug") or "unknown"
        summary = item.get("title") or "Analytics action"
        title = _issue_title(priority, slug, summary)
        prefix = f"[Analytics {priority}] {slug}:".lower()

        if _duplicate(prefix, open_titles):
            skipped.append(title)
            continue

        labels = ["analytics-weekly", f"analytics-{priority.lower()}"]
        body = item.get("body") or ""
        body += f"\n\n---\nReport date: `{report_date}`"

        if dry_run:
            print(f"DRY-RUN would create: {title}")
            print(f"  labels: {labels}")
            created.append(f"(dry-run) {title}")
            continue

        url = create_issue(title=title, body=body, labels=labels)
        created.append(url)
        open_titles.append(title)

    return {
        "report_date": report_date,
        "created": created,
        "skipped_duplicates": skipped,
        "dry_run": dry_run,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Create GitHub Issues from actions.json")
    parser.add_argument("--report-dir", type=Path, required=True)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)

    try:
        result = create_from_report(args.report_dir.resolve(), dry_run=args.dry_run)
    except Exception as exc:
        print(f"create_analytics_issues failed: {exc}", file=sys.stderr)
        return 1

    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
