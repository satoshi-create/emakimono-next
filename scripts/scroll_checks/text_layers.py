"""Scene text layer checks (scene-text-policy.md)."""

from __future__ import annotations

import re
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from preflight_scroll import PreflightReport

GENDAIBUN_MAX_CHARS = 200
GENDAIBUN_LONG_WARN = 120
TEXT_KEYS = ("gendaibun", "kobun", "desc", "descen")


def _plain_text(value: str) -> str:
    text = re.sub(r"<br\s*/?>", " ", value, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    return re.sub(r"\s+", " ", text).strip()


def check_scene_text_layers(
    scenes: list[dict],
    *,
    kotobagaki: bool,
    report: PreflightReport,
    strict: bool = False,
    titleen: str | None = None,
) -> None:
    if not scenes:
        return

    has_any_text = False
    for scene in scenes:
        text = scene.get("text") or {}
        scene_id = scene.get("id")
        gendaibun = _plain_text(str(text.get("gendaibun", "")))
        desc = _plain_text(str(text.get("desc", "")))
        descen = _plain_text(str(text.get("descen", "")))

        if gendaibun or desc or descen or str(text.get("kobun", "")).strip():
            has_any_text = True

        if len(gendaibun) > GENDAIBUN_MAX_CHARS:
            report.error(
                f"Scene id={scene_id}: gendaibun too long ({len(gendaibun)} chars, max {GENDAIBUN_MAX_CHARS}). "
                "Move long commentary to desc/descen (scene-text-policy.md)."
            )
        elif len(gendaibun) > GENDAIBUN_LONG_WARN and not desc:
            msg = (
                f"Scene id={scene_id}: gendaibun is {len(gendaibun)} chars without desc "
                "(likely layer-2 text in gendaibun)"
            )
            if strict:
                report.error(msg)
            else:
                report.warn(msg)

        if desc and not descen:
            report.error(
                f"Scene id={scene_id}: desc is set but descen is empty (en locale will fall back poorly)"
            )

        if desc and not gendaibun:
            report.warn(f"Scene id={scene_id}: desc without gendaibun (overlay text will be empty)")

        for key in TEXT_KEYS:
            if key in text and text[key] is not None and not isinstance(text[key], str):
                report.error(f"Scene id={scene_id}: text.{key} must be a string")

    if kotobagaki and not has_any_text:
        if titleen and _text_json_has_content(titleen):
            report.warn(
                f"kotobagaki=true but scenes[].text is empty in YAML "
                f"(emaki-text-data/{titleen}.json exists — run build_scene_mapping --write-yaml or sync)"
            )
        else:
            report.error("metadata.kotobagaki=true but no scenes[].text content found")


def _text_json_has_content(titleen: str) -> bool:
    from scroll_checks.post_sync import load_text_json

    rows = load_text_json(titleen)
    if not rows:
        return False
    for row in rows:
        for key in TEXT_KEYS:
            if _plain_text(str(row.get(key, ""))):
                return True
    return False
