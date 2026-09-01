#!/usr/bin/env python3
"""Unit tests for device/browser summary merge logic."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from merge_report import (  # noqa: E402
    _build_device_summary,
    _device_browser_key,
    _pivot_events_by_device_browser,
)

THRESHOLDS = {
    "geo_min_sessions": 20,
    "geo_low_engagement_rate": 0.2,
    "geo_short_session_seconds": 10,
    "geo_low_viewer_ratio": 0.1,
}


class MergeDeviceTests(unittest.TestCase):
    def test_device_browser_key(self) -> None:
        self.assertEqual(_device_browser_key("mobile", "Safari"), "mobile|Safari")

    def test_pivot_events_by_device_browser(self) -> None:
        rows = [
            {"deviceCategory": "mobile", "browser": "Safari", "eventName": "viewer_engagement", "eventCount": 10},
            {"deviceCategory": "desktop", "browser": "Chrome", "eventName": "image_load_fallback", "eventCount": 50},
        ]
        out = _pivot_events_by_device_browser(rows)
        self.assertEqual(out["mobile|Safari"]["viewer_engagement"], 10)
        self.assertEqual(out["desktop|Chrome"]["image_load_fallback"], 50)

    def test_build_device_summary(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            report_dir = Path(tmp)
            (report_dir / "ga4_device_browser.json").write_text(
                json.dumps(
                    [
                        {
                            "deviceCategory": "desktop",
                            "browser": "Chrome",
                            "sessions": 200,
                            "engagedSessions": 150,
                            "engagementRate": 0.75,
                            "averageSessionDuration": 120,
                            "bounceRate": 0.2,
                        },
                        {
                            "deviceCategory": "mobile",
                            "browser": "Safari",
                            "sessions": 80,
                            "engagedSessions": 5,
                            "engagementRate": 0.05,
                            "averageSessionDuration": 4,
                            "bounceRate": 0.9,
                        },
                    ]
                ),
                encoding="utf-8",
            )
            (report_dir / "ga4_device_os.json").write_text(
                json.dumps(
                    [
                        {
                            "deviceCategory": "mobile",
                            "operatingSystem": "iOS",
                            "sessions": 80,
                            "engagementRate": 0.05,
                            "averageSessionDuration": 4,
                        }
                    ]
                ),
                encoding="utf-8",
            )
            (report_dir / "ga4_events_by_device_browser.json").write_text(
                json.dumps(
                    [
                        {
                            "deviceCategory": "desktop",
                            "browser": "Chrome",
                            "eventName": "viewer_engagement",
                            "eventCount": 80,
                        },
                        {
                            "deviceCategory": "mobile",
                            "browser": "Safari",
                            "eventName": "image_load_fallback",
                            "eventCount": 60,
                        },
                    ]
                ),
                encoding="utf-8",
            )
            summary = _build_device_summary(report_dir, THRESHOLDS)
            self.assertEqual(summary["browsers"][0]["browser"], "Chrome")
            self.assertEqual(len(summary["low_quality_segments"]), 1)
            self.assertEqual(summary["low_quality_segments"][0]["browser"], "Safari")
            self.assertEqual(summary["operating_systems"][0]["operatingSystem"], "iOS")


if __name__ == "__main__":
    unittest.main()
