#!/usr/bin/env python3
"""
generate_contact_sheet.py — Brightness × UnsharpMask 比較コンタクトシート。

本番 batch（process_figma_slices.py）の前に、代表1枚で補正パラメータを目視確認する。

Usage:
  py -3.14 scripts/generate_contact_sheet.py scrolls/my-scroll/
  py -3.14 scripts/generate_contact_sheet.py scrolls/my-scroll/ \\
    --input-file scrolls/my-scroll/images/_raw/slice_03.png \\
    --brightness 1.00,1.05,1.10 --sharpen 0,120,150
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

from scroll_image_utils import IMAGE_EXTENSIONS

REPO_ROOT = Path(__file__).resolve().parent.parent
TARGET_HEIGHT = 1080
UNSHARP_RADIUS = 1.5
UNSHARP_THRESHOLD = 3
DEFAULT_BRIGHTNESS = [1.00, 1.03, 1.05, 1.06, 1.10]
DEFAULT_SHARPEN = [0, 100, 130, 160]
DEFAULT_MARK = (1.05, 130)  # process_figma_slices defaults
SKIP_NAMES = frozenset({"contact_sheet.jpg", "contact_sheet.jpeg", "preview.jpg", "preview.jpeg"})
LABEL_BAR = 28
AXIS_BAR = 36
GAP = 8
PAD = 16


def resolve_scroll_dir(arg: str) -> Path:
    path = Path(arg)
    if not path.is_absolute():
        path = REPO_ROOT / path
    if path.name == "scroll_config.yaml":
        path = path.parent
    if not path.is_dir():
        raise SystemExit(f"Scroll directory not found: {arg}")
    return path.resolve()


def resolve_path(arg: str | None) -> Path | None:
    if not arg:
        return None
    path = Path(arg)
    if not path.is_absolute():
        path = REPO_ROOT / path
    return path.resolve()


def parse_floats(raw: str) -> list[float]:
    values = [float(part.strip()) for part in raw.split(",") if part.strip()]
    if not values:
        raise SystemExit(f"Empty float list: {raw!r}")
    return values


def parse_ints(raw: str) -> list[int]:
    values = [int(part.strip()) for part in raw.split(",") if part.strip()]
    if not values:
        raise SystemExit(f"Empty int list: {raw!r}")
    return values


def collect_raw_images(input_dir: Path) -> list[Path]:
    if not input_dir.is_dir():
        raise SystemExit(f"Input directory not found: {input_dir}")
    files = [
        p
        for p in input_dir.iterdir()
        if p.is_file()
        and p.suffix.lower() in IMAGE_EXTENSIONS
        and p.name.lower() not in SKIP_NAMES
    ]
    files.sort(key=lambda p: p.name.lower())
    if not files:
        raise SystemExit(f"No images found in {input_dir}")
    return files


def load_font(size: int) -> ImageFont.ImageFont | ImageFont.FreeTypeFont:
    candidates = [
        Path(r"C:\Windows\Fonts\meiryo.ttc"),
        Path(r"C:\Windows\Fonts\msgothic.ttc"),
        Path(r"C:\Windows\Fonts\arial.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        Path("/System/Library/Fonts/Helvetica.ttc"),
    ]
    for path in candidates:
        if path.is_file():
            try:
                return ImageFont.truetype(str(path), size=size)
            except OSError:
                continue
    return ImageFont.load_default()


def resize_to_height(img: Image.Image, height: int = TARGET_HEIGHT) -> Image.Image:
    w, h = img.size
    if h <= 0:
        raise SystemExit("Invalid image height")
    new_w = max(1, round(w * (height / h)))
    return img.resize((new_w, height), Image.Resampling.LANCZOS)


def apply_correction(img: Image.Image, brightness: float, sharpen_percent: int) -> Image.Image:
    out = ImageEnhance.Brightness(img).enhance(brightness)
    if sharpen_percent > 0:
        out = out.filter(
            ImageFilter.UnsharpMask(
                radius=UNSHARP_RADIUS,
                percent=sharpen_percent,
                threshold=UNSHARP_THRESHOLD,
            )
        )
    return out


def fit_width(img: Image.Image, cell_width: int) -> Image.Image:
    w, h = img.size
    if w <= cell_width:
        return img.copy()
    new_h = max(1, round(h * (cell_width / w)))
    return img.resize((cell_width, new_h), Image.Resampling.LANCZOS)


def center_crop(img: Image.Image, size: int) -> Image.Image:
    w, h = img.size
    side = min(size, w, h)
    left = max(0, (w - side) // 2)
    top = max(0, (h - side) // 2)
    crop = img.crop((left, top, left + side, top + side))
    if side != size:
        crop = crop.resize((size, size), Image.Resampling.LANCZOS)
    return crop


def draw_label(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    text: str,
    font: ImageFont.ImageFont | ImageFont.FreeTypeFont,
    *,
    highlight: bool,
) -> None:
    x0, y0, x1, y1 = box
    bar_bottom = min(y1, y0 + LABEL_BAR)
    fill = (180, 40, 40, 210) if highlight else (0, 0, 0, 180)
    draw.rectangle((x0, y0, x1, bar_bottom), fill=fill)
    draw.text((x0 + 6, y0 + 5), text, fill=(255, 255, 255), font=font)
    outline = (220, 50, 50) if highlight else (60, 60, 60)
    draw.rectangle((x0, y0, x1 - 1, y1 - 1), outline=outline, width=2 if highlight else 1)


def build_section(
    base: Image.Image,
    brightness_values: list[float],
    sharpen_values: list[int],
    *,
    mode: str,
    cell_width: int,
    crop_size: int,
    font: ImageFont.ImageFont | ImageFont.FreeTypeFont,
    header_font: ImageFont.ImageFont | ImageFont.FreeTypeFont,
    mark: tuple[float, int],
) -> Image.Image:
    rows = len(brightness_values)
    cols = len(sharpen_values)

    sample_cells: list[list[Image.Image]] = []
    for b in brightness_values:
        row_imgs: list[Image.Image] = []
        for s in sharpen_values:
            corrected = apply_correction(base, b, s)
            if mode == "full":
                cell = fit_width(corrected, cell_width)
            else:
                cell = center_crop(corrected, crop_size)
            row_imgs.append(cell)
        sample_cells.append(row_imgs)

    cell_h = max(im.size[1] for row in sample_cells for im in row)
    cell_w = max(im.size[0] for row in sample_cells for im in row)

    title = "Full width (scaled)" if mode == "full" else f"Center crop {crop_size}px (1:1 area)"
    grid_w = AXIS_BAR + cols * cell_w + (cols - 1) * GAP
    grid_h = AXIS_BAR + rows * (cell_h + LABEL_BAR) + (rows - 1) * GAP
    sheet = Image.new("RGB", (PAD * 2 + grid_w, PAD * 2 + AXIS_BAR + grid_h), (245, 245, 242))
    draw = ImageDraw.Draw(sheet, "RGBA")
    draw.text((PAD, PAD), title, fill=(30, 30, 30), font=header_font)

    origin_x = PAD + AXIS_BAR
    origin_y = PAD + AXIS_BAR + AXIS_BAR

    for col, s in enumerate(sharpen_values):
        label = f"S:{s}%"
        tx = origin_x + col * (cell_w + GAP) + 4
        draw.text((tx, origin_y - AXIS_BAR + 8), label, fill=(40, 40, 40), font=font)

    for row, b in enumerate(brightness_values):
        for col, s in enumerate(sharpen_values):
            cell = sample_cells[row][col]
            x = origin_x + col * (cell_w + GAP)
            y = origin_y + row * (cell_h + LABEL_BAR + GAP)
            # letterbox cell into fixed slot
            paste_x = x + (cell_w - cell.size[0]) // 2
            paste_y = y + LABEL_BAR + (cell_h - cell.size[1]) // 2
            sheet.paste(cell, (paste_x, paste_y))
            highlight = abs(b - mark[0]) < 1e-6 and s == mark[1]
            label = f"B:{b:.2f} / S:{s}%"
            if highlight:
                label += " *"
            draw_label(
                draw,
                (x, y, x + cell_w, y + LABEL_BAR + cell_h),
                label,
                font,
                highlight=highlight,
            )
        by = origin_y + row * (cell_h + LABEL_BAR + GAP) + LABEL_BAR + cell_h // 2 - 8
        draw.text((PAD, by), f"B:{b:.2f}", fill=(40, 40, 40), font=font)

    return sheet.convert("RGB")


def stack_vertically(images: list[Image.Image], gap: int = 24) -> Image.Image:
    width = max(im.size[0] for im in images)
    height = sum(im.size[1] for im in images) + gap * (len(images) - 1)
    out = Image.new("RGB", (width, height), (245, 245, 242))
    y = 0
    for im in images:
        out.paste(im, ((width - im.size[0]) // 2, y))
        y += im.size[1] + gap
    return out


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Generate Brightness × UnsharpMask contact sheet for one sample slice"
    )
    parser.add_argument("scroll_path", help="scrolls/{scroll_id}/ or path to scroll_config.yaml")
    parser.add_argument(
        "--input-dir",
        default=None,
        help="Raw export dir (default: scrolls/{id}/images/_raw)",
    )
    parser.add_argument(
        "--input-file",
        "--sample",
        dest="input_file",
        default=None,
        help="Sample image path (default: first image in input-dir)",
    )
    parser.add_argument(
        "--brightness",
        default=",".join(str(v) for v in DEFAULT_BRIGHTNESS),
        help="Comma-separated brightness values",
    )
    parser.add_argument(
        "--sharpen",
        default=",".join(str(v) for v in DEFAULT_SHARPEN),
        help="Comma-separated UnsharpMask percent values (0 = none)",
    )
    parser.add_argument("--cell-width", type=int, default=420, help="Full-view cell width")
    parser.add_argument("--crop-size", type=int, default=420, help="Center crop size in px")
    parser.add_argument(
        "--output",
        default=None,
        help="Output path (default: images/_raw/contact_sheet.jpg)",
    )
    parser.add_argument(
        "--mark-brightness",
        type=float,
        default=DEFAULT_MARK[0],
        help="Highlight brightness matching production default",
    )
    parser.add_argument(
        "--mark-sharpen",
        type=int,
        default=DEFAULT_MARK[1],
        help="Highlight sharpen percent matching production default",
    )
    args = parser.parse_args(argv)

    scroll_dir = resolve_scroll_dir(args.scroll_path)
    scroll_id = scroll_dir.name
    input_dir = resolve_path(args.input_dir) or (scroll_dir / "images" / "_raw")
    sample = resolve_path(args.input_file)
    if sample is None:
        sample = collect_raw_images(input_dir)[0]
    elif not sample.is_file():
        raise SystemExit(f"Sample image not found: {sample}")

    output = resolve_path(args.output) or (input_dir / "contact_sheet.jpg")
    brightness_values = parse_floats(args.brightness)
    sharpen_values = parse_ints(args.sharpen)
    mark = (args.mark_brightness, args.mark_sharpen)

    print(f"\n=== generate_contact_sheet: {scroll_id} ===")
    print(f"  sample: {sample}")
    print(f"  B: {brightness_values}")
    print(f"  S: {sharpen_values}")
    print(f"  mark:  B={mark[0]} S={mark[1]}%")

    with Image.open(sample) as opened:
        base = resize_to_height(opened.convert("RGB"))

    font = load_font(14)
    header_font = load_font(18)
    full = build_section(
        base,
        brightness_values,
        sharpen_values,
        mode="full",
        cell_width=args.cell_width,
        crop_size=args.crop_size,
        font=font,
        header_font=header_font,
        mark=mark,
    )
    crop = build_section(
        base,
        brightness_values,
        sharpen_values,
        mode="crop",
        cell_width=args.cell_width,
        crop_size=args.crop_size,
        font=font,
        header_font=header_font,
        mark=mark,
    )
    sheet = stack_vertically([full, crop])

    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, format="JPEG", quality=90, optimize=True)
    print(f"  wrote: {output} ({output.stat().st_size / 1024:.0f} KB, {sheet.size[0]}x{sheet.size[1]})")
    print("Next: pick B/S, then run process_figma_slices.py with --brightness / --sharpen")
    return 0


if __name__ == "__main__":
    sys.exit(main())
