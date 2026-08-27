"""Color-correction (contact sheet) gate before process / sync."""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING

from scroll_image_utils import IMAGE_EXTENSIONS, collect_images_by_index

if TYPE_CHECKING:
    from scroll_checks.report import ValidationReport

CONTACT_SHEET_NAMES = frozenset(
    {"contact_sheet.jpg", "contact_sheet.jpeg", "preview.jpg", "preview.jpeg"}
)


def list_raw_slice_images(raw_dir: Path) -> list[Path]:
    if not raw_dir.is_dir():
        return []
    files: list[Path] = []
    for path in sorted(raw_dir.iterdir()):
        if not path.is_file():
            continue
        if path.name.lower() in CONTACT_SHEET_NAMES:
            continue
        if path.suffix.lower() not in IMAGE_EXTENSIONS:
            continue
        files.append(path)
    return files


def has_contact_sheet(raw_dir: Path) -> bool:
    if not raw_dir.is_dir():
        return False
    return any((raw_dir / name).is_file() for name in CONTACT_SHEET_NAMES)


def check_color_correction_gate(
    scroll_dir: Path,
    *,
    report: ValidationReport,
    ack_no_color_correction: bool = False,
) -> None:
    """Enforce contact-sheet flow when Figma raw slices are present.

    - images/_raw/ has slices but no contact_sheet.jpg → ERROR
      (unless ack_no_color_correction)
    - _NN-1080 only (no usable _raw/) → WARN unless acknowledged
    """
    images_dir = scroll_dir / "images"
    raw_dir = images_dir / "_raw"
    slices = list_raw_slice_images(raw_dir)
    sheet_ok = has_contact_sheet(raw_dir)
    indexed = collect_images_by_index(images_dir) if images_dir.is_dir() else {}

    if slices and not sheet_ok:
        msg = (
            f"images/_raw/ has {len(slices)} slice(s) but no contact_sheet.jpg. "
            "Run: py -3.14 scripts/generate_contact_sheet.py <scroll_dir>/ "
            "then decide Brightness/Sharpen before process_figma_slices.py. "
            "To skip intentionally, pass --ack-no-color-correction."
        )
        if ack_no_color_correction:
            report.warn(msg + " (acknowledged)")
        else:
            report.error(msg)
        return

    if slices and sheet_ok:
        return

    if indexed and not slices:
        msg = (
            "Viewer images (_NN-1080) exist without images/_raw/ slices / contact sheet. "
            "Color correction may have been skipped. Prefer moving sources to images/_raw/ "
            "and running generate_contact_sheet.py, or pass --ack-no-color-correction."
        )
        if ack_no_color_correction:
            report.warn(msg + " (acknowledged)")
        else:
            report.warn(msg)
