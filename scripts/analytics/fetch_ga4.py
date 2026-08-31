#!/usr/bin/env python3
"""
fetch_ga4.py — Fetch GA4 Data API reports defined in analytics/kpi.yaml.

Usage:
  py -3.14 scripts/analytics/fetch_ga4.py --output-dir analytics/reports/2026-07-24
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from _auth import get_credentials  # noqa: E402
from _config import load_kpi_config, load_project_config  # noqa: E402
from _util import normalize_slug  # noqa: E402

_INT_METRICS = frozenset(
    {"sessions", "screenPageViews", "eventCount", "engagedSessions", "totalUsers", "newUsers"}
)
_FLOAT_METRICS = frozenset(
    {
        "engagementRate",
        "averageSessionDuration",
        "bounceRate",
        "userEngagementDuration",
    }
)


def _parse_metric_value(name: str, raw: str):
    if name in _INT_METRICS:
        try:
            return int(float(raw))
        except ValueError:
            return raw
    if name in _FLOAT_METRICS:
        try:
            return float(raw)
        except ValueError:
            return raw
    return raw


def _build_dimension_filter(spec: dict | None):
    if not spec:
        return None

    from google.analytics.data_v1beta.types import Filter, FilterExpression

    field = spec["field"]
    op = spec.get("op", "exact")

    if op == "in_list":
        values = spec.get("values") or []
        return FilterExpression(
            filter=Filter(
                field_name=field,
                in_list_filter=Filter.InListFilter(values=values),
            )
        )

    if op == "exact":
        value = spec.get("value", "")
        return FilterExpression(
            filter=Filter(
                field_name=field,
                string_filter=Filter.StringFilter(value=value),
            )
        )

    raise ValueError(f"Unsupported dimension_filter op: {op}")


def _resolve_dimensions(spec: dict, project: dict) -> list[str]:
    """Apply project.yaml custom_event_dimensions overrides."""
    mapping = (project.get("ga4") or {}).get("custom_event_dimensions") or {}
    param_key = spec.get("requires_custom_dimension")
    if param_key and param_key in mapping:
        return [mapping[param_key]]
    return list(spec.get("dimensions", []))


def run_ga4_report(
    client,
    property_id: str,
    spec: dict,
    date_range: dict,
    *,
    project: dict | None = None,
) -> list[dict]:
    from google.analytics.data_v1beta.types import (
        DateRange,
        Dimension,
        Metric,
        OrderBy,
        RunReportRequest,
    )

    dim_name_list = _resolve_dimensions(spec, project or {})
    dimensions = [Dimension(name=d) for d in dim_name_list]
    metrics = [Metric(name=m) for m in spec.get("metrics", [])]
    dimension_filter = _build_dimension_filter(spec.get("dimension_filter"))

    request = RunReportRequest(
        property=f"properties/{property_id}",
        date_ranges=[
            DateRange(start_date=date_range["start"], end_date=date_range["end"]),
        ],
        dimensions=dimensions,
        metrics=metrics,
        dimension_filter=dimension_filter,
        limit=int(spec.get("limit", 1000)),
        order_bys=[
            OrderBy(
                metric=OrderBy.MetricOrderBy(metric_name=spec["metrics"][0]),
                desc=True,
            )
        ]
        if spec.get("metrics")
        else [],
    )

    response = client.run_report(request)
    dim_names = dim_name_list
    metric_names = list(spec.get("metrics", []))

    rows: list[dict] = []
    for row in response.rows:
        item: dict = {}
        for idx, name in enumerate(dim_names):
            item[name] = row.dimension_values[idx].value
        for idx, name in enumerate(metric_names):
            raw = row.metric_values[idx].value
            item[name] = _parse_metric_value(name, raw)
        rows.append(item)
    return rows


def enrich_ga4_rows(
    rows: list[dict],
    dim_names: list[str],
    strip_prefixes: list[str],
) -> None:
    if "pagePath" in dim_names:
        for row in rows:
            row["slug"] = normalize_slug(row.get("pagePath", ""), strip_prefixes=strip_prefixes)

    emaki_dim = next((d for d in dim_names if "emaki" in d.lower()), None)
    if emaki_dim:
        for row in rows:
            emaki_id = row.get(emaki_dim) or row.get("emaki_id")
            if emaki_id and emaki_id != "(not set)":
                row["emaki_id"] = emaki_id
                row["slug"] = emaki_id


def run_fetch(output_dir: Path, *, dry_run: bool = False) -> dict:
    project = load_project_config(expand_env=not dry_run)
    kpi = load_kpi_config()
    property_id = project["ga4"]["property_id"]
    strip_prefixes = project.get("locale", {}).get("strip_prefixes", ["/ja"])
    date_range = kpi["date_ranges"]["current"]

    manifest: dict = {
        "source": "ga4",
        "property_id": property_id,
        "date_range": date_range,
        "reports": {},
    }

    if dry_run:
        for spec in kpi.get("ga4_reports", []):
            manifest["reports"][spec["id"]] = {"dry_run": True, "dimensions": spec.get("dimensions", [])}
        return manifest

    from google.analytics.data_v1beta import BetaAnalyticsDataClient

    client = BetaAnalyticsDataClient(credentials=get_credentials())
    output_dir.mkdir(parents=True, exist_ok=True)

    for spec in kpi.get("ga4_reports", []):
        report_id = spec["id"]
        dim_names = _resolve_dimensions(spec, project)
        try:
            rows = run_ga4_report(client, property_id, spec, date_range, project=project)
        except Exception as exc:
            err = str(exc)
            entry: dict = {"error": err, "rows": 0}
            if spec.get("optional") and "not a valid dimension" in err:
                entry["skipped"] = True
                entry["hint"] = (
                    "Register emaki_id as a GA4 custom dimension (Event scope), "
                    "then update analytics/project.yaml custom_event_dimensions."
                )
                print(f"Skipped optional GA4 report '{report_id}': {entry['hint']}", file=sys.stderr)
            else:
                print(f"Warning: GA4 report '{report_id}' failed: {exc}", file=sys.stderr)
            manifest["reports"][report_id] = entry
            continue

        enrich_ga4_rows(rows, dim_names, strip_prefixes)
        out_path = output_dir / f"ga4_{report_id}.json"
        out_path.write_text(json.dumps(rows, indent=2, ensure_ascii=False), encoding="utf-8")
        manifest["reports"][report_id] = {"path": out_path.name, "rows": len(rows)}

    return manifest


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Fetch GA4 Data API reports")
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)

    try:
        manifest = run_fetch(args.output_dir, dry_run=args.dry_run)
    except Exception as exc:
        print(f"GA4 fetch failed: {exc}", file=sys.stderr)
        return 1

    print(json.dumps(manifest, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
