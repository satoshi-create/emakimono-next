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

    def test_list_image_files_skips_raw(self) -> None:
        from scroll_image_utils import list_image_files

        with tempfile.TemporaryDirectory() as tmp:
            images = Path(tmp)
            (images / "_01-1080.jpg").write_bytes(b"x")
            raw = images / "_raw"
            raw.mkdir()
            (raw / "slice.png").write_bytes(b"x")
            (raw / "contact_sheet.jpg").write_bytes(b"x")
            names = {p.name for p in list_image_files(images)}
            self.assertEqual(names, {"_01-1080.jpg"})


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


class TestMetadataConventions(unittest.TestCase):
    def test_scroll_id_rejects_underscore(self) -> None:
        from scroll_checks.metadata_conventions import check_scroll_id_kebab
        from scroll_checks.report import ValidationReport

        report = ValidationReport()
        check_scroll_id_kebab("hyakki_kokkai_a", report=report)
        self.assertTrue(any("kebab-case" in msg for msg in report.errors))

    def test_eraen_rejects_edo_titlecase(self) -> None:
        from scroll_checks.metadata_conventions import check_eraen
        from scroll_checks.report import ValidationReport

        report = ValidationReport()
        check_eraen("Edo", report=report)
        self.assertTrue(any("lowercase" in msg for msg in report.errors))

    def test_thumb_path_requires_prefix(self) -> None:
        from scroll_checks.metadata_conventions import check_thumb_path
        from scroll_checks.report import ValidationReport

        report = ValidationReport()
        check_thumb_path("/demo_scroll_thumb.webp", titleen="demo_scroll", report=report)
        self.assertTrue(any("/thumb/demo_scroll_thumb.webp" in msg for msg in report.errors))


class TestColorCorrectionGate(unittest.TestCase):
    def test_raw_without_contact_sheet_errors(self) -> None:
        from scroll_checks.color_correction import check_color_correction_gate
        from scroll_checks.report import ValidationReport

        with tempfile.TemporaryDirectory() as tmp:
            scroll_dir = Path(tmp)
            raw = scroll_dir / "images" / "_raw"
            raw.mkdir(parents=True)
            (raw / "slice_01.png").write_bytes(b"x")
            report = ValidationReport()
            check_color_correction_gate(scroll_dir, report=report)
            self.assertTrue(any("contact_sheet.jpg" in msg for msg in report.errors))

    def test_ack_downgrades_raw_error(self) -> None:
        from scroll_checks.color_correction import check_color_correction_gate
        from scroll_checks.report import ValidationReport

        with tempfile.TemporaryDirectory() as tmp:
            scroll_dir = Path(tmp)
            raw = scroll_dir / "images" / "_raw"
            raw.mkdir(parents=True)
            (raw / "slice_01.png").write_bytes(b"x")
            report = ValidationReport()
            check_color_correction_gate(
                scroll_dir, report=report, ack_no_color_correction=True
            )
            self.assertEqual(report.errors, [])
            self.assertTrue(any("acknowledged" in msg for msg in report.warnings))


class TestSceneMappingSync(unittest.TestCase):
    def test_scenes_summary_preferred_over_mapping_csv(self) -> None:
        from scroll_checks.scene_mapping import load_scene_rows, scene_rows_to_yaml_dicts

        with tempfile.TemporaryDirectory() as tmp:
            sources = Path(tmp) / "sources"
            sources.mkdir()
            (sources / "scenes-summary.csv").write_text(
                "scene_id,title_ja,title_en,range_start,range_end,image_count,slot_types,confidence,notes\n"
                "1,正本,Canonical,1,2,2,,draft,\n",
                encoding="utf-8-sig",
            )
            (sources / "scene-mapping.csv").write_text(
                "global_index,filename,slot_type,scene_id,scene_title_ja,scene_title_en,range_start,range_end,confidence,notes\n"
                "1,_01-1080.jpg,onset,1,旧,Legacy,1,1,draft,\n",
                encoding="utf-8-sig",
            )
            rows = load_scene_rows(sources)
            scenes = scene_rows_to_yaml_dicts(rows)
            self.assertEqual(scenes[0]["title"], "正本")
            self.assertEqual(scenes[0]["range"], [1, 2])
            self.assertNotIn("slots", scenes[0])

    def test_dual_csv_conflict_errors(self) -> None:
        from scroll_checks.scene_mapping import check_dual_csv_conflict
        from scroll_checks.report import ValidationReport

        with tempfile.TemporaryDirectory() as tmp:
            sources = Path(tmp) / "sources"
            sources.mkdir()
            (sources / "scenes-summary.csv").write_text("scene_id\n", encoding="utf-8-sig")
            (sources / "scene-mapping.csv").write_text("global_index\n", encoding="utf-8-sig")
            report = ValidationReport()
            check_dual_csv_conflict(sources, report)
            self.assertTrue(any("both scene-mapping.csv" in msg for msg in report.errors))

    def test_semantic_slot_types_not_written_to_yaml(self) -> None:
        from scroll_checks.scene_mapping import SceneRow, scene_rows_to_yaml_dicts

        rows = [
            SceneRow(
                scene_id=1,
                title_ja="場面",
                title_en="Scene",
                range_start=1,
                range_end=1,
                slot_types=["onset", "image"],
                confidence="draft",
            )
        ]
        scenes = scene_rows_to_yaml_dicts(rows)
        self.assertEqual(scenes[0]["slots"], ["image"])

    def test_write_csv_from_yaml_preserves_notes(self) -> None:
        from build_scene_mapping import write_csv_from_yaml
        from scroll_checks.scene_mapping import load_scenes_summary_csv, read_scenes_summary_notes

        with tempfile.TemporaryDirectory() as tmp:
            scroll_dir = Path(tmp) / "demo-scroll"
            sources = scroll_dir / "sources"
            sources.mkdir(parents=True)
            config_path = scroll_dir / "scroll_config.yaml"
            config_path.write_text(
                """
scroll_id: demo-scroll
volume_num: 1
metadata:
  titleen: demo_scroll
scenes:
  - id: 1
    title: 新タイトル
    titleen: New Title
    range: [1, 2]
""".strip(),
                encoding="utf-8",
            )
            (sources / "scenes-summary.csv").write_text(
                "scene_id,title_ja,title_en,range_start,range_end,image_count,slot_types,confidence,notes\n"
                "1,旧,Old,1,1,1,,draft,メモ残す\n",
                encoding="utf-8-sig",
            )
            write_csv_from_yaml(config_path, sources, dry_run=False)
            rows = load_scenes_summary_csv(sources / "scenes-summary.csv")
            notes = read_scenes_summary_notes(sources / "scenes-summary.csv")
            self.assertEqual(rows[0].title_ja, "新タイトル")
            self.assertEqual(rows[0].range_end, 2)
            self.assertEqual(notes[1], "メモ残す")


class TestMetadataDesc(unittest.TestCase):
    def test_rejects_research_terms_in_desc(self) -> None:
        from scroll_checks.metadata_desc import check_user_facing_desc
        from scroll_checks.report import ValidationReport

        report = ValidationReport()
        check_user_facing_desc(
            {"desc": "AC型のCモジュール脱落を示す。", "descen": "A scroll."},
            report=report,
        )
        self.assertTrue(any("metadata.desc" in msg for msg in report.errors))
        self.assertTrue(any("AC型" in msg for msg in report.errors))

    def test_rejects_research_terms_in_descen(self) -> None:
        from scroll_checks.metadata_desc import check_user_facing_desc
        from scroll_checks.report import ValidationReport

        report = ValidationReport()
        check_user_facing_desc(
            {"desc": "東大本の絵巻。", "descen": "AC-lineage C-module call number."},
            report=report,
        )
        self.assertTrue(any("metadata.descen" in msg for msg in report.errors))

    def test_accepts_user_facing_desc(self) -> None:
        from scroll_checks.metadata_desc import check_user_facing_desc
        from scroll_checks.report import ValidationReport

        report = ValidationReport()
        check_user_facing_desc(
            {
                "desc": "東京大学所蔵の百鬼夜行絵巻。平安末期の妖怪絵の代表作。",
                "descen": "Hyakki yagyō emaki held at the University of Tokyo.",
            },
            report=report,
        )
        self.assertEqual(report.errors, [])


class TestScrollAssets(unittest.TestCase):
    def test_thumb_webp_path(self) -> None:
        from scroll_assets import thumb_webp_path

        path = thumb_webp_path("hyakki_utokyo")
        self.assertEqual(path.name, "hyakki_utokyo_thumb.webp")
        self.assertEqual(path.parent.name, "thumb")

    def test_ensure_thumb_skips_existing(self) -> None:
        from scroll_assets import ensure_thumb_webp, thumb_webp_path

        with tempfile.TemporaryDirectory() as tmp:
            # Patch paths via existing public thumb if any
            existing = thumb_webp_path("hyakki_utokyo")
            if existing.is_file():
                self.assertTrue(ensure_thumb_webp("hyakki_utokyo", dry_run=False))


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
