#!/usr/bin/env python3
"""Unit tests for education geo cluster detection in merge_report.py."""

from __future__ import annotations

import unittest

from merge_report import _education_geo_clusters, _geo_sessions_list


class EducationGeoTests(unittest.TestCase):
    def test_region_cluster_at_threshold(self) -> None:
        regions = [
            {"region": "Tokyo", "country": "Japan", "sessions": 35},
            {"region": "Osaka", "country": "Japan", "sessions": 10},
        ]
        devices = [
            {"region": "Tokyo", "deviceCategory": "desktop", "sessions": 20},
            {"region": "Tokyo", "deviceCategory": "mobile", "sessions": 15},
        ]
        clusters, flags = _education_geo_clusters(
            regions, [], devices, {"min_region_cluster_sessions": 30, "min_city_cluster_sessions": 30}
        )
        self.assertEqual(flags, ["possible_education_geo_cluster"])
        self.assertEqual(len(clusters), 1)
        self.assertEqual(clusters[0]["name"], "Tokyo")
        self.assertEqual(clusters[0]["sessions"], 35)
        self.assertEqual(clusters[0]["device_breakdown"]["desktop"], 20)

    def test_city_cluster(self) -> None:
        cities = [
            {"city": "Kyoto", "region": "Kyoto", "country": "Japan", "sessions": 40},
        ]
        clusters, flags = _education_geo_clusters(
            [], cities, [], {"min_region_cluster_sessions": 30, "min_city_cluster_sessions": 30}
        )
        self.assertEqual(flags, ["possible_education_geo_cluster"])
        self.assertEqual(clusters[0]["level"], "city")
        self.assertEqual(clusters[0]["name"], "Kyoto")

    def test_below_threshold_empty(self) -> None:
        regions = [{"region": "Tokyo", "country": "Japan", "sessions": 29}]
        clusters, flags = _education_geo_clusters(
            regions, [], [], {"min_region_cluster_sessions": 30, "min_city_cluster_sessions": 30}
        )
        self.assertEqual(clusters, [])
        self.assertEqual(flags, [])

    def test_skips_not_set(self) -> None:
        rows = _geo_sessions_list(
            [{"region": "(not set)", "sessions": 100}, {"region": "Aichi", "sessions": 5}],
            level="region",
            name_keys=("region",),
        )
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["name"], "Aichi")


if __name__ == "__main__":
    unittest.main()
