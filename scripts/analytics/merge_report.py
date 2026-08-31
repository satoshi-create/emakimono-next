#!/usr/bin/env python3
"""
merge_report.py — Merge GSC + GA4 reports with content-map.json.

Usage:
  py -3.14 scripts/analytics/merge_report.py --report-dir analytics/reports/2026-07-24
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path
from statistics import mean

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from _config import load_kpi_config, load_project_config  # noqa: E402
from _paths import REPORTS_DIR, REPO_ROOT  # noqa: E402
from _util import normalize_slug  # noqa: E402


def _row_slug(row: dict, url_field: str, strip_prefixes: list[str]) -> str:
    """Prefer re-normalizing from raw URL (fixes legacy reports with encoded slugs)."""
    raw = row.get(url_field) or ""
    if raw:
        return normalize_slug(raw, strip_prefixes=strip_prefixes)
    return normalize_slug(row.get("slug") or "", strip_prefixes=strip_prefixes)


def _aggregate_gsc_queries(rows: list[dict], strip_prefixes: list[str]) -> dict[str, dict]:
    by_slug: dict[str, dict] = defaultdict(
        lambda: {"clicks": 0, "impressions": 0, "queries": [], "top_query": "", "top_query_clicks": 0}
    )
    for row in rows:
        slug = _row_slug(row, "page", strip_prefixes)
        if not slug:
            continue
        entry = by_slug[slug]
        clicks = int(row.get("clicks") or 0)
        impressions = int(row.get("impressions") or 0)
        entry["clicks"] += clicks
        entry["impressions"] += impressions
        query = row.get("query") or ""
        if query:
            entry["queries"].append({"query": query, "clicks": clicks, "impressions": impressions})
            if clicks > entry["top_query_clicks"]:
                entry["top_query"] = query
                entry["top_query_clicks"] = clicks
    for entry in by_slug.values():
        if entry["impressions"] > 0:
            entry["ctr"] = round(entry["clicks"] / entry["impressions"], 4)
        else:
            entry["ctr"] = 0.0
        entry["queries"] = sorted(entry["queries"], key=lambda q: q["clicks"], reverse=True)[:5]
    return dict(by_slug)


def _load_json(path: Path) -> list | dict:
    if not path.is_file():
        return []
    return json.loads(path.read_text(encoding="utf-8-sig"))


def _index_gsc_pages(rows: list[dict], strip_prefixes: list[str]) -> dict[str, dict]:
    by_slug: dict[str, dict] = {}
    for row in rows:
        if not isinstance(row, dict):
            continue
        slug = _row_slug(row, "page", strip_prefixes)
        if not slug:
            continue
        existing = by_slug.get(slug)
        if existing:
            existing["clicks"] = int(existing.get("clicks") or 0) + int(row.get("clicks") or 0)
            existing["impressions"] = int(existing.get("impressions") or 0) + int(
                row.get("impressions") or 0
            )
            if existing["impressions"] > 0:
                existing["ctr"] = round(existing["clicks"] / existing["impressions"], 4)
            pos = float(row.get("position") or 0)
            if pos > 0:
                existing["position"] = pos
        else:
            by_slug[slug] = dict(row)
    return by_slug


def _index_ga4_pages(rows: list[dict], strip_prefixes: list[str]) -> dict[str, dict]:
    by_slug: dict[str, dict] = {}
    for row in rows:
        slug = _row_slug(row, "pagePath", strip_prefixes)
        if not slug:
            continue
        existing = by_slug.get(slug)
        if existing:
            for key in ("sessions", "screenPageViews"):
                existing[key] = int(existing.get(key) or 0) + int(row.get(key) or 0)
        else:
            by_slug[slug] = dict(row)
    return by_slug


def _index_ga4_emaki(rows: list[dict], metric_key: str = "eventCount") -> dict[str, int]:
    out: dict[str, int] = {}
    for row in rows:
        slug = row.get("slug") or row.get("emaki_id") or ""
        if not slug or slug == "(not set)":
            continue
        out[slug] = int(row.get(metric_key) or 0)
    return out


def _pivot_events_by_country(rows: list[dict]) -> dict[str, dict[str, int]]:
    out: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for row in rows:
        country = row.get("country") or ""
        event = row.get("eventName") or ""
        if not country or country == "(not set)" or not event:
            continue
        out[country][event] = int(row.get("eventCount") or 0)
    return {country: dict(events) for country, events in out.items()}


def _geo_country_flags(record: dict, *, viewer_events: int, thresholds: dict) -> list[str]:
    flags: list[str] = []
    sessions = int(record.get("sessions") or 0)
    min_sessions = int(thresholds.get("geo_min_sessions", 20))
    if sessions < min_sessions:
        return flags

    engagement_rate = float(record.get("engagementRate") or 0)
    avg_duration = float(record.get("averageSessionDuration") or 0)
    if engagement_rate < float(thresholds.get("geo_low_engagement_rate", 0.2)):
        flags.append("low_engagement_rate")
    if avg_duration < float(thresholds.get("geo_short_session_seconds", 10)):
        flags.append("short_session_duration")
    viewer_ratio = viewer_events / sessions if sessions else 0.0
    if viewer_ratio < float(thresholds.get("geo_low_viewer_ratio", 0.1)):
        flags.append("low_viewer_engagement_ratio")
    return flags


def _build_geo_summary(report_dir: Path, thresholds: dict) -> dict:
    geo_country = _load_json(report_dir / "ga4_geo_country.json")
    geo_japan_region = _load_json(report_dir / "ga4_geo_japan_region.json")
    geo_country_channel = _load_json(report_dir / "ga4_geo_country_channel.json")
    geo_country_device = _load_json(report_dir / "ga4_geo_country_device.json")
    events_by_country = _load_json(report_dir / "ga4_events_by_country.json")

    if not isinstance(geo_country, list):
        geo_country = []
    if not isinstance(geo_japan_region, list):
        geo_japan_region = []
    if not isinstance(geo_country_channel, list):
        geo_country_channel = []
    if not isinstance(geo_country_device, list):
        geo_country_device = []
    if not isinstance(events_by_country, list):
        events_by_country = []

    events_by_country_map = _pivot_events_by_country(events_by_country)

    countries: list[dict] = []
    for row in geo_country:
        if not isinstance(row, dict):
            continue
        country = row.get("country") or ""
        if not country or country == "(not set)":
            continue
        sessions = int(row.get("sessions") or 0)
        event_counts = events_by_country_map.get(country, {})
        viewer_events = int(event_counts.get("viewer_engagement", 0))
        record = {
            "country": country,
            "sessions": sessions,
            "engagedSessions": int(row.get("engagedSessions") or 0),
            "engagementRate": round(float(row.get("engagementRate") or 0), 4),
            "averageSessionDuration": round(float(row.get("averageSessionDuration") or 0), 2),
            "bounceRate": round(float(row.get("bounceRate") or 0), 4),
            "totalUsers": int(row.get("totalUsers") or 0),
            "userEngagementDuration": round(float(row.get("userEngagementDuration") or 0), 2),
            "viewer_engagement_events": viewer_events,
            "scene_dwell_events": int(event_counts.get("scene_dwell", 0)),
            "image_load_fallback_events": int(event_counts.get("image_load_fallback", 0)),
            "viewer_engagement_ratio": round(viewer_events / sessions, 4) if sessions else 0.0,
        }
        record["insight_flags"] = _geo_country_flags(
            record, viewer_events=viewer_events, thresholds=thresholds
        )
        countries.append(record)

    countries.sort(key=lambda r: r["sessions"], reverse=True)

    japan_regions = []
    for row in geo_japan_region:
        if not isinstance(row, dict):
            continue
        region = row.get("region") or ""
        if not region or region == "(not set)":
            continue
        japan_regions.append(
            {
                "region": region,
                "sessions": int(row.get("sessions") or 0),
                "engagedSessions": int(row.get("engagedSessions") or 0),
                "engagementRate": round(float(row.get("engagementRate") or 0), 4),
                "averageSessionDuration": round(float(row.get("averageSessionDuration") or 0), 2),
                "bounceRate": round(float(row.get("bounceRate") or 0), 4),
            }
        )
    japan_regions.sort(key=lambda r: r["sessions"], reverse=True)

    country_channels = []
    for row in geo_country_channel:
        if not isinstance(row, dict):
            continue
        country = row.get("country") or ""
        channel = row.get("sessionDefaultChannelGroup") or ""
        if not country or country == "(not set)":
            continue
        country_channels.append(
            {
                "country": country,
                "channel": channel,
                "sessions": int(row.get("sessions") or 0),
                "engagementRate": round(float(row.get("engagementRate") or 0), 4),
                "averageSessionDuration": round(float(row.get("averageSessionDuration") or 0), 2),
            }
        )
    country_channels.sort(key=lambda r: r["sessions"], reverse=True)

    country_devices = []
    for row in geo_country_device:
        if not isinstance(row, dict):
            continue
        country = row.get("country") or ""
        device = row.get("deviceCategory") or ""
        if not country or country == "(not set)":
            continue
        country_devices.append(
            {
                "country": country,
                "deviceCategory": device,
                "sessions": int(row.get("sessions") or 0),
                "engagementRate": round(float(row.get("engagementRate") or 0), 4),
                "averageSessionDuration": round(float(row.get("averageSessionDuration") or 0), 2),
            }
        )
    country_devices.sort(key=lambda r: r["sessions"], reverse=True)

    low_quality = [
        {
            "country": row["country"],
            "sessions": row["sessions"],
            "engagementRate": row["engagementRate"],
            "averageSessionDuration": row["averageSessionDuration"],
            "viewer_engagement_ratio": row["viewer_engagement_ratio"],
            "insight_flags": row["insight_flags"],
        }
        for row in countries
        if row.get("insight_flags")
    ]

    return {
        "countries": countries,
        "japan_regions": japan_regions,
        "country_channels": country_channels,
        "country_devices": country_devices,
        "low_quality_countries": low_quality,
    }


def _index_fallback_reason(rows: list[dict], dim_key: str = "customEvent:fallback_reason") -> dict[str, int]:
    """カスタムディメンション内訳（fallback_reason / choice / platform 等）を集計。"""
    short = dim_key.split(":")[-1] if ":" in dim_key else dim_key
    out: dict[str, int] = {}
    for row in rows:
        reason = row.get(dim_key) or row.get(short) or row.get("fallback_reason") or ""
        if not reason or reason == "(not set)":
            continue
        out[reason] = out.get(reason, 0) + int(row.get("eventCount") or 0)
    return dict(sorted(out.items(), key=lambda kv: kv[1], reverse=True))


def _find_previous_report_dir(current_dir: Path) -> Path | None:
    siblings = sorted(
        [p for p in REPORTS_DIR.iterdir() if p.is_dir() and p.name != current_dir.name],
        key=lambda p: p.name,
        reverse=True,
    )
    for sibling in siblings:
        if (sibling / "merged.json").is_file():
            return sibling
    return None


def _insight_flags(
    record: dict,
    *,
    site_avg_ctr: float,
    thresholds: dict,
) -> list[str]:
    flags: list[str] = []
    impressions = int(record.get("gsc_impressions") or 0)
    clicks = int(record.get("gsc_clicks") or 0)
    ctr = record.get("gsc_ctr") or 0.0
    sessions = int(record.get("ga4_sessions") or 0)
    viewer_events = int(record.get("viewer_engagement_events") or 0)
    fallback_events = int(record.get("image_load_fallback_events") or 0)

    if impressions >= 100 and site_avg_ctr > 0 and ctr < site_avg_ctr * thresholds.get("low_ctr_vs_site_ratio", 0.7):
        flags.append("high_impressions_low_ctr")

    if sessions >= 50 and viewer_events > 0:
        ratio = viewer_events / sessions
        if ratio < 0.3:
            flags.append("high_traffic_low_engagement")

    if fallback_events >= thresholds.get("high_fallback_events", 50):
        flags.append("high_image_fallback")

    if clicks == 0 and impressions >= 50:
        flags.append("impressions_no_clicks")

    return flags


def merge_report(report_dir: Path) -> dict:
    project = load_project_config(expand_env=False)
    kpi = load_kpi_config()
    strip_prefixes = project.get("locale", {}).get("strip_prefixes", ["/ja", "/en"])
    thresholds = kpi.get("merge", {}).get("insight_thresholds", {})
    content_map_path = REPO_ROOT / project["content"]["content_map"]
    content_map = _load_json(content_map_path)
    by_slug_meta = content_map.get("by_slug") if isinstance(content_map, dict) else {}

    gsc_pages = _load_json(report_dir / "gsc_pages.json")
    gsc_queries = _load_json(report_dir / "gsc_queries.json")
    ga4_pages = _load_json(report_dir / "ga4_pages.json")
    viewer_by_emaki = _load_json(report_dir / "ga4_viewer_by_emaki.json")
    fallback_by_emaki = _load_json(report_dir / "ga4_fallback_by_emaki.json")
    fallback_by_reason = _load_json(report_dir / "ga4_fallback_by_reason.json")
    scene_like_by_emaki = _load_json(report_dir / "ga4_scene_like_by_emaki.json")
    like_emaki_by_emaki = _load_json(report_dir / "ga4_like_emaki_by_emaki.json")
    scroll_feedback_by_emaki = _load_json(report_dir / "ga4_scroll_feedback_by_emaki.json")
    scroll_feedback_by_choice = _load_json(report_dir / "ga4_scroll_feedback_by_choice.json")
    sns_share_by_emaki = _load_json(report_dir / "ga4_sns_share_by_emaki.json")
    sns_share_by_platform = _load_json(report_dir / "ga4_sns_share_by_platform.json")

    gsc_page_by_slug = _index_gsc_pages(
        gsc_pages if isinstance(gsc_pages, list) else [], strip_prefixes
    )
    gsc_query_by_slug = _aggregate_gsc_queries(
        gsc_queries if isinstance(gsc_queries, list) else [], strip_prefixes
    )
    ga4_page_by_slug = _index_ga4_pages(
        ga4_pages if isinstance(ga4_pages, list) else [], strip_prefixes
    )
    viewer_by_slug = _index_ga4_emaki(viewer_by_emaki if isinstance(viewer_by_emaki, list) else [])
    fallback_by_slug = _index_ga4_emaki(fallback_by_emaki if isinstance(fallback_by_emaki, list) else [])
    fallback_reason_counts = _index_fallback_reason(
        fallback_by_reason if isinstance(fallback_by_reason, list) else []
    )
    scene_like_by_slug = _index_ga4_emaki(
        scene_like_by_emaki if isinstance(scene_like_by_emaki, list) else []
    )
    like_emaki_by_slug = _index_ga4_emaki(
        like_emaki_by_emaki if isinstance(like_emaki_by_emaki, list) else []
    )
    scroll_feedback_by_slug = _index_ga4_emaki(
        scroll_feedback_by_emaki if isinstance(scroll_feedback_by_emaki, list) else []
    )
    scroll_feedback_by_choice_counts = _index_fallback_reason(
        scroll_feedback_by_choice if isinstance(scroll_feedback_by_choice, list) else [],
        dim_key="customEvent:choice",
    )
    sns_share_by_slug = _index_ga4_emaki(
        sns_share_by_emaki if isinstance(sns_share_by_emaki, list) else []
    )
    sns_share_platform_counts = _index_fallback_reason(
        sns_share_by_platform if isinstance(sns_share_by_platform, list) else [],
        dim_key="customEvent:platform",
    )

    all_slugs = sorted(
        set(gsc_page_by_slug)
        | set(gsc_query_by_slug)
        | set(ga4_page_by_slug)
        | set(viewer_by_slug)
        | set(scene_like_by_slug)
        | set(like_emaki_by_slug)
        | set(scroll_feedback_by_slug)
        | set(sns_share_by_slug)
        | set(by_slug_meta or {})
    )

    ctr_values = [
        float(row.get("ctr") or 0)
        for row in gsc_page_by_slug.values()
        if int(row.get("impressions") or 0) > 0
    ]
    site_avg_ctr = mean(ctr_values) if ctr_values else 0.0

    merged: list[dict] = []
    for slug in all_slugs:
        meta = (by_slug_meta or {}).get(slug, {})
        gsc_page = gsc_page_by_slug.get(slug, {})
        gsc_q = gsc_query_by_slug.get(slug, {})
        ga4_page = ga4_page_by_slug.get(slug, {})

        record = {
            "slug": slug,
            "titleen": slug,
            "title": meta.get("title"),
            "era": meta.get("era"),
            "gsc_clicks": int(gsc_page.get("clicks") or gsc_q.get("clicks") or 0),
            "gsc_impressions": int(gsc_page.get("impressions") or gsc_q.get("impressions") or 0),
            "gsc_ctr": round(float(gsc_page.get("ctr") or gsc_q.get("ctr") or 0), 4),
            "gsc_position": round(float(gsc_page.get("position") or 0), 2),
            "top_query": gsc_q.get("top_query") or "",
            "top_queries": gsc_q.get("queries") or [],
            "ga4_sessions": int(ga4_page.get("sessions") or 0),
            "ga4_pageviews": int(ga4_page.get("screenPageViews") or 0),
            "ga4_engagement_rate": ga4_page.get("engagementRate"),
            "viewer_engagement_events": viewer_by_slug.get(slug, 0),
            "image_load_fallback_events": fallback_by_slug.get(slug, 0),
            "scene_like_events": scene_like_by_slug.get(slug, 0),
            "like_emaki_events": like_emaki_by_slug.get(slug, 0),
            "scroll_feedback_events": scroll_feedback_by_slug.get(slug, 0),
            "sns_share_events": sns_share_by_slug.get(slug, 0),
        }
        record["insight_flags"] = _insight_flags(record, site_avg_ctr=site_avg_ctr, thresholds=thresholds)
        merged.append(record)

    merged.sort(key=lambda r: (r["gsc_impressions"], r["ga4_sessions"]), reverse=True)

    previous_dir = _find_previous_report_dir(report_dir)
    if previous_dir:
        prev_rows = _load_json(previous_dir / "merged.json")
        prev_index = {r["slug"]: r for r in prev_rows if isinstance(r, dict) and r.get("slug")}
        for record in merged:
            prev = prev_index.get(record["slug"])
            if not prev:
                continue
            record["delta"] = {
                "gsc_clicks": record["gsc_clicks"] - int(prev.get("gsc_clicks") or 0),
                "gsc_impressions": record["gsc_impressions"] - int(prev.get("gsc_impressions") or 0),
                "ga4_sessions": record["ga4_sessions"] - int(prev.get("ga4_sessions") or 0),
            }

    payload = {
        "report_dir": report_dir.name,
        "site_avg_ctr": round(site_avg_ctr, 4),
        "row_count": len(merged),
        "previous_report": previous_dir.name if previous_dir else None,
        "fallback_reason_breakdown": fallback_reason_counts,
        "like_emaki_breakdown": like_emaki_by_slug,
        "scene_like_breakdown": scene_like_by_slug,
        "scroll_feedback_breakdown": scroll_feedback_by_slug,
        "scroll_feedback_choice_breakdown": scroll_feedback_by_choice_counts,
        "sns_share_breakdown": sns_share_by_slug,
        "sns_share_platform_breakdown": sns_share_platform_counts,
        "geo": _build_geo_summary(report_dir, thresholds),
        "rows": merged,
    }
    return payload


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Merge GSC and GA4 report JSON files")
    parser.add_argument("--report-dir", type=Path, required=True)
    args = parser.parse_args(argv)

    try:
        payload = merge_report(args.report_dir)
    except Exception as exc:
        print(f"Merge failed: {exc}", file=sys.stderr)
        return 1

    out_path = args.report_dir / "merged.json"
    out_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {out_path} ({payload['row_count']} rows)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
