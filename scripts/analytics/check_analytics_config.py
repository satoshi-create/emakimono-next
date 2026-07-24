#!/usr/bin/env python3
"""
check_analytics_config.py — Verify analytics env, config files, and API access.

Usage:
  py -3.14 scripts/analytics/check_analytics_config.py
  py -3.14 scripts/analytics/check_analytics_config.py --skip-api
  py -3.14 scripts/analytics/check_analytics_config.py --skip-gsc
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from _auth import get_credentials, load_credentials_json  # noqa: E402
from _errors import format_google_api_error  # noqa: E402
from _config import load_kpi_config, load_project_config  # noqa: E402
from _paths import DIMENSIONS_YAML, KPI_YAML, PROJECT_YAML, REPO_ROOT  # noqa: E402


def check_files() -> list[str]:
    errors: list[str] = []
    for path in (PROJECT_YAML, KPI_YAML, DIMENSIONS_YAML):
        if not path.is_file():
            errors.append(f"Missing config: {path.relative_to(REPO_ROOT)}")
    project = load_project_config(expand_env=False)
    emakis = REPO_ROOT / project["content"]["emakis_json"]
    if not emakis.is_file():
        errors.append(f"Missing content file: {emakis.relative_to(REPO_ROOT)}")
    return errors


def check_ga4_api(property_id: str) -> str | None:
    try:
        from google.analytics.data_v1beta import BetaAnalyticsDataClient
        from google.analytics.data_v1beta.types import DateRange, Dimension, Metric, RunReportRequest

        client = BetaAnalyticsDataClient(credentials=get_credentials())
        request = RunReportRequest(
            property=f"properties/{property_id}",
            date_ranges=[DateRange(start_date="7daysAgo", end_date="yesterday")],
            dimensions=[Dimension(name="date")],
            metrics=[Metric(name="sessions")],
            limit=1,
        )
        client.run_report(request)
        return None
    except Exception as exc:
        return format_google_api_error(exc, service="ga4")


def check_gsc_api(site_url: str) -> str | None:
    try:
        from googleapiclient.discovery import build

        from fetch_gsc import ga4_style_to_iso, normalize_gsc_site_url, resolve_gsc_site_url

        start_date, end_date = ga4_style_to_iso("7daysAgo", "yesterday")
        service = build("searchconsole", "v1", credentials=get_credentials(), cache_discovery=False)
        resolved = resolve_gsc_site_url(service, site_url)
        if resolved != normalize_gsc_site_url(site_url):
            print(f"  NOTE   GSC site resolved: {site_url!r} -> {resolved!r}")
        body = {
            "startDate": start_date,
            "endDate": end_date,
            "dimensions": ["date"],
            "rowLimit": 1,
        }
        service.searchanalytics().query(siteUrl=resolved, body=body).execute()
        return None
    except ValueError as exc:
        return str(exc)
    except Exception as exc:
        return format_google_api_error(exc, service="gsc")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Verify analytics pipeline configuration")
    parser.add_argument("--skip-api", action="store_true", help="Only check files and env vars")
    parser.add_argument("--skip-gsc", action="store_true", help="Skip GSC env requirement and API check")
    parser.add_argument("--skip-ga4", action="store_true", help="Skip GA4 API check")
    args = parser.parse_args(argv)

    print("=== Analytics config check ===\n")

    required_env = ["GOOGLE_APPLICATION_PROPERTY_ID"]
    if not args.skip_gsc:
        required_env.append("GSC_SITE_URL")

    missing = [
        name for name in required_env if not __import__("os").environ.get(name, "").strip()
    ]
    if missing:
        print(f"Missing environment variables: {', '.join(missing)}", file=sys.stderr)
        return 1

    try:
        load_credentials_json()
    except SystemExit:
        return 1

    file_errors = check_files()
    if file_errors:
        for err in file_errors:
            print(f"  ERROR  {err}")
        return 1

    project = load_project_config(expand_env=True)
    kpi = load_kpi_config()
    print(f"  OK     project: {project['site']['name']}")
    print(f"  OK     GA4 property: {project['ga4']['property_id']}")
    if args.skip_gsc:
        print("  SKIP   GSC site (--skip-gsc)")
    else:
        print(f"  OK     GSC site: {project['gsc']['site_url']}")
    print(f"  OK     phase: {kpi.get('phase', 'steady')}")
    print(f"  OK     GSC reports: {len(kpi.get('gsc_reports', []))}")
    print(f"  OK     GA4 reports: {len(kpi.get('ga4_reports', []))}")

    if args.skip_api:
        print("\nConfig check OK (--skip-api)")
        return 0

    ga4_err = None
    gsc_err = None

    if not args.skip_ga4:
        ga4_err = check_ga4_api(project["ga4"]["property_id"])
    if not args.skip_gsc:
        gsc_err = check_gsc_api(project["gsc"]["site_url"])

    if args.skip_ga4:
        print("  SKIP   GA4 API check (--skip-ga4)")
    elif ga4_err:
        print(f"  ERROR  {ga4_err}")
    else:
        print("  OK     GA4 API reachable")

    if args.skip_gsc:
        print("  SKIP   GSC API check (--skip-gsc)")
    elif gsc_err:
        print(f"  ERROR  {gsc_err}")
    else:
        print("  OK     GSC API reachable")

    if ga4_err or gsc_err:
        print("\nConfig files OK but API check failed.", file=sys.stderr)
        return 1

    print("\nAnalytics config check OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
