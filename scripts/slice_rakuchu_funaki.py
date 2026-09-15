#!/usr/bin/env python3
"""
slice_rakuchu_funaki.py — 洛中洛外図屏風（舟木本）をビューア標準形式にスライス。

7970x3642 の加工済み元画像（右隻 / 左隻）を高さ 2160px に縮小し、
横 6 等分した 1 扇 = 1 枚を右端から左端の順（第1扇→第6扇 / 第7扇→第12扇）で書き出す。

Usage:
  py -3.14 scripts/slice_rakuchu_funaki.py
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from PIL import Image

Image.MAX_IMAGE_PIXELS = None

REPO_ROOT = Path(__file__).resolve().parent.parent

SCROLL_ID = "rakuchu-rakugai-funaki"
FILE_PREFIX = "rakuchu-funaki"
SCROLL_DIR = REPO_ROOT / "scrolls" / SCROLL_ID
IMAGES_DIR = SCROLL_DIR / "images"

RIGHT_SOURCE = IMAGES_DIR / f"{SCROLL_ID}_right.jpg"
LEFT_SOURCE = IMAGES_DIR / f"{SCROLL_ID}_left.jpg"
DEFAULT_OUTPUT_DIR = IMAGES_DIR

TARGET_HEIGHT = 3642
PANELS_PER_SOURCE = 6
RESOLUTION_SUFFIX = 1080


def position_name(index: int) -> str:
    if index <= PANELS_PER_SOURCE:
        return f"第{index}扇（右隻）"
    return f"第{index}扇（左隻）"

def resize_for_slice(source: Path) -> Image.Image:
    if not source.is_file():
        raise SystemExit(f"Source image not found: {source}")

    with Image.open(source) as opened:
        image = opened.convert("RGB")

    width, height = image.size
    
    # リサイズをスキップし、元解像度（3642px）をそのまま使用する
    if TARGET_HEIGHT is None or TARGET_HEIGHT >= height:
        return image

    target_width = max(1, round(width * TARGET_HEIGHT / height))
    if (target_width, TARGET_HEIGHT) != (width, height):
        image = image.resize((target_width, TARGET_HEIGHT), Image.Resampling.LANCZOS)
    return image

def slice_source(source: Path, *, start_index: int, output_dir: Path) -> list[Path]:
    """右端の扇から順に、右→左の鑑賞順でスライスを書き出す。"""
    image = resize_for_slice(source)
    width, height = image.size
    panel_width = width // PANELS_PER_SOURCE
    if panel_width <= 0:
        raise SystemExit(f"Image too narrow to slice into {PANELS_PER_SOURCE} panels: {source}")

    written: list[Path] = []
    for offset in range(PANELS_PER_SOURCE):
        # offset 0 = 右端の扇
        right = width - offset * panel_width
        left = width - (offset + 1) * panel_width if offset < PANELS_PER_SOURCE - 1 else 0
        index = start_index + offset
        dest = output_dir / f"{FILE_PREFIX}_{index:02d}-{RESOLUTION_SUFFIX}.jpg"
        image.crop((left, 0, right, height)).save(
            dest,
            format="JPEG",
            quality=85,
            optimize=True,
            progressive=True,
        )
        written.append(dest)

    image.close()
    return written


def print_report(paths: list[Path]) -> None:
    name_width = max(len(path.name) for path in paths)
    print("")
    print(f"{'File':<{name_width}}  {'Size':>11}  {'KB':>9}  Position")
    print(f"{'-' * name_width}  {'-' * 11}  {'-' * 9}  {'-' * 16}")
    for path in paths:
        with Image.open(path) as image:
            width, height = image.size
        index = int(path.stem.split("_")[-1].split("-")[0])
        size = path.stat().st_size
        print(f"{path.name:<{name_width}}  {f'{width}x{height}':>11}  {size / 1024:>9.1f}  {position_name(index)}")
    print(f"\nTotal: {len(paths)} file(s) -> {paths[0].parent}")
    print(f"Total size: {sum(path.stat().st_size for path in paths) / 1024 / 1024:.2f} MB")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Slice 洛中洛外図屏風（舟木本） into 12 viewer panels")
    parser.add_argument("--right-source", default=str(RIGHT_SOURCE), help="右隻（下京・東山）の元画像")
    parser.add_argument("--left-source", default=str(LEFT_SOURCE), help="左隻（上京・洛北）の元画像")
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR), help="出力先ディレクトリ")
    args = parser.parse_args(argv)

    output_dir = Path(args.output_dir)
    os.makedirs(output_dir, exist_ok=True)

    written: list[Path] = []
    written += slice_source(Path(args.right_source), start_index=1, output_dir=output_dir)
    written += slice_source(Path(args.left_source), start_index=1 + PANELS_PER_SOURCE, output_dir=output_dir)

    print_report(written)
    return 0


if __name__ == "__main__":
    sys.exit(main())
