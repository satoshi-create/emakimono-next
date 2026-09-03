#!/usr/bin/env python3
"""
build_scene_mapping.py — Sync scenes between sources/scenes-summary.csv and scroll_config.yaml.

Usage:
  py -3.14 scripts/build_scene_mapping.py scrolls/my-scroll/ --check
  py -3.14 scripts/build_scene_mapping.py scrolls/my-scroll/ --write-yaml
  py -3.14 scripts/build_scene_mapping.py scrolls/my-scroll/ --write-csv
  py -3.14 scripts/build_scene_mapping.py scrolls/my-scroll/ --write-docs
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from pathlib import Path

import sync_scroll as ss
from scroll_checks.scene_mapping import (
    check_dual_csv_conflict,
    dual_csv_paths,
    load_scene_rows,
    load_scenes_summary_csv,
    read_scenes_summary_notes,
    scene_rows_to_yaml_dicts,
    scenes_equal,
    yaml_scenes_to_scene_rows,
)
from scroll_checks.report import ValidationReport

REPO_ROOT = Path(__file__).resolve().parent.parent
EMAKI_TEXT_DIR = REPO_ROOT / "src/data/emaki-text-data"


def resolve_scroll_dir(arg: str) -> tuple[Path, Path]:
    path = Path(arg)
    if not path.is_absolute():
        path = REPO_ROOT / path
    if path.name == "scroll_config.yaml":
        scroll_dir = path.parent
    else:
        scroll_dir = path
    config_path = scroll_dir / "scroll_config.yaml"
    sources_dir = scroll_dir / "sources"
    return scroll_dir.resolve(), config_path.resolve()


def _yaml_escape(text: str) -> str:
    return str(text).replace("'", "''")


def _format_text_fields(text: dict) -> list[str]:
    lines = ["    text:"]
    for key in ("gendaibun", "gendaibunen", "kobun", "kobunen", "desc", "descen"):
        value = text.get(key, "")
        if value:
            lines.append(f"      {key}: '{_yaml_escape(value)}'")
        else:
            lines.append(f'      {key}: ""')
    return lines


def enrich_scenes_from_text_json(scenes: list[dict], titleen: str) -> list[dict]:
    path = EMAKI_TEXT_DIR / f"{titleen}.json"
    if not path.is_file():
        return scenes
    with path.open("r", encoding="utf-8") as handle:
        rows = json.load(handle)
    by_chapter = {str(row.get("chapter")): row for row in rows}
    for scene in scenes:
        row = by_chapter.get(str(scene["id"]))
        if not row:
            continue
        scene["text"] = {
            "gendaibun": row.get("gendaibun", "") or "",
            "kobun": row.get("kobun", "") or "",
            "desc": row.get("desc", "") or "",
            "descen": row.get("descen", "") or "",
        }
    return scenes


def build_scenes_yaml_block(scenes: list[dict]) -> str:
    lines = ["scenes:"]
    for scene in scenes:
        lines.append(f"  - id: {scene['id']}")
        title = str(scene.get("title", "")).replace('"', '\\"')
        titleen = str(scene.get("titleen", "")).replace('"', '\\"')
        lines.append(f'    title: "{title}"')
        if titleen:
            lines.append(f'    titleen: "{titleen}"')
        start, end = scene["range"]
        lines.append(f"    range: [{start}, {end}]")
        slots = scene.get("slots") or []
        if slots:
            lines.append("    slots:")
            for slot in slots:
                lines.append(f"      - {slot}")
        text = scene.get("text") or {}
        if text:
            lines.extend(_format_text_fields(text))
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def patch_scroll_config(config_path: Path, scenes: list[dict], *, dry_run: bool) -> None:
    text = config_path.read_text(encoding="utf-8")
    scenes_yaml = build_scenes_yaml_block(scenes)
    if re.search(r"^scenes:\s*$", text, flags=re.MULTILINE):
        new_text = re.sub(
            r"^scenes:\s*\n.*\Z",
            scenes_yaml,
            text,
            flags=re.DOTALL | re.MULTILINE,
        )
    else:
        new_text = text.rstrip() + "\n\n" + scenes_yaml

    if dry_run:
        print(f"  [dry-run] Would update scenes in {config_path} ({len(scenes)} scene(s))")
        return
    config_path.write_text(new_text, encoding="utf-8")
    print(f"  Updated scenes in {config_path} ({len(scenes)} scene(s))")


def write_scene_mapping_md(sources_dir: Path, rows) -> None:
    path = sources_dir / "scene-mapping.md"
    lines = [
        "# Scene mapping (generated)",
        "",
        "| scene_id | range | title (ja) | titleen | confidence |",
        "|---------|-------|------------|---------|------------|",
    ]
    for row in rows:
        lines.append(
            f"| {row.scene_id} | {row.range_start}–{row.range_end} | "
            f"{row.title_ja} | {row.title_en} | {row.confidence} |"
        )
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"  Wrote {path}")


def write_scenes_summary_csv(
    sources_dir: Path,
    rows,
    *,
    notes_by_id: dict[int, str] | None = None,
) -> None:
    path = sources_dir / "scenes-summary.csv"
    notes_map = notes_by_id or {}
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(
            [
                "scene_id",
                "title_ja",
                "title_en",
                "range_start",
                "range_end",
                "image_count",
                "slot_types",
                "confidence",
                "notes",
            ]
        )
        for row in rows:
            layout_slots = [
                slot
                for slot in (row.slot_types or [])
                if slot in ("image", "ekotoba")
            ]
            slot_types = "|".join(layout_slots)
            writer.writerow(
                [
                    row.scene_id,
                    row.title_ja,
                    row.title_en,
                    row.range_start,
                    row.range_end,
                    row.range_end - row.range_start + 1,
                    slot_types,
                    row.confidence,
                    notes_map.get(row.scene_id, ""),
                ]
            )
    print(f"  Wrote {path}")


def write_csv_from_yaml(
    config_path: Path,
    sources_dir: Path,
    *,
    dry_run: bool,
) -> None:
    yaml_scenes = ss.get_scenes_config(ss.load_yaml(str(config_path)))
    summary_path = sources_dir / "scenes-summary.csv"
    existing = load_scenes_summary_csv(summary_path) if summary_path.is_file() else []
    notes = read_scenes_summary_notes(summary_path)
    rows = yaml_scenes_to_scene_rows(yaml_scenes, existing)

    if dry_run:
        print(
            f"  [dry-run] Would write {len(rows)} scene(s) to {summary_path}"
        )
        return

    sources_dir.mkdir(parents=True, exist_ok=True)
    write_scenes_summary_csv(sources_dir, rows, notes_by_id=notes)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Build or verify scene mapping from CSV")
    parser.add_argument("scroll_dir", help="scrolls/{scroll_id}/ directory")
    parser.add_argument("--check", action="store_true", help="Compare CSV vs scroll_config.yaml")
    parser.add_argument("--write-yaml", action="store_true", help="Write CSV scenes into scroll_config.yaml")
    parser.add_argument(
        "--write-csv",
        action="store_true",
        help="Write scroll_config.yaml scenes into sources/scenes-summary.csv",
    )
    parser.add_argument("--write-docs", action="store_true", help="Regenerate scene-mapping.md / scenes-summary.csv")
    parser.add_argument("--dry-run", action="store_true", help="With --write-yaml / --write-csv, print only")
    parser.add_argument(
        "--merge-text-json",
        action="store_true",
        help="Merge scenes[].text from src/data/emaki-text-data/{titleen}.json",
    )
    args = parser.parse_args(argv)

    scroll_dir, config_path = resolve_scroll_dir(args.scroll_dir)
    sources_dir = scroll_dir / "sources"

    if not config_path.is_file():
        print(f"Config not found: {config_path}")
        return 1

    if dual_csv_paths(sources_dir):
        report = ValidationReport()
        check_dual_csv_conflict(sources_dir, report)
        for message in report.errors:
            print(f"ERROR: {message}")
        return 1

    config = ss.load_yaml(str(config_path))
    titleen = (config.get("metadata") or {}).get("titleen", scroll_dir.name)

    print(f"\n=== Scene mapping: {scroll_dir.name} ===")

    if args.write_csv:
        write_csv_from_yaml(config_path, sources_dir, dry_run=args.dry_run)

    rows = load_scene_rows(sources_dir)
    if not rows and not args.write_csv:
        print(f"No scenes-summary.csv or scene-mapping.csv in {sources_dir}")
        return 1

    if rows:
        print(f"  Loaded {len(rows)} scene(s) from sources/")

    csv_scenes = scene_rows_to_yaml_dicts(rows) if rows else []
    if args.merge_text_json or args.write_yaml:
        csv_scenes = enrich_scenes_from_text_json(csv_scenes, titleen)

    if args.write_docs:
        if not rows:
            print("ERROR: --write-docs requires scenes-summary.csv or scene-mapping.csv")
            return 1
        sources_dir.mkdir(parents=True, exist_ok=True)
        notes = read_scenes_summary_notes(sources_dir / "scenes-summary.csv")
        write_scene_mapping_md(sources_dir, rows)
        write_scenes_summary_csv(sources_dir, rows, notes_by_id=notes)

    if args.write_yaml:
        if not rows:
            print("ERROR: --write-yaml requires scenes-summary.csv or scene-mapping.csv")
            return 1
        patch_scroll_config(config_path, csv_scenes, dry_run=args.dry_run)

    yaml_scenes = ss.get_scenes_config(ss.load_yaml(str(config_path)))
    if args.write_csv and not args.dry_run:
        rows = load_scene_rows(sources_dir)
        csv_scenes = scene_rows_to_yaml_dicts(rows)

    run_check = args.check or (
        not args.write_yaml and not args.write_csv and not args.write_docs
    )
    if run_check:
        if not rows:
            print("No scenes-summary.csv or scene-mapping.csv in sources/")
            return 1
        if scenes_equal(yaml_scenes, csv_scenes):
            print("\nCSV and scroll_config.yaml scenes match.")
            return 0
        print("\nMISMATCH: CSV and scroll_config.yaml scenes differ.")
        print(
            f"  CSV → YAML: py -3.14 scripts/build_scene_mapping.py scrolls/{scroll_dir.name}/ --write-yaml"
        )
        print(
            f"  YAML → CSV: py -3.14 scripts/build_scene_mapping.py scrolls/{scroll_dir.name}/ --write-csv"
        )
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
