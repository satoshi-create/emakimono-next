#!/usr/bin/env python3
"""Run: py -3.14 scripts/tests/test_downstream_gates.py"""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent.parent
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from scroll_checks.post_sync import check_post_sync, expected_thumb_path  # noqa: E402
from scroll_checks.report import ValidationReport  # noqa: E402
from scroll_checks.thumb import resolve_thumb_file  # noqa: E402


class TestPostSync(unittest.TestCase):
    def test_expected_thumb_path(self) -> None:
        self.assertEqual(expected_thumb_path("tsukumogami"), "/thumb/tsukumogami_thumb.webp")

    def test_missing_descen(self) -> None:
        report = ValidationReport()
        config = {
            "scroll_id": "demo",
            "metadata": {"titleen": "demo_scroll", "sceneText": True},
        }
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            cache_path = root / "cache.json"
            text_dir = root / "text"
            text_dir.mkdir()
            cache_path.write_text(
                json.dumps(
                    [
                        {
                            "titleen": "demo_scroll",
                            "thumb": "/thumb/demo_scroll_thumb.webp",
                            "emakis": [
                                {
                                    "name": "demo__demo_1_01__01",
                                    "src": "emakimono/demo__demo_1_01__01.jpg",
                                    "cat": "image",
                                }
                            ],
                        }
                    ]
                ),
                encoding="utf-8",
            )
            (text_dir / "demo_scroll.json").write_text(
                json.dumps(
                    [
                        {
                            "chapter": "1",
                            "title": "Scene",
                            "desc": "解説",
                            "descen": "",
                            "gendaibun": "現代文",
                        }
                    ]
                ),
                encoding="utf-8",
            )

            import scroll_checks.post_sync as ps

            original_cache = ps.CACHE_PATH
            original_text = ps.EMAKI_TEXT_DIR
            ps.CACHE_PATH = cache_path
            ps.EMAKI_TEXT_DIR = text_dir
            try:
                config["scenes"] = [{"id": 1, "title": "Scene", "range": [1, 1]}]
                check_post_sync(config, report=report, require_text_json=True)
            finally:
                ps.CACHE_PATH = original_cache
                ps.EMAKI_TEXT_DIR = original_text

        self.assertTrue(any("descen empty" in msg for msg in report.errors))


class TestThumb(unittest.TestCase):
    def test_resolve_thumb_file(self) -> None:
        path = resolve_thumb_file("/thumb/tsukumogami_thumb.webp")
        if path is not None:
            self.assertTrue(path.name.endswith("_thumb.webp"))


if __name__ == "__main__":
    unittest.main()
