"""Image directory checks."""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING

from scroll_image_utils import (
    collect_images_by_index,
    list_unindexed_images,
    read_image_height,
    resolution_from_path,
)

if TYPE_CHECKING:
    from preflight_scroll import PreflightReport

RECOMMENDED_HEIGHT = 1080


def check_unindexed_files(images_dir: Path, report: PreflightReport) -> None:
    unindexed = list_unindexed_images(images_dir)
    if unindexed:
        names = ", ".join(path.name for path in unindexed[:10])
        suffix = f" (+{len(unindexed) - 10} more)" if len(unindexed) > 10 else ""
        report.error(
            f"Image files without _NN- pattern (run normalize_scroll_images.py --fix): "
            f"{names}{suffix}"
        )


def check_image_heights(images_dir: Path, report: PreflightReport) -> None:
    index_to_paths = collect_images_by_index(images_dir)
    for index in sorted(index_to_paths):
        path = index_to_paths[index][0]
        height = resolution_from_path(path) or read_image_height(path)
        if height and height != RECOMMENDED_HEIGHT:
            report.warn(
                f"Index {index} ({path.name}): height {height}px "
                f"(recommended {RECOMMENDED_HEIGHT}px; run normalize_scroll_images.py if needed)"
            )


def max_image_index(images_dir: Path) -> int:
    index_to_paths = collect_images_by_index(images_dir)
    return max(index_to_paths) if index_to_paths else 0
