#!/usr/bin/env python3
"""Shared image filename parsing and scanning for scroll sync / preflight."""

from __future__ import annotations

import re
import struct
from pathlib import Path

# Filenames like "_01-375.jpg" or "_01.jpg"
INDEX_IN_FILENAME_RE = re.compile(r"_(\d+)[-.]", re.IGNORECASE)

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def extract_index_from_path(file_path: Path) -> int | None:
    match = INDEX_IN_FILENAME_RE.search(file_path.stem)
    return int(match.group(1)) if match else None


def resolution_from_path(file_path: Path) -> int:
    matches = re.findall(r"-(\d{2,5})(?:[-.]|$)", file_path.stem)
    if matches:
        try:
            return int(matches[-1])
        except ValueError:
            pass
    return 0


def collect_images_by_index(images_dir: Path) -> dict[int, list[Path]]:
    index_to_paths: dict[int, list[Path]] = {}
    for path in list_image_files(images_dir):
        idx = extract_index_from_path(path)
        if idx is not None:
            index_to_paths.setdefault(idx, []).append(path)
    for paths in index_to_paths.values():
        paths.sort(key=lambda item: (-resolution_from_path(item), item.name))
    return index_to_paths


def pick_file_for_index(index_to_paths: dict[int, list[Path]], global_index: int) -> Path | None:
    paths = index_to_paths.get(global_index)
    return paths[0] if paths else None


def list_image_files(images_dir: Path) -> list[Path]:
    """List viewer images under images/. Skips images/_raw/ (pipeline scratch)."""
    files: list[Path] = []
    for ext in ("*.jpg", "*.jpeg", "*.png", "*.webp"):
        for path in images_dir.rglob(ext):
            if not path.is_file():
                continue
            # Ignore Figma-free / process scratch dir
            if "_raw" in path.relative_to(images_dir).parts:
                continue
            files.append(path)
    return sorted(files, key=lambda item: item.name.lower())


def list_unindexed_images(images_dir: Path) -> list[Path]:
    return [path for path in list_image_files(images_dir) if extract_index_from_path(path) is None]


def read_image_height(path: Path) -> int | None:
    """Read pixel height from JPEG/PNG headers (stdlib only)."""
    suffix = path.suffix.lower()
    try:
        with path.open("rb") as handle:
            if suffix in (".jpg", ".jpeg"):
                return _jpeg_height(handle)
            if suffix == ".png":
                return _png_height(handle)
    except OSError:
        return None
    return None


def _jpeg_height(handle) -> int | None:
    handle.read(2)
    while True:
        marker_bytes = handle.read(2)
        if len(marker_bytes) < 2:
            return None
        marker = struct.unpack(">H", marker_bytes)[0]
        if marker == 0xFFD9:
            return None
        if marker in (0xFFC0, 0xFFC1, 0xFFC2, 0xFFC3, 0xFFC5, 0xFFC6, 0xFFC7, 0xFFC9, 0xFFCA, 0xFFCB, 0xFFCC, 0xFFCD, 0xFFCE, 0xFFCF):
            handle.read(3)
            height_bytes = handle.read(2)
            if len(height_bytes) < 2:
                return None
            return struct.unpack(">H", height_bytes)[0]
        length_bytes = handle.read(2)
        if len(length_bytes) < 2:
            return None
        length = struct.unpack(">H", length_bytes)[0]
        if length < 2:
            return None
        handle.seek(length - 2, 1)


def _png_height(handle) -> int | None:
    signature = handle.read(8)
    if signature != b"\x89PNG\r\n\x1a\n":
        return None
    chunk_header = handle.read(8)
    if len(chunk_header) < 8:
        return None
    _chunk_type = chunk_header[4:8]
    if _chunk_type != b"IHDR":
        return None
    ihdr = handle.read(8)
    if len(ihdr) < 8:
        return None
    _width, height = struct.unpack(">II", ihdr)
    return height


def canonical_filename(index: int, height: int | None = None, ext: str = ".jpg") -> str:
    return f"_{index:02d}-{height or 1080}{ext}"
