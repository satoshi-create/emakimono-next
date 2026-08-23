#!/usr/bin/env python3
"""Run: py -3.14 scripts/tests/test_upstream_gates.py"""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent.parent
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from preflight_scroll import PreflightReport, run_preflight  # noqa: E402
from scroll_checks.source_similarity import _similarity  # noqa: E402
from scroll_checks.structure import check_range_coverage  # noqa: E402
from scroll_checks.text_layers import check_scene_text_layers  # noqa: E402
from scroll_image_utils import extract_index_from_path  # noqa: E402
import io

import yaml

from build_scene_mapping import build_scenes_yaml_block  # noqa: E402
import sync_scroll as ss  # noqa: E402


class TestImageUtils(unittest.TestCase):
    def test_extract_index(self) -> None:
        self.assertEqual(extract_index_from_path(Path("_01-1080.jpg")), 1)
        self.assertEqual(extract_index_from_path(Path("_31-975.jpg")), 31)
        self.assertIsNone(extract_index_from_path(Path("foo.jpg")))


class TestRangeCoverage(unittest.TestCase):
    def test_missing_index(self) -> None:
        report = PreflightReport()
        scenes = [{"id": 1, "range": [2, 3]}]
        check_range_coverage(scenes, max_index=3, report=report)
        self.assertTrue(any("index 1" in msg for msg in report.errors))

    def test_full_coverage(self) -> None:
        report = PreflightReport()
        scenes = [{"id": 1, "range": [1, 2]}, {"id": 2, "range": [3, 3]}]
        check_range_coverage(scenes, max_index=3, report=report)
        self.assertEqual(report.errors, [])


class TestTextLayers(unittest.TestCase):
    def test_long_gendaibun(self) -> None:
        report = PreflightReport()
        scenes = [
            {
                "id": 1,
                "range": [1, 1],
                "text": {"gendaibun": "あ" * 201, "desc": "", "descen": ""},
            }
        ]
        check_scene_text_layers(scenes, kotobagaki=False, report=report)
        self.assertTrue(any("gendaibun too long" in msg for msg in report.errors))

    def test_desc_without_descen(self) -> None:
        report = PreflightReport()
        scenes = [
            {
                "id": 1,
                "range": [1, 1],
                "text": {"gendaibun": "短い現代文。", "desc": "解説文。", "descen": ""},
            }
        ]
        check_scene_text_layers(scenes, kotobagaki=False, report=report)
        self.assertTrue(any("descen is empty" in msg for msg in report.errors))


class TestSimilarity(unittest.TestCase):
    def test_high_similarity(self) -> None:
        source = "康保の頃、煤払いで捨てられた古道具たちが集まり、長年の奉公への報いもなく路傍に捨てられた。"
        generated = "康保の頃、煤払いで捨てられた古道具たちが集まり、長年の奉公への報いもなく路傍に捨てられた。"
        self.assertGreaterEqual(_similarity(generated, source), 0.9)


class TestBuildSceneMappingYaml(unittest.TestCase):
    def test_text_block_nested_under_scene(self) -> None:
        block = build_scenes_yaml_block(
            [
                {
                    "id": 1,
                    "title": "場面",
                    "titleen": "Scene",
                    "range": [1, 2],
                    "slots": ["image", "image"],
                    "text": {
                        "gendaibun": "短い現代文。",
                        "kobun": "",
                        "desc": "解説?<br>line",
                        "descen": "Commentary with 'quotes'.",
                    },
                }
            ]
        )
        config = yaml.safe_load(
            io.StringIO(
                "scroll_id: demo\nvolume_num: 1\nmetadata:\n  titleen: demo\n" + block
            )
        )
        scenes = ss.get_scenes_config(config)
        self.assertEqual(len(scenes), 1)
        self.assertEqual(scenes[0]["text"]["gendaibun"], "短い現代文。")
        self.assertIn("?", scenes[0]["text"]["desc"])


    def test_minimal_scroll(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            scroll_dir = root / "demo-scroll"
            images_dir = scroll_dir / "images"
            images_dir.mkdir(parents=True)
            (images_dir / "_01-1080.jpg").write_bytes(b"\xff\xd8\xff" + b"\x00" * 100)
            (images_dir / "_02-1080.jpg").write_bytes(b"\xff\xd8\xff" + b"\x00" * 100)

            config_path = scroll_dir / "scroll_config.yaml"
            config_path.write_text(
                """
scroll_id: demo-scroll
volume_num: 1
theme_id: demo
folder: emakimono
metadata:
  id: 9999
  title: Demo
  titleen: demo_scroll
  author: ""
  authoren: ""
  era: ""
  eraen: ""
  type: ""
  typeen: ""
  desc: ""
  descen: ""
  thumb: ""
  thumb2: ""
  backgroundImage: ""
  video: ""
  sourceImageUrl: ""
  sourceImage: ""
  encodeUrl: ""
  favorite: false
  kotobagaki: false
  sceneText: false
  readMore: false
  keywords: []
scenes:
  - id: 1
    title: Scene
    titleen: Scene
    range: [1, 2]
    text:
      gendaibun: "短い現代文。"
      kobun: ""
      desc: "解説。"
      descen: "Commentary."
""".strip(),
                encoding="utf-8",
            )

            report = run_preflight(
                config_path,
                repo_root=root,
                skip_similarity=True,
                skip_height_warn=True,
            )
            self.assertTrue(report.ok, report.errors)


if __name__ == "__main__":
    unittest.main()
