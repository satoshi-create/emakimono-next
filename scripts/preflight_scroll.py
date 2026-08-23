#!/usr/bin/env python3
"""
preflight_scroll.py — Validate scroll_config.yaml before sync (no Cloudinary API calls).

Usage:
  python scripts/preflight_scroll.py scrolls/my-scroll/scroll_config.yaml
  python scripts/preflight_scroll.py scrolls/my-scroll/scroll_config.yaml --skip-upload
  python scripts/preflight_scroll.py scrolls/my-scroll/scroll_config.yaml --strict-text --require-reviewed

Exit codes:
  0 = all checks passed
  1 = one or more errors
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import sync_scroll as ss
from scroll_checks.report import ValidationReport as PreflightReport
from scroll_checks.images import check_image_heights, check_unindexed_files, max_image_index
from scroll_checks.scene_mapping import check_scene_mapping_sync
from scroll_checks.source_similarity import check_source_similarity
from scroll_checks.structure import check_range_coverage
from scroll_checks.text_layers import check_scene_text_layers

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_EMAKIS_PATH = REPO_ROOT / "local-data/pipeline/dataEmakis.json"
PERSON_PROFILES_PATH = REPO_ROOT / "src/data/personname-data/personprofiles.json"

# Cloudinary Free plan (see media_limits in usage API)
MAX_IMAGE_BYTES = 10 * 1024 * 1024


def _load_data_emakis() -> list[dict]:
    if not DATA_EMAKIS_PATH.exists():
        return []
    with open(DATA_EMAKIS_PATH, "r", encoding="utf-8") as handle:
        return json.load(handle)


def _known_person_slugs() -> set[str]:
    """personprofiles.json に存在する人物 slug の集合（personname 展開先）。"""
    if not PERSON_PROFILES_PATH.exists():
        return set()
    with open(PERSON_PROFILES_PATH, "r", encoding="utf-8") as handle:
        profiles = json.load(handle)
    return {str(p.get("slug")) for p in profiles if p.get("slug")}


def _find_entry_by_titleen(entries: list[dict], titleen: str) -> dict | None:
    for entry in entries:
        if entry.get("titleen") == titleen:
            return entry
    return None


def _find_entry_by_id(entries: list[dict], entry_id: int) -> dict | None:
    for entry in entries:
        if entry.get("id") == entry_id:
            return entry
    return None


def _planned_indices(config: dict) -> set[int]:
    return {idx for _, _, idx, _ in ss.expand_chapters(config)}


def run_preflight(
    config_path: Path,
    *,
    repo_root: Path = REPO_ROOT,
    skip_upload: bool = False,
    strict_text: bool = False,
    skip_similarity: bool = False,
    require_reviewed: bool = False,
    skip_height_warn: bool = False,
) -> PreflightReport:
    report = PreflightReport()

    if not config_path.exists():
        report.error(f"Config not found: {config_path}")
        return report

    config = ss.load_yaml(str(config_path))
    scroll_id = config.get("scroll_id")
    if not scroll_id:
        report.error("Missing required field: scroll_id")
        return report

    folder_name = config_path.parent.name
    if folder_name not in ("_template", "_examples", "_drafts") and folder_name != scroll_id:
        report.error(
            f"Folder name '{folder_name}' does not match scroll_id '{scroll_id}' "
            f"(expected scrolls/{scroll_id}/scroll_config.yaml)"
        )

    meta = config.get("metadata") or {}
    if not meta:
        report.error("Missing required section: metadata")
        return report

    titleen = meta.get("titleen")
    entry_id = meta.get("id")
    if not titleen:
        report.error("Missing metadata.titleen")
    if entry_id is None:
        report.error("Missing metadata.id")

    # 任意の出典・人物・九相段フィールド（形状チェック）
    for key in ("sourceAuthor", "sourceCollection", "sourceLicense"):
        if meta.get(key) is not None and not isinstance(meta[key], str):
            report.error(f"metadata.{key} must be a string (got {type(meta[key]).__name__})")

    pn = meta.get("personname")
    if pn is not None:
        if not isinstance(pn, list) or not pn:
            report.error("metadata.personname must be a non-empty list of slugs or profile dicts")
        elif isinstance(pn[0], str):
            unknown = sorted({s for s in pn if s not in _known_person_slugs()})
            if unknown:
                report.error(
                    f"metadata.personname unknown slug(s) (not in personprofiles.json): "
                    f"{', '.join(unknown)}"
                )
        elif not isinstance(pn[0], dict):
            report.error(
                "metadata.personname must be a list of slugs (str) or profile dicts "
                f"(got {type(pn[0]).__name__})"
            )

    ks = meta.get("kusouzuslug")
    if ks is not None:
        if not isinstance(ks, list) or not all(isinstance(s, (str, int)) for s in ks):
            report.error("metadata.kusouzuslug must be a list of stage ids (int or str)")

    scenes = ss.get_scenes_config(config)
    if not scenes:
        report.error("No scenes defined (scenes or chapters required)")

    plan = ss.build_upload_plan(config)
    if not plan:
        report.error("Upload plan is empty (check scenes[].range)")

    for scene in scenes:
        start, end = scene["range"]
        if start > end:
            report.error(f"Scene id={scene['id']}: invalid range [{start}, {end}]")
        slots = scene.get("slots") or []
        if slots:
            expected = end - start + 1
            if len(slots) != expected:
                report.error(
                    f"Scene id={scene['id']}: slots length {len(slots)} != "
                    f"range [{start}, {end}] count ({expected})"
                )
            invalid = [s for s in slots if s not in ("image", "ekotoba")]
            if invalid:
                report.error(
                    f"Scene id={scene['id']}: invalid slots {invalid} "
                    f"(expected 'image' or 'ekotoba')"
                )

    images_dir = ss.resolve_images_dir(repo_root, scroll_id, config_path)
    if not images_dir.is_dir():
        report.error(f"Images directory not found: {images_dir}")
        return report

    check_unindexed_files(images_dir, report)

    index_to_paths = ss.collect_images_by_index(images_dir)
    planned = _planned_indices(config)
    max_idx = max(max_image_index(images_dir), max(planned) if planned else 0)
    check_range_coverage(scenes, max_idx, report)

    missing: list[int] = []
    oversized: list[str] = []
    for item in plan:
        idx = item["index"]
        file_path = ss.pick_file_for_index(index_to_paths, idx)
        if file_path is None:
            missing.append(idx)
            continue
        size = file_path.stat().st_size
        if size > MAX_IMAGE_BYTES:
            mb = size / (1024 * 1024)
            oversized.append(f"index {idx}: {file_path.name} ({mb:.2f} MB > 10 MB)")

    if missing:
        report.error(
            f"Missing image file(s) for global index: {', '.join(str(i) for i in sorted(missing))} "
            f"(in {images_dir})"
        )
    if oversized:
        report.error("Image file size exceeds Cloudinary Free limit (10 MB):\n  " + "\n  ".join(oversized))

    extra_indices = sorted(set(index_to_paths) - planned)
    if extra_indices:
        report.warn(
            f"Extra image index(es) not covered by scenes range (ignored by sync): "
            f"{', '.join(str(i) for i in extra_indices)}"
        )

    if not skip_height_warn:
        check_image_heights(images_dir, report)

    kotobagaki = bool(meta.get("kotobagaki"))
    check_scene_text_layers(
        scenes,
        kotobagaki=kotobagaki,
        report=report,
        strict=strict_text,
        titleen=titleen,
    )

    sources_dir = config_path.parent / "sources"
    if not skip_similarity:
        check_source_similarity(scenes, sources_dir, report)
    check_scene_mapping_sync(
        scenes,
        sources_dir,
        report,
        require_reviewed=require_reviewed,
    )

    if titleen is not None and entry_id is not None:
        entries = _load_data_emakis()
        by_titleen = _find_entry_by_titleen(entries, titleen)
        by_id = _find_entry_by_id(entries, entry_id)

        if by_titleen and by_id and by_titleen is not by_id:
            report.error(
                f"metadata.titleen '{titleen}' and metadata.id {entry_id} match different entries "
                f"in dataEmakis.json"
            )
        elif by_titleen and by_titleen.get("id") != entry_id:
            report.error(
                f"metadata.id {entry_id} conflicts with existing entry titleen='{titleen}' "
                f"(existing id={by_titleen.get('id')})"
            )
        elif by_id and by_id.get("titleen") != titleen:
            report.error(
                f"metadata.titleen '{titleen}' conflicts with existing entry id={entry_id} "
                f"(existing titleen='{by_id.get('titleen')}')"
            )

        if skip_upload and by_titleen is None:
            report.error(
                "--skip-upload cannot be used for a new scroll (no existing dataEmakis entry). "
                "Run a full sync with upload first."
            )

    return report


def print_report(report: PreflightReport, *, scroll_id: str, image_count: int) -> None:
    print(f"\n=== Preflight: scroll_id={scroll_id} ===")
    print(f"  Planned images: {image_count}")

    if report.warnings:
        print("\nWarnings:")
        for msg in report.warnings:
            print(f"  ! {msg}")

    if report.errors:
        print("\nErrors:")
        for msg in report.errors:
            print(f"  x {msg}")
        print("\nPreflight FAILED")
    else:
        print("\nPreflight OK")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate scroll_config.yaml before sync")
    parser.add_argument("config_path", help="Path to scroll_config.yaml")
    parser.add_argument(
        "--skip-upload",
        action="store_true",
        help="Also validate --skip-upload safety (new scroll check)",
    )
    parser.add_argument(
        "--strict-text",
        action="store_true",
        help="Promote text-layer warnings to errors",
    )
    parser.add_argument(
        "--skip-similarity",
        action="store_true",
        help="Skip sources/ similarity check (drafting)",
    )
    parser.add_argument(
        "--require-reviewed",
        action="store_true",
        help="Require scene-mapping confidence != draft",
    )
    parser.add_argument(
        "--skip-height-warn",
        action="store_true",
        help="Skip non-1080px height warnings",
    )
    args = parser.parse_args(argv)

    config_path = ss.get_config_path(REPO_ROOT, args.config_path)
    config = ss.load_yaml(str(config_path)) if config_path.exists() else {}
    scroll_id = config.get("scroll_id", "(unknown)")
    plan_len = len(ss.build_upload_plan(config)) if config else 0

    report = run_preflight(
        config_path,
        skip_upload=args.skip_upload,
        strict_text=args.strict_text,
        skip_similarity=args.skip_similarity,
        require_reviewed=args.require_reviewed,
        skip_height_warn=args.skip_height_warn,
    )
    print_report(report, scroll_id=scroll_id, image_count=plan_len)
    return 0 if report.ok else 1


if __name__ == "__main__":
    sys.exit(main())
