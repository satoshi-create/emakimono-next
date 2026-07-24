#!/usr/bin/env python3
"""
fetch_gsc.py — Fetch Google Search Console Search Analytics reports.

Usage:
  py -3.14 scripts/analytics/fetch_gsc.py --output-dir analytics/reports/2026-07-24
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date, timedelta
from pathlib import Path
from urllib.parse import urlparse

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from _auth import get_credentials  # noqa: E402
from _config import load_kpi_config, load_project_config  # noqa: E402
from _errors import format_google_api_error  # noqa: E402
from _util import normalize_slug  # noqa: E402


def normalize_gsc_site_url(raw: str) -> str:
    """Strip whitespace/quotes from GSC_SITE_URL (common GitHub Secret paste issues)."""
    return raw.strip().strip('"').strip("'")


def list_gsc_site_urls(service) -> list[str]:
    response = service.sites().list().execute()
    return [entry["siteUrl"] for entry in response.get("siteEntry", [])]


def resolve_gsc_site_url(service, configured: str) -> str:
    """Match configured URL to a Search Console property the service account can access."""
    configured = normalize_gsc_site_url(configured)
    if not configured:
        raise ValueError("GSC_SITE_URL is empty after normalization")

    sites = list_gsc_site_urls(service)
    if configured in sites:
        return configured

    candidates: list[str] = []
    seen: set[str] = set()

    def add(value: str) -> None:
        if value and value not in seen:
            seen.add(value)
            candidates.append(value)

    add(configured.rstrip("/"))
    add(configured + "/")
    if configured.startswith("http://") or configured.startswith("https://"):
        parsed = urlparse(configured)
        host = parsed.netloc or configured.split("://", 1)[-1].split("/", 1)[0]
        add(f"sc-domain:{host}")
        add(f"https://{host}/")
        add(f"https://{host}")
    elif configured.startswith("sc-domain:"):
        host = configured.removeprefix("sc-domain:")
        add(f"https://{host}/")
        add(f"https://{host}")

    for candidate in candidates:
        if candidate in sites:
            return candidate

    available = ", ".join(sites) if sites else "(none — add service account in GSC)"
    raise ValueError(
        f"GSC_SITE_URL {configured!r} does not match any Search Console property.\n"
        f"  Available: {available}\n"
        f"  Domain properties use sc-domain:example.com (no trailing slash)."
    )


def ga4_style_to_iso(start: str, end: str) -> tuple[str, str]:
    """Convert GA4-style relative dates to ISO YYYY-MM-DD for GSC API."""
    today = date.today()

    def resolve(token: str) -> date:
        if token == "today":
            return today
        if token == "yesterday":
            return today - timedelta(days=1)
        if token.endswith("daysAgo"):
            days = int(token.replace("daysAgo", ""))
            return today - timedelta(days=days)
        return date.fromisoformat(token)

    return resolve(start).isoformat(), resolve(end).isoformat()


def fetch_gsc_report(
    service,
    site_url: str,
    *,
    start_date: str,
    end_date: str,
    dimensions: list[str],
    row_limit: int,
) -> list[dict]:
    rows_out: list[dict] = []
    start_row = 0
    page_size = min(row_limit, 25000)

    while start_row < row_limit:
        batch_limit = min(page_size, row_limit - start_row)
        body = {
            "startDate": start_date,
            "endDate": end_date,
            "dimensions": dimensions,
            "rowLimit": batch_limit,
            "startRow": start_row,
        }
        response = service.searchanalytics().query(siteUrl=site_url, body=body).execute()
        batch = response.get("rows") or []
        if not batch:
            break

        for row in batch:
            keys = row.get("keys") or []
            item = {
                "clicks": row.get("clicks", 0),
                "impressions": row.get("impressions", 0),
                "ctr": row.get("ctr", 0),
                "position": row.get("position", 0),
            }
            for idx, dim in enumerate(dimensions):
                item[dim] = keys[idx] if idx < len(keys) else ""
            rows_out.append(item)

        if len(batch) < batch_limit:
            break
        start_row += len(batch)

    return rows_out


def enrich_rows(rows: list[dict], dimensions: list[str], strip_prefixes: list[str]) -> None:
    if "page" in dimensions:
        for row in rows:
            row["slug"] = normalize_slug(row.get("page", ""), strip_prefixes=strip_prefixes)


def run_fetch(output_dir: Path, *, dry_run: bool = False) -> dict:
    kpi = load_kpi_config()
    project = load_project_config(expand_env=not dry_run)
    strip_prefixes = project.get("locale", {}).get("strip_prefixes", ["/ja"])
    configured_site_url = project["gsc"]["site_url"]

    current = kpi["date_ranges"]["current"]
    start_date, end_date = ga4_style_to_iso(current["start"], current["end"])

    manifest: dict = {
        "source": "gsc",
        "site_url": configured_site_url,
        "start_date": start_date,
        "end_date": end_date,
        "reports": {},
    }

    if dry_run:
        for spec in kpi.get("gsc_reports", []):
            manifest["reports"][spec["id"]] = {"dry_run": True, "dimensions": spec["dimensions"]}
        return manifest

    from googleapiclient.discovery import build

    service = build("searchconsole", "v1", credentials=get_credentials(), cache_discovery=False)
    site_url = resolve_gsc_site_url(service, configured_site_url)
    if site_url != normalize_gsc_site_url(configured_site_url):
        print(f"GSC site resolved: {configured_site_url!r} -> {site_url!r}", file=sys.stderr)
    manifest["site_url"] = site_url
    output_dir.mkdir(parents=True, exist_ok=True)

    for spec in kpi.get("gsc_reports", []):
        report_id = spec["id"]
        dimensions = spec["dimensions"]
        row_limit = int(spec.get("row_limit", 1000))
        rows = fetch_gsc_report(
            service,
            site_url,
            start_date=start_date,
            end_date=end_date,
            dimensions=dimensions,
            row_limit=row_limit,
        )
        enrich_rows(rows, dimensions, strip_prefixes)
        out_path = output_dir / f"gsc_{report_id}.json"
        out_path.write_text(json.dumps(rows, indent=2, ensure_ascii=False), encoding="utf-8")
        manifest["reports"][report_id] = {"path": out_path.name, "rows": len(rows)}

    return manifest


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Fetch GSC Search Analytics data")
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)

    try:
        manifest = run_fetch(args.output_dir, dry_run=args.dry_run)
    except Exception as exc:
        print(f"GSC fetch failed:\n{format_google_api_error(exc, service='gsc')}", file=sys.stderr)
        return 1

    print(json.dumps(manifest, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
