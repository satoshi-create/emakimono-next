"""Thumbnail and OGP asset checks."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path
from typing import TYPE_CHECKING

from scroll_checks.post_sync import expected_thumb_path, load_cache_entry

if TYPE_CHECKING:
    from scroll_checks.report import ValidationReport

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
THUMB_DIR = REPO_ROOT / "public/thumb"
OGP_DIR = REPO_ROOT / "public/ogp"
DATA_EMAKIS_PATH = REPO_ROOT / "local-data/pipeline/dataEmakis.json"
CACHE_PATH = REPO_ROOT / "src/data/image-metadata-cache/image-metadata-cache.json"

THUMB_WIDTH = 1066
THUMB_HEIGHT = 600


def resolve_thumb_file(thumb_path: str) -> Path | None:
    if not thumb_path:
        return None
    normalized = thumb_path.lstrip("/")
    candidates = [
        REPO_ROOT / "public" / normalized,
        THUMB_DIR / Path(normalized).name,
    ]
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    return None


def check_thumb_assets(
    titleen: str,
    *,
    report: ValidationReport,
    check_ogp: bool = True,
) -> None:
    expected_path = expected_thumb_path(titleen)
    cache_entry = load_cache_entry(titleen)

    thumb_ref = (cache_entry or {}).get("thumb") or expected_path
    thumb_file = resolve_thumb_file(thumb_ref)
    if thumb_file is None:
        report.error(
            f"Missing thumb file for '{titleen}' (expected public{expected_path}). "
            "Run: node scripts/generate-thumb-from-scene.js {titleen} or thumb-workflow.md"
        )
        return

    if thumb_file.stat().st_size <= 0:
        report.error(f"Thumb file is empty: {thumb_file}")

    if cache_entry:
        for key in ("thumb", "thumb2"):
            value = cache_entry.get(key) or ""
            if value and value != expected_path:
                msg = f"cache.{key}='{value}' (expected '{expected_path}')"
                if key == "thumb":
                    report.error(msg)
                else:
                    report.warn(msg)
            elif not value:
                msg = f"cache.{key} is empty (expected '{expected_path}')"
                if key == "thumb":
                    report.error(msg)
                else:
                    report.warn(msg)

    if DATA_EMAKIS_PATH.is_file():
        with DATA_EMAKIS_PATH.open("r", encoding="utf-8") as handle:
            entries = json.load(handle)
        for entry in entries:
            if entry.get("titleen") == titleen:
                for key in ("thumb", "thumb2"):
                    value = entry.get(key) or ""
                    if value and value != expected_path:
                        report.warn(f"dataEmakis.{key}='{value}' (expected '{expected_path}')")
                break

    if check_ogp:
        ogp_path = OGP_DIR / f"{titleen}.jpg"
        if not ogp_path.is_file():
            report.error(
                f"Missing OGP file public/ogp/{titleen}.jpg "
                "(run: node src/script/generateOgImages.js)"
            )


def run_ogp_check(*, titleen: str | None = None) -> tuple[int, str]:
    cmd = ["node", "src/script/generateOgImages.js", "--check"]
    if titleen:
        cmd.append(titleen)
    result = subprocess.run(
        cmd,
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    output = (result.stdout or "") + (result.stderr or "")
    return result.returncode, output
