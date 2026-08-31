#!/usr/bin/env python3
"""Unit tests for geo summary merge logic."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from merge_report import _build_geo_summary, _geo_country_flags, _pivot_events_by_country  # noqa: E402


class MergeGeoTests(unittest.TestCase):
    def test_pivot_events_by_country(self) -> None:
        rows = [
            {"country": "Japan", "eventName": "viewer_engagement", "eventCount": 10},
            {"country": "Japan", "eventName": "scene_dwell", "eventCount": 50},
            {"country": "United States", "eventName": "viewer_engagement", "eventCount": 1},
        ]
        out = _pivot_events_by_country(rows)
        self.assertEqual(out["Japan"]["viewer_engagement"], 10)
        self.assertEqual(out["United States"]["viewer_engagement"], 1)

    def test_geo_country_flags(self) -> None:
        thresholds = {
            "geo_min_sessions": 20,
            "geo_low_engagement_rate": 0.2,
            "geo_short_session_seconds": 10,
            "geo_low_viewer_ratio": 0.1,
        }
        record = {
            "sessions": 100,
            "engagementRate": 0.05,
            "averageSessionDuration": 3,
        }
        flags = _geo_country_flags(record, viewer_events=2, thresholds=thresholds)
        self.assertIn("low_engagement_rate", flags)
        self.assertIn("short_session_duration", flags)
        self.assertIn("low_viewer_engagement_ratio", flags)

    def test_build_geo_summary(self) -> None:
        thresholds = {
            "geo_min_sessions": 20,
            "geo_low_engagement_rate": 0.2,
            "geo_short_session_seconds": 10,
            "geo_low_viewer_ratio": 0.1,
        }
        with tempfile.TemporaryDirectory() as tmp:
            report_dir = Path(tmp)
            (report_dir / "ga4_geo_country.json").write_text(
                json.dumps(
                    [
                        {
                            "country": "Japan",
                            "sessions": 200,
                            "engagedSessions": 150,
                            "engagementRate": 0.75,
                            "averageSessionDuration": 120,
                            "bounceRate": 0.2,
                            "totalUsers": 180,
                            "userEngagementDuration": 5000,
                        },
                        {
                            "country": "United States",
                            "sessions": 80,
                            "engagedSessions": 5,
                            "engagementRate": 0.05,
                            "averageSessionDuration": 4,
                            "bounceRate": 0.9,
                            "totalUsers": 75,
                            "userEngagementDuration": 200,
                        },
                    ]
                ),
                encoding="utf-8",
            )
            (report_dir / "ga4_events_by_country.json").write_text(
                json.dumps(
                    [
                        {"country": "Japan", "eventName": "viewer_engagement", "eventCount": 80},
                        {"country": "United States", "eventName": "viewer_engagement", "eventCount": 2},
                    ]
                ),
                encoding="utf-8",
            )
            (report_dir / "ga4_geo_japan_region.json").write_text(
                json.dumps(
                    [
                        {
                            "region": "Tokyo",
                            "sessions": 50,
                            "engagedSessions": 40,
                            "engagementRate": 0.8,
                            "averageSessionDuration": 90,
                            "bounceRate": 0.15,
                        }
                    ]
                ),
                encoding="utf-8",
            )
            summary = _build_geo_summary(report_dir, thresholds)
            self.assertEqual(summary["countries"][0]["country"], "Japan")
            self.assertEqual(len(summary["low_quality_countries"]), 1)
            self.assertEqual(summary["low_quality_countries"][0]["country"], "United States")
            self.assertEqual(summary["japan_regions"][0]["region"], "Tokyo")


if __name__ == "__main__":
    unittest.main()
