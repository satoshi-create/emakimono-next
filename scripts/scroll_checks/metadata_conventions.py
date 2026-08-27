"""Naming / metadata conventions checked before upload."""

from __future__ import annotations

import re
from typing import TYPE_CHECKING

from scroll_checks.post_sync import expected_thumb_path

if TYPE_CHECKING:
    from scroll_checks.report import ValidationReport

# kebab-case scroll_id / folder / Cloudinary B-form prefix
SCROLL_ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

# eraen codes used by eraNameEn() / timeline modal (lowercase URL slugs)
KNOWN_ERAEN = frozenset(
    {
        "heiann",
        "kamakura",
        "muromachi",
        "aduchimomoyama",
        "edo",
        "meiji",
    }
)

# special scaffold dirs under scrolls/
SKIP_SCROLL_ID_FOLDERS = frozenset({"_template", "_examples", "_drafts"})


def check_scroll_id_kebab(scroll_id: str, *, report: ValidationReport) -> None:
    if not scroll_id:
        return
    if not SCROLL_ID_RE.fullmatch(scroll_id):
        report.error(
            f"scroll_id '{scroll_id}' must be kebab-case "
            f"(e.g. hyakki-kokkai-a; underscores break Cloudinary B-form public_id)"
        )


def check_eraen(eraen: object, *, report: ValidationReport) -> None:
    if eraen is None:
        return
    if not isinstance(eraen, str):
        report.error(f"metadata.eraen must be a string (got {type(eraen).__name__})")
        return
    value = eraen.strip()
    if not value:
        return
    if value != value.lower():
        report.error(
            f"metadata.eraen '{eraen}' must be lowercase code "
            f"(got mixed case; use e.g. 'edo' not 'Edo' — display names come from eraNameEn())"
        )
        return
    if value not in KNOWN_ERAEN:
        known = ", ".join(sorted(KNOWN_ERAEN))
        report.error(f"metadata.eraen '{value}' is unknown (expected one of: {known})")


def check_thumb_path(
    thumb: object,
    *,
    titleen: str | None,
    report: ValidationReport,
    missing_as_error: bool = False,
) -> None:
    if not titleen:
        return
    expected = expected_thumb_path(titleen)
    if thumb is None or thumb == "":
        msg = f"metadata.thumb is empty (expected '{expected}')"
        if missing_as_error:
            report.error(msg)
        else:
            report.warn(msg)
        return
    if not isinstance(thumb, str):
        report.error(f"metadata.thumb must be a string (got {type(thumb).__name__})")
        return
    if thumb != expected:
        report.error(
            f"metadata.thumb '{thumb}' must be '{expected}' "
            f"(form: /thumb/{{titleen}}_thumb.webp)"
        )


def check_metadata_conventions(
    config: dict,
    *,
    report: ValidationReport,
    folder_name: str | None = None,
) -> None:
    scroll_id = config.get("scroll_id") or ""
    if folder_name not in SKIP_SCROLL_ID_FOLDERS:
        check_scroll_id_kebab(str(scroll_id), report=report)

    meta = config.get("metadata") or {}
    check_eraen(meta.get("eraen"), report=report)
    check_thumb_path(
        meta.get("thumb"),
        titleen=meta.get("titleen"),
        report=report,
        missing_as_error=False,
    )
