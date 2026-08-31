#!/usr/bin/env python3
"""
fetch_all.py — Run the full GSC + GA4 analytics pipeline.

Usage:
  py -3.14 scripts/analytics/fetch_all.py
  py -3.14 scripts/analytics/fetch_all.py --dry-run
  py -3.14 scripts/analytics/fetch_all.py --date 2026-07-24
  py -3.14 scripts/analytics/fetch_all.py --skip-gsc
  py -3.14 scripts/analytics/fetch_all.py --skip-merge

See docs/operations/analytics-pipeline.md
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import date, datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from _config import load_kpi_config, load_project_config  # noqa: E402
from _paths import REPORTS_DIR, REPO_ROOT  # noqa: E402
from fetch_ga4 import run_fetch as run_ga4_fetch  # noqa: E402
from fetch_gsc import ga4_style_to_iso, run_fetch as run_gsc_fetch  # noqa: E402
from merge_report import merge_report  # noqa: E402
from _errors import format_google_api_error  # noqa: E402


def _run_build_content_map() -> int:
    proc = subprocess.run(
        [sys.executable, str(SCRIPT_DIR / "build_content_map.py"), "--if-stale"],
        cwd=str(REPO_ROOT),
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if proc.stdout:
        print(proc.stdout.strip())
    if proc.returncode != 0:
        print(proc.stderr or proc.stdout, file=sys.stderr)
    return proc.returncode


def _load_json_list(path: Path) -> list:
    if not path.is_file():
        return []
    data = json.loads(path.read_text(encoding="utf-8-sig"))
    return data if isinstance(data, list) else []


def _total_sessions(report_dir: Path) -> int:
    rows = _load_json_list(report_dir / "ga4_pages.json")
    return sum(int(r.get("sessions") or 0) for r in rows)


def _total_gsc_rows(report_dir: Path) -> int:
    return len(_load_json_list(report_dir / "gsc_queries.json"))


def _find_previous_report_dir(current_dir: Path) -> Path | None:
    siblings = sorted(
        [p for p in REPORTS_DIR.iterdir() if p.is_dir() and p.name != current_dir.name],
        key=lambda p: p.name,
        reverse=True,
    )
    for sibling in siblings:
        if (sibling / "merged.json").is_file() or (sibling / "manifest.json").is_file():
            return sibling
    return None


def write_summary(report_dir: Path, manifest: dict) -> Path:
    kpi = load_kpi_config()
    project = load_project_config()
    phase = kpi.get("phase", "steady")
    bootstrap = kpi.get("bootstrap", {})

    current = kpi["date_ranges"]["current"]
    start_date, end_date = ga4_style_to_iso(current["start"], current["end"])

    gsc_rows = _total_gsc_rows(report_dir)
    ga4_sessions = _total_sessions(report_dir)
    previous_dir = _find_previous_report_dir(report_dir)

    merged_path = report_dir / "merged.json"
    top_findings: list[str] = []
    fallback_reason_lines: list[str] = []
    like_lines: list[str] = []
    feedback_lines: list[str] = []
    share_lines: list[str] = []
    geo_lines: list[str] = []
    if merged_path.is_file():
        merged = json.loads(merged_path.read_text(encoding="utf-8"))
        flagged = [r for r in merged.get("rows", []) if r.get("insight_flags")]
        flagged.sort(key=lambda r: r.get("gsc_impressions", 0), reverse=True)
        for row in flagged[:3]:
            flags = ", ".join(row.get("insight_flags") or [])
            title = row.get("title") or row.get("slug")
            top_findings.append(
                f"- **{title}** (`/{row.get('slug')}`): {flags} "
                f"(GSC imp {row.get('gsc_impressions')}, sessions {row.get('ga4_sessions')})"
            )
        breakdown = merged.get("fallback_reason_breakdown") or {}
        if breakdown:
            total = sum(breakdown.values())
            if total > 0:
                fallback_reason_lines.append("| reason | events | % |")
                fallback_reason_lines.append("|---|---|---|")
                for reason, count in breakdown.items():
                    pct = round(count / total * 100, 1)
                    fallback_reason_lines.append(f"| `{reason}` | {count} | {pct}% |")

        # Like 系（絵巻別）: scene_like / like_emaki のサマリ
        scene_like_breakdown = merged.get("scene_like_breakdown") or {}
        like_emaki_breakdown = merged.get("like_emaki_breakdown") or {}
        scene_total = sum(scene_like_breakdown.values())
        like_total = sum(like_emaki_breakdown.values())
        if scene_total > 0 or like_total > 0:
            like_lines.append(f"- **scene_like** 計 **{scene_total}** 回 / **like_emaki** 計 **{like_total}** 回")
            top_scene = sorted(scene_like_breakdown.items(), key=lambda kv: kv[1], reverse=True)[:5]
            if top_scene:
                like_lines.append("\n| 絵巻 | scene_like |")
                like_lines.append("|---|---|")
                for slug, count in top_scene:
                    like_lines.append(f"| `{slug}` | {count} |")
            top_like = sorted(like_emaki_breakdown.items(), key=lambda kv: kv[1], reverse=True)[:5]
            if top_like:
                like_lines.append("\n| 絵巻 | like_emaki |")
                like_lines.append("|---|---|")
                for slug, count in top_like:
                    like_lines.append(f"| `{slug}` | {count} |")

        # Scroll feedback（choice 別・絵巻別）: scroll_feedback のサマリ
        feedback_choice = merged.get("scroll_feedback_choice_breakdown") or {}
        feedback_by_emaki = merged.get("scroll_feedback_breakdown") or {}
        feedback_total = sum(feedback_choice.values()) or sum(feedback_by_emaki.values())
        if feedback_total > 0:
            feedback_lines.append(f"- **scroll_feedback** 計 **{feedback_total}** 回")
            if feedback_choice:
                feedback_lines.append("\n| choice | events |")
                feedback_lines.append("|---|---|")
                for choice, count in feedback_choice.items():
                    feedback_lines.append(f"| `{choice}` | {count} |")
            top_feedback = sorted(feedback_by_emaki.items(), key=lambda kv: kv[1], reverse=True)[:5]
            if top_feedback:
                feedback_lines.append("\n| 絵巻 | scroll_feedback |")
                feedback_lines.append("|---|---|")
                for slug, count in top_feedback:
                    feedback_lines.append(f"| `{slug}` | {count} |")

        # SNS share（platform 別・絵巻別）
        share_by_emaki = merged.get("sns_share_breakdown") or {}
        share_by_platform = merged.get("sns_share_platform_breakdown") or {}
        share_total = sum(share_by_emaki.values()) or sum(share_by_platform.values())
        if share_total > 0:
            share_lines.append(f"- **sns_share_click** 計 **{share_total}** 回")
            if share_by_platform:
                share_lines.append("\n| platform | events |")
                share_lines.append("|---|---|")
                for platform, count in share_by_platform.items():
                    share_lines.append(f"| `{platform}` | {count} |")
            top_share = sorted(share_by_emaki.items(), key=lambda kv: kv[1], reverse=True)[:5]
            if top_share:
                share_lines.append("\n| 絵巻 | sns_share_click |")
                share_lines.append("|---|---|")
                for slug, count in top_share:
                    share_lines.append(f"| `{slug}` | {count} |")

        geo = merged.get("geo") or {}
        countries = geo.get("countries") or []
        if countries:
            geo_lines.append("| country | sessions | eng% | avg dur(s) | viewer% | flags |")
            geo_lines.append("|---|---:|---:|---:|---:|---|")
            for row in countries[:10]:
                flags = ", ".join(row.get("insight_flags") or []) or "—"
                eng_pct = round(float(row.get("engagementRate") or 0) * 100, 1)
                viewer_pct = round(float(row.get("viewer_engagement_ratio") or 0) * 100, 1)
                geo_lines.append(
                    f"| {row.get('country')} | {row.get('sessions')} | {eng_pct}% "
                    f"| {row.get('averageSessionDuration')} | {viewer_pct}% | {flags} |"
                )
            low_quality = geo.get("low_quality_countries") or []
            if low_quality:
                geo_lines.append("")
                geo_lines.append(
                    f"- **low-quality traffic flags**: {len(low_quality)} countries "
                    f"(sessions ≥ {kpi.get('merge', {}).get('insight_thresholds', {}).get('geo_min_sessions', 20)})"
                )
        japan_regions = geo.get("japan_regions") or []
        if japan_regions:
            geo_lines.append("")
            geo_lines.append("### Japan regions (top 5)")
            geo_lines.append("| region | sessions | eng% | avg dur(s) |")
            geo_lines.append("|---|---:|---:|---:|")
            for row in japan_regions[:5]:
                eng_pct = round(float(row.get("engagementRate") or 0) * 100, 1)
                geo_lines.append(
                    f"| {row.get('region')} | {row.get('sessions')} | {eng_pct}% "
                    f"| {row.get('averageSessionDuration')} |"
                )
    below_gsc = gsc_rows < int(bootstrap.get("min_gsc_rows", 10))
    below_ga4 = ga4_sessions < int(bootstrap.get("min_ga4_sessions", 50))
    review_mode = "bootstrap" if phase == "bootstrap" or below_gsc or below_ga4 else "steady"

    lines = [
        f"# Analytics Summary — {report_dir.name}",
        "",
        f"- Site: {project['site']['url']}",
        f"- Phase (config): {phase}",
        f"- Review mode: {review_mode}",
        f"- Period: {start_date} .. {end_date}",
        f"- Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        "",
        "## Totals",
        f"- GSC query rows: {gsc_rows}",
        f"- GA4 sessions (pages report sum): {ga4_sessions}",
        "",
    ]

    if previous_dir:
        lines.extend(
            [
                "## Previous report",
                f"- `{previous_dir.relative_to(REPO_ROOT).as_posix()}/`",
                "",
            ]
        )

    if top_findings:
        lines.extend(["## Top findings (auto)", *top_findings, ""])
    else:
        lines.extend(["## Top findings (auto)", "- No insight flags in merged.json", ""])

    if fallback_reason_lines:
        lines.extend(
            [
                "## Fallback reasons (image_load_fallback)",
                "",
                "※ `fallback_reason` が GA4 に未登録の場合は空です。",
                *fallback_reason_lines,
                "",
            ]
        )

    if like_lines:
        lines.extend(["## Like / engagement (scene_like · like_emaki)", "", *like_lines, ""])

    if share_lines:
        lines.extend(["## SNS share (sns_share_click)", "", *share_lines, ""])

    if feedback_lines:
        lines.extend(["## Scroll feedback (user choice)", "", *feedback_lines, ""])

    if geo_lines:
        lines.extend(["## Geo / traffic quality (GA4)", "", *geo_lines, ""])

    lines.extend(
        [
            "## Files (read order for Cursor Agent)",
            "1. `summary.md` — this file",
            "2. `merged.json` — per-emaki GSC × GA4 join",
            "3. `gsc_queries.json` — query detail",
            "4. `ga4_events_summary.json` — event counts",
            "5. `ga4_fallback_by_reason.json` — fallback reason breakdown",
            "6. `ga4_geo_country.json` / `ga4_geo_japan_region.json` — geo traffic quality",
            "",
            "## Next step",
            "Run the weekly review prompt from `docs/operations/cursor-analytics-prompt.md`.",
            "",
        ]
    )

    if review_mode == "bootstrap":
        lines.extend(
            [
                "## Bootstrap note",
                f"- GSC rows {gsc_rows} (threshold {bootstrap.get('min_gsc_rows', 10)})",
                f"- GA4 sessions {ga4_sessions} (threshold {bootstrap.get('min_ga4_sessions', 50)})",
                "- Focus on measurement health and baseline snapshots until thresholds are met.",
                "",
            ]
        )

    summary_path = report_dir / "summary.md"
    summary_path.write_text("\n".join(lines), encoding="utf-8")
    return summary_path


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Fetch GSC + GA4 analytics reports")
    parser.add_argument("--date", help="Report folder name (YYYY-MM-DD). Default: today")
    parser.add_argument("--dry-run", action="store_true", help="Print plan without API calls")
    parser.add_argument("--skip-config-check", action="store_true")
    parser.add_argument("--skip-gsc", action="store_true")
    parser.add_argument("--skip-ga4", action="store_true")
    parser.add_argument("--skip-merge", action="store_true")
    parser.add_argument("--skip-content-map", action="store_true")
    args = parser.parse_args(argv)

    report_name = args.date or date.today().isoformat()
    report_dir = REPORTS_DIR / report_name

    print(f"=== Analytics fetch - {report_name} ===\n")
    print(f"Output: {report_dir.relative_to(REPO_ROOT)}")

    if not args.skip_config_check and not args.dry_run:
        check_cmd = [sys.executable, str(SCRIPT_DIR / "check_analytics_config.py")]
        if args.skip_gsc:
            check_cmd.append("--skip-gsc")
        if args.skip_ga4:
            check_cmd.append("--skip-ga4")
        proc = subprocess.run(check_cmd, cwd=str(REPO_ROOT))
        if proc.returncode != 0:
            return proc.returncode

    if not args.skip_content_map and not args.dry_run:
        code = _run_build_content_map()
        if code != 0:
            return code

    manifest: dict = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "report_dir": report_name,
        "dry_run": args.dry_run,
        "sources": {},
    }

    try:
        if not args.skip_gsc:
            gsc_manifest = run_gsc_fetch(report_dir, dry_run=args.dry_run)
            manifest["sources"]["gsc"] = gsc_manifest

        if not args.skip_ga4:
            ga4_manifest = run_ga4_fetch(report_dir, dry_run=args.dry_run)
            manifest["sources"]["ga4"] = ga4_manifest

        if not args.skip_merge and not args.dry_run:
            merge_payload = merge_report(report_dir)
            merged_path = report_dir / "merged.json"
            merged_path.write_text(json.dumps(merge_payload, indent=2, ensure_ascii=False), encoding="utf-8")
            manifest["merge"] = {"rows": merge_payload["row_count"], "path": "merged.json"}

    except Exception as exc:
        print(f"Pipeline failed:\n{format_google_api_error(exc, service='gsc')}", file=sys.stderr)
        return 1

    if not args.dry_run:
        summary_path = write_summary(report_dir, manifest)
        manifest["summary"] = summary_path.name
        manifest_path = report_dir / "manifest.json"
        manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"\nWrote {manifest_path.relative_to(REPO_ROOT)}")
        print(f"Wrote {summary_path.relative_to(REPO_ROOT)}")
    else:
        print(json.dumps(manifest, indent=2, ensure_ascii=False))

    print("\nAnalytics fetch OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
