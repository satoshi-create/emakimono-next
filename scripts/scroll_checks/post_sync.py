"""Post-sync JSON validation (image-metadata-cache, emaki-text-data)."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import TYPE_CHECKING

import sync_scroll as ss

if TYPE_CHECKING:
    from scroll_checks.report import ValidationReport

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
CACHE_PATH = REPO_ROOT / "src/data/image-metadata-cache/image-metadata-cache.json"
EMAKI_TEXT_DIR = REPO_ROOT / "src/data/emaki-text-data"
DATA_EMAKIS_PATH = REPO_ROOT / "local-data/pipeline/dataEmakis.json"

PUBLIC_ID_RE = re.compile(r"^[a-z0-9-]+__[a-z0-9-]+_\d+_\d+__\d+$")


def expected_thumb_path(titleen: str) -> str:
    return f"/thumb/{titleen}_thumb.webp"


def load_cache() -> list[dict]:
    if not CACHE_PATH.is_file():
        return []
    with CACHE_PATH.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def load_cache_entry(titleen: str) -> dict | None:
    for entry in load_cache():
        if entry.get("titleen") == titleen:
            return entry
    return None


def load_text_json(titleen: str) -> list[dict] | None:
    path = EMAKI_TEXT_DIR / f"{titleen}.json"
    if not path.is_file():
        return None
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    return data if isinstance(data, list) else None


def _plain_text(value: str) -> str:
    text = re.sub(r"<br\s*/?>", " ", str(value), flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    return re.sub(r"\s+", " ", text).strip()


def _collect_public_ids(entry: dict) -> set[str]:
    ids: set[str] = set()
    for slot in entry.get("emakis") or []:
        name = slot.get("name")
        if isinstance(name, str) and name:
            ids.add(name.replace("emakimono/", ""))
        src = slot.get("src") or ""
        if isinstance(src, str) and "emakimono/" in src:
            ids.add(src.split("emakimono/", 1)[-1].replace(".jpg", ""))
    return ids


def check_post_sync(
    config: dict,
    *,
    report: ValidationReport,
    require_text_json: bool = True,
) -> None:
    meta = config.get("metadata") or {}
    titleen = meta.get("titleen", "")
    scroll_id = config.get("scroll_id", "")
    if not titleen:
        report.error("metadata.titleen is missing")
        return

    entry = load_cache_entry(titleen)
    if entry is None:
        report.error(f"image-metadata-cache.json has no entry for titleen='{titleen}'")
        return

    plan = ss.build_upload_plan(config)
    if not plan:
        report.error("Upload plan is empty")
        return

    cache_ids = _collect_public_ids(entry)
    missing_ids: list[str] = []
    for item in plan:
        public_id = ss.image_public_id(
            item["scroll_id"],
            item["volume_num"],
            item["chapter"],
            item["ordinal"],
        )
        if public_id not in cache_ids:
            missing_ids.append(public_id)

    if missing_ids:
        sample = ", ".join(missing_ids[:5])
        suffix = f" (+{len(missing_ids) - 5} more)" if len(missing_ids) > 5 else ""
        report.error(f"Missing Cloudinary public_id(s) in cache emakis[]: {sample}{suffix}")

    first = next((item for item in plan if item["index"] == 1), None)
    if first is None:
        report.error("Upload plan does not include global index 1")
    else:
        first_id = ss.image_public_id(
            first["scroll_id"],
            first["volume_num"],
            first["chapter"],
            first["ordinal"],
        )
        if first_id not in cache_ids:
            report.error(
                f"Global index 1 public_id '{first_id}' not found in cache "
                "(viewer may start at wrong scene)"
            )

    invalid_ids = sorted(pid for pid in cache_ids if scroll_id and scroll_id in pid and not PUBLIC_ID_RE.match(pid))
    if invalid_ids:
        report.error(
            f"Non-canonical public_id format in cache: {', '.join(invalid_ids[:3])}"
        )

    scene_text = bool(meta.get("sceneText") or meta.get("kotobagaki"))
    text_json = load_text_json(titleen)
    if scene_text and require_text_json and text_json is None:
        report.error(
            f"sceneText/kotobagaki enabled but emaki-text-data/{titleen}.json is missing"
        )

    scenes = ss.get_scenes_config(config)
    if text_json is not None:
        chapters = {str(row.get("chapter")) for row in text_json}
        scene_ids = {str(scene["id"]) for scene in scenes}
        extra = sorted(chapters - scene_ids)
        missing_ch = sorted(scene_ids - chapters)
        if extra:
            report.warn(f"emaki-text-data chapters not in YAML scenes: {', '.join(extra)}")
        if missing_ch and scene_text:
            report.warn(f"YAML scenes without emaki-text-data chapter: {', '.join(missing_ch)}")

        for row in text_json:
            chapter = row.get("chapter")
            desc = _plain_text(row.get("desc", ""))
            descen = _plain_text(row.get("descen", ""))
            if desc and not descen:
                report.error(
                    f"emaki-text-data chapter {chapter}: desc set but descen empty (en locale issue)"
                )

    meta_desc = _plain_text(meta.get("desc", ""))
    meta_descen = _plain_text(meta.get("descen", ""))
    if meta_desc and not meta_descen:
        report.warn("metadata.desc is set but metadata.descen is empty")

    expected_thumb = expected_thumb_path(titleen)
    thumb = entry.get("thumb") or meta.get("thumb") or ""
    if thumb and thumb != expected_thumb:
        report.warn(f"thumb path '{thumb}' (expected '{expected_thumb}')")
    elif not thumb:
        report.warn(f"thumb not set (expected '{expected_thumb}')")

    if meta.get("sourceImageUrl") and not entry.get("sourceImageUrl"):
        report.warn("metadata.sourceImageUrl not reflected in cache entry")
