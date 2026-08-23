#!/usr/bin/env python3
"""
normalize_scroll_images.py — Rename scroll images to _NN-{height}.jpg pattern.

Usage:
  py -3.14 scripts/normalize_scroll_images.py scrolls/my-scroll/
  py -3.14 scripts/normalize_scroll_images.py scrolls/my-scroll/images --dry-run
  py -3.14 scripts/normalize_scroll_images.py scrolls/my-scroll/ --fix --target-height 1080
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

from scroll_image_utils import (
    IMAGE_EXTENSIONS,
    canonical_filename,
    collect_images_by_index,
    extract_index_from_path,
    list_image_files,
    list_unindexed_images,
    read_image_height,
    resolution_from_path,
)

REPO_ROOT = Path(__file__).resolve().parent.parent


def resolve_images_dir(arg: str) -> Path:
    path = Path(arg)
    if not path.is_absolute():
        path = REPO_ROOT / path
    if path.is_file():
        path = path.parent
    if path.name == "images":
        return path.resolve()
    candidate = path / "images"
    if candidate.is_dir():
        return candidate.resolve()
    if path.is_dir():
        return path.resolve()
    raise SystemExit(f"Images directory not found: {arg}")


def scan(images_dir: Path, *, target_height: int) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    unindexed = list_unindexed_images(images_dir)
    if unindexed:
        errors.append(
            f"{len(unindexed)} file(s) without _NN- pattern: "
            + ", ".join(path.name for path in unindexed[:8])
        )

    index_to_paths = collect_images_by_index(images_dir)
    if not index_to_paths:
        errors.append("No indexed image files found")
        return errors, warnings

    indices = sorted(index_to_paths)
    expected = list(range(1, indices[-1] + 1))
    missing = [i for i in expected if i not in index_to_paths]
    if missing:
        errors.append(f"Missing indices in sequence: {', '.join(str(i) for i in missing)}")

    duplicates = [i for i, paths in index_to_paths.items() if len(paths) > 1]
    if duplicates:
        for index in duplicates:
            names = ", ".join(path.name for path in index_to_paths[index])
            warnings.append(f"Index {index} has multiple files (using highest-res): {names}")

    for index in indices:
        path = index_to_paths[index][0]
        height = resolution_from_path(path) or read_image_height(path)
        if height and height != target_height:
            warnings.append(f"Index {index} ({path.name}): height {height}px (target {target_height}px)")

    return errors, warnings


def apply_fix(images_dir: Path, *, target_height: int, dry_run: bool) -> list[str]:
    actions: list[str] = []
    files = list_image_files(images_dir)

    indexed = [path for path in files if extract_index_from_path(path) is not None]
    unindexed = [path for path in files if extract_index_from_path(path) is None]

    # Renumber unindexed files after the highest existing index
    next_index = max((extract_index_from_path(path) or 0 for path in indexed), default=0) + 1
    for path in sorted(unindexed, key=lambda item: item.name.lower()):
        height = resolution_from_path(path) or read_image_height(path) or target_height
        ext = path.suffix.lower() if path.suffix.lower() in IMAGE_EXTENSIONS else ".jpg"
        dest_name = canonical_filename(next_index, height, ext)
        dest = images_dir / dest_name
        actions.append(f"{path.name} -> {dest_name}")
        if not dry_run:
            if dest.exists() and dest.resolve() != path.resolve():
                raise SystemExit(f"Refusing to overwrite existing file: {dest}")
            if path.resolve() != dest.resolve():
                path.rename(dest)
        next_index += 1

    # Normalize indexed filenames to canonical _NN-{height}.ext
    index_to_paths = collect_images_by_index(images_dir)
    for index in sorted(index_to_paths):
        path = index_to_paths[index][0]
        height = resolution_from_path(path) or read_image_height(path) or target_height
        ext = path.suffix.lower()
        dest_name = canonical_filename(index, height, ext)
        dest = images_dir / dest_name
        if path.name != dest_name:
            actions.append(f"{path.name} -> {dest_name}")
            if not dry_run:
                if dest.exists() and dest.resolve() != path.resolve():
                    backup = images_dir / f"{dest.stem}.bak{dest.suffix}"
                    shutil.move(dest, backup)
                if path.resolve() != dest.resolve():
                    path.rename(dest)

    return actions


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Normalize scroll image filenames")
    parser.add_argument("path", help="scrolls/{scroll_id}/ or images/ directory")
    parser.add_argument("--dry-run", action="store_true", help="Report only (default without --fix)")
    parser.add_argument("--fix", action="store_true", help="Apply renames")
    parser.add_argument("--target-height", type=int, default=1080, help="Recommended height (default: 1080)")
    args = parser.parse_args(argv)

    images_dir = resolve_images_dir(args.path)
    dry_run = args.dry_run or not args.fix

    print(f"\n=== Normalize images: {images_dir} ===")
    errors, warnings = scan(images_dir, target_height=args.target_height)

    if warnings:
        print("\nWarnings:")
        for msg in warnings:
            print(f"  ! {msg}")

    if errors:
        print("\nErrors:")
        for msg in errors:
            print(f"  x {msg}")

    if args.fix:
        actions = apply_fix(images_dir, target_height=args.target_height, dry_run=dry_run)
        if actions:
            label = "Would rename" if dry_run else "Renamed"
            print(f"\n{label}:")
            for action in actions:
                print(f"  - {action}")
        else:
            print("\nNo renames needed.")

    if errors:
        print("\nNormalize FAILED")
        return 1

    print("\nNormalize OK" if not dry_run or not args.fix else "\nDry-run OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
