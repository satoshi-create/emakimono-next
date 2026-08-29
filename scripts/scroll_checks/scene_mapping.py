"""CSV scene-mapping as single source of truth."""

from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from preflight_scroll import PreflightReport

# Viewer layout slots (絵師草紙 explicit). Not semantic tags like onset|music.
VALID_LAYOUT_SLOTS = frozenset({"image", "ekotoba"})


@dataclass(frozen=True)
class SceneRow:
    scene_id: int
    title_ja: str
    title_en: str
    range_start: int
    range_end: int
    slot_types: list[str] | None
    confidence: str


def _cell(row: dict[str, str], *keys: str) -> str:
    for key in keys:
        if key in row and row[key] is not None:
            return str(row[key]).strip()
    return ""


def _parse_slot_types(raw: str) -> list[str] | None:
    if not raw.strip():
        return None
    slots = [part.strip() for part in raw.replace("|", ",").split(",") if part.strip()]
    return slots or None


def load_scenes_summary_csv(path: Path) -> list[SceneRow]:
    rows: list[SceneRow] = []
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for raw in reader:
            scene_id = int(_cell(raw, "scene_id"))
            rows.append(
                SceneRow(
                    scene_id=scene_id,
                    title_ja=_cell(raw, "title_ja", "scene_title_ja"),
                    title_en=_cell(raw, "title_en", "scene_title_en"),
                    range_start=int(_cell(raw, "range_start")),
                    range_end=int(_cell(raw, "range_end")),
                    slot_types=_parse_slot_types(_cell(raw, "slot_types")),
                    confidence=_cell(raw, "confidence") or "draft",
                )
            )
    rows.sort(key=lambda item: item.scene_id)
    return rows


def derive_scenes_from_mapping_csv(path: Path) -> list[SceneRow]:
    """Build one row per scene_id from per-image scene-mapping.csv."""
    by_id: dict[int, dict] = {}
    slot_lists: dict[int, list[str]] = {}

    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for raw in reader:
            scene_id = int(_cell(raw, "scene_id"))
            entry = by_id.setdefault(
                scene_id,
                {
                    "scene_id": scene_id,
                    "title_ja": _cell(raw, "scene_title_ja", "title_ja"),
                    "title_en": _cell(raw, "scene_title_en", "title_en"),
                    "range_start": int(_cell(raw, "range_start")),
                    "range_end": int(_cell(raw, "range_end")),
                    "confidence": _cell(raw, "confidence") or "draft",
                },
            )
            slot = _cell(raw, "slot_type", "slot_types")
            if slot:
                slot_lists.setdefault(scene_id, []).append(slot)
            if not entry["title_ja"]:
                entry["title_ja"] = _cell(raw, "scene_title_ja", "title_ja")
            if not entry["title_en"]:
                entry["title_en"] = _cell(raw, "scene_title_en", "title_en")

    rows: list[SceneRow] = []
    for scene_id in sorted(by_id):
        entry = by_id[scene_id]
        slots = slot_lists.get(scene_id)
        rows.append(
            SceneRow(
                scene_id=scene_id,
                title_ja=entry["title_ja"],
                title_en=entry["title_en"],
                range_start=entry["range_start"],
                range_end=entry["range_end"],
                slot_types=slots,
                confidence=entry["confidence"],
            )
        )
    return rows


def dual_csv_paths(sources_dir: Path) -> bool:
    """True when both canonical summary and legacy per-image CSV exist."""
    return (sources_dir / "scene-mapping.csv").is_file() and (
        sources_dir / "scenes-summary.csv"
    ).is_file()


def check_dual_csv_conflict(sources_dir: Path, report: PreflightReport) -> None:
    if not dual_csv_paths(sources_dir):
        return
    report.error(
        "sources/ contains both scene-mapping.csv and scenes-summary.csv. "
        "Canonical mapping is scenes-summary.csv only; per-image notes belong in "
        "scene-mapping.md. Remove scene-mapping.csv."
    )


def load_scene_rows(sources_dir: Path) -> list[SceneRow]:
    """Load scenes-summary.csv (canonical). Fall back to legacy scene-mapping.csv only."""
    summary = sources_dir / "scenes-summary.csv"
    mapping = sources_dir / "scene-mapping.csv"

    if summary.is_file():
        return load_scenes_summary_csv(summary)
    if mapping.is_file():
        return derive_scenes_from_mapping_csv(mapping)
    return []


def _layout_slots(slot_types: list[str] | None) -> list[str] | None:
    if not slot_types:
        return None
    valid = [slot for slot in slot_types if slot in VALID_LAYOUT_SLOTS]
    return valid or None


def yaml_scenes_to_scene_rows(
    yaml_scenes: list[dict],
    existing: list[SceneRow] | None = None,
) -> list[SceneRow]:
    """Build scenes-summary rows from scroll_config.yaml scenes (for --write-csv)."""
    existing_by_id = {row.scene_id: row for row in (existing or [])}
    rows: list[SceneRow] = []
    for scene in sorted(yaml_scenes, key=lambda item: int(item["id"])):
        scene_id = int(scene["id"])
        start, end = scene["range"]
        prev = existing_by_id.get(scene_id)
        yaml_slots = _layout_slots(scene.get("slots"))
        csv_slots = _layout_slots(prev.slot_types if prev else None)
        rows.append(
            SceneRow(
                scene_id=scene_id,
                title_ja=str(scene.get("title", "")),
                title_en=str(scene.get("titleen", "")),
                range_start=int(start),
                range_end=int(end),
                slot_types=yaml_slots if yaml_slots is not None else csv_slots,
                confidence=prev.confidence if prev else "draft",
            )
        )
    return rows


def read_scenes_summary_notes(path: Path) -> dict[int, str]:
    if not path.is_file():
        return {}
    notes: dict[int, str] = {}
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for raw in reader:
            scene_id = int(_cell(raw, "scene_id"))
            notes[scene_id] = _cell(raw, "notes")
    return notes


def scene_rows_to_yaml_dicts(rows: list[SceneRow]) -> list[dict]:
    scenes: list[dict] = []
    for row in rows:
        scene: dict = {
            "id": row.scene_id,
            "title": row.title_ja,
            "titleen": row.title_en,
            "range": [row.range_start, row.range_end],
        }
        layout_slots = _layout_slots(row.slot_types)
        if layout_slots:
            scene["slots"] = layout_slots
        scenes.append(scene)
    return scenes


def scenes_equal(yaml_scenes: list[dict], csv_scenes: list[dict]) -> bool:
    def norm(scenes: list[dict]) -> list[tuple]:
        out = []
        for scene in scenes:
            out.append(
                (
                    scene.get("id"),
                    scene.get("title"),
                    scene.get("titleen"),
                    tuple(scene.get("range") or []),
                    tuple(scene.get("slots") or []),
                )
            )
        return sorted(out, key=lambda item: item[0])

    return norm(yaml_scenes) == norm(csv_scenes)


def check_scene_mapping_sync(
    yaml_scenes: list[dict],
    sources_dir: Path,
    report: PreflightReport,
    *,
    require_reviewed: bool = False,
) -> None:
    check_dual_csv_conflict(sources_dir, report)

    rows = load_scene_rows(sources_dir)
    if not rows:
        return

    csv_scenes = scene_rows_to_yaml_dicts(rows)
    if not scenes_equal(yaml_scenes, csv_scenes):
        scroll_id = sources_dir.parent.name
        report.error(
            "scroll_config.yaml scenes diverged from sources/scenes-summary.csv. "
            f"Sync with: py -3.14 scripts/build_scene_mapping.py scrolls/{scroll_id}/ "
            "--write-yaml (CSV→YAML) or --write-csv (YAML→CSV)"
        )

    draft_ids = [str(row.scene_id) for row in rows if row.confidence.lower() == "draft"]
    if require_reviewed and draft_ids:
        report.error(
            f"scene-mapping confidence=draft for scene_id(s): {', '.join(draft_ids)} "
            "(set to reviewed after visual check)"
        )
    elif draft_ids:
        report.warn(f"scene-mapping still draft for scene_id(s): {', '.join(draft_ids)}")
