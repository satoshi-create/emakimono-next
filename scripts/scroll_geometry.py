#!/usr/bin/env python3
"""geometry.yaml helpers: trim/cut proposal, preview, slice export (Figma-free path)."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml
from PIL import Image, ImageDraw, ImageOps

# Large panorama scans exceed Pillow's default decompression bomb limit.
Image.MAX_IMAGE_PIXELS = 500_000_000

GEOMETRY_VERSION = 1
GEOMETRY_REL = Path("sources") / "geometry.yaml"
PANORAMA_REL = Path("sources") / "panorama.jpg"
TILES_DIR_REL = Path("sources") / "tiles"
DEFAULT_ORDER = "rtl"
DEFAULT_STITCH = "horizontal-rtl"  # tiles list = 巻頭→巻末; first tile lands on the right
STITCH_LTR = "horizontal"
STITCH_RTL = "horizontal-rtl"
DEFAULT_TARGET_ASPECT = 1.4  # width/height ≈ mid of 1200–1800 @ 1080h
MIN_ASPECT = 1.05
MAX_ASPECT = 1.85
ANALYSIS_HEIGHT = 96
MARGIN_LUMA = 245
MARGIN_CONTENT_RATIO = 0.02
# NDL-style page overlap search (fraction of min tile width).
# Skip tiny widths: paper grain / ノド影が 50–80px で誤検出されやすい。
OVERLAP_SEARCH_MIN_FRAC = 0.15
OVERLAP_SEARCH_MAX_FRAC = 0.55
OVERLAP_ANALYSIS_HEIGHT = 64
OVERLAP_STRIP_STEP = 1
Y_OFFSET_SEARCH_MAX = 80  # ± max |dy| when auto-estimating
Y_OFFSET_SEARCH_STEP = 2


@dataclass(frozen=True)
class TrimBox:
    x: int
    y: int
    width: int
    height: int

    def as_dict(self) -> dict[str, int]:
        return {"x": self.x, "y": self.y, "width": self.width, "height": self.height}

    def right(self) -> int:
        return self.x + self.width

    def bottom(self) -> int:
        return self.y + self.height


@dataclass(frozen=True)
class Segment:
    index: int
    x0: int
    x1: int
    y0: int
    y1: int

    @property
    def width(self) -> int:
        return self.x1 - self.x0

    @property
    def height(self) -> int:
        return self.y1 - self.y0


def resolve_scroll_dir(arg: str | Path, repo_root: Path) -> Path:
    path = Path(arg)
    if not path.is_absolute():
        path = repo_root / path
    if path.name == "scroll_config.yaml":
        path = path.parent
    if not path.is_dir():
        raise SystemExit(f"Scroll directory not found: {arg}")
    return path.resolve()


def geometry_path(scroll_dir: Path) -> Path:
    return scroll_dir / GEOMETRY_REL


def empty_geometry(
    *,
    panorama: str | None = None,
    tiles: list[str] | None = None,
) -> dict[str, Any]:
    data: dict[str, Any] = {
        "version": GEOMETRY_VERSION,
        "status": "draft",
        "order": DEFAULT_ORDER,
        "trim": {"x": 0, "y": 0, "width": 0, "height": 0},
        "cuts": [],
        "notes": "",
    }
    if panorama:
        data["panorama"] = panorama
    if tiles:
        data["tiles"] = tiles
        data["stitch"] = DEFAULT_STITCH
    return data


def normalize_stitch(value: Any) -> str:
    raw = str(value or DEFAULT_STITCH).lower().strip()
    aliases = {
        "horizontal": STITCH_LTR,
        "horizontal-ltr": STITCH_LTR,
        "ltr": STITCH_LTR,
        "horizontal-rtl": STITCH_RTL,
        "rtl": STITCH_RTL,
    }
    if raw not in aliases:
        raise SystemExit(
            f"stitch must be {STITCH_LTR}|{STITCH_RTL} (aliases: ltr|rtl), got {value!r}"
        )
    return aliases[raw]


def tiles_in_paste_order(tile_paths: list[Path], stitch: str) -> list[Path]:
    """Return paths in left→right paste order.

    horizontal-rtl: tiles list is 巻頭→巻末 (NDL ascending); reverse so 巻頭 is on the right.
    horizontal: paste list as-is (left = first).
    """
    mode = normalize_stitch(stitch)
    if mode == STITCH_RTL:
        return list(reversed(tile_paths))
    return list(tile_paths)


def load_geometry(path: Path) -> dict[str, Any]:
    if not path.is_file():
        raise SystemExit(f"geometry.yaml not found: {path}")
    with path.open(encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
    if not isinstance(data, dict):
        raise SystemExit(f"Invalid geometry.yaml (not a mapping): {path}")
    return data


def save_geometry(path: Path, data: dict[str, Any], *, dry_run: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = yaml.safe_dump(
        data,
        allow_unicode=True,
        sort_keys=False,
        default_flow_style=False,
    )
    if dry_run:
        print(f"  [dry-run] Would write {path}")
        return
    path.write_text(text, encoding="utf-8")


def parse_trim(data: dict[str, Any]) -> TrimBox:
    raw = data.get("trim") or {}
    try:
        box = TrimBox(
            x=int(raw["x"]),
            y=int(raw["y"]),
            width=int(raw["width"]),
            height=int(raw["height"]),
        )
    except (KeyError, TypeError, ValueError) as exc:
        raise SystemExit(f"Invalid trim in geometry.yaml: {exc}") from exc
    if box.width <= 0 or box.height <= 0:
        raise SystemExit("trim.width / trim.height must be positive")
    return box


def parse_cuts(data: dict[str, Any]) -> list[int]:
    raw = data.get("cuts") or []
    if not isinstance(raw, list):
        raise SystemExit("cuts must be a list of x coordinates")
    cuts = sorted({int(v) for v in raw})
    return cuts


def validate_geometry(data: dict[str, Any], *, panorama_size: tuple[int, int] | None = None) -> list[str]:
    """Return list of error messages (empty = OK)."""
    errors: list[str] = []
    order = str(data.get("order") or DEFAULT_ORDER).lower()
    if order not in ("rtl", "ltr"):
        errors.append(f"order must be rtl|ltr, got {order!r}")
    try:
        normalize_stitch(data.get("stitch"))
    except SystemExit as exc:
        errors.append(str(exc))
    status = str(data.get("status") or "draft").lower()
    if status not in ("draft", "reviewed"):
        errors.append(f"status must be draft|reviewed, got {status!r}")
    try:
        trim = parse_trim(data)
        cuts = parse_cuts(data)
    except SystemExit as exc:
        errors.append(str(exc))
        return errors

    if panorama_size:
        pw, ph = panorama_size
        if trim.x < 0 or trim.y < 0 or trim.right() > pw or trim.bottom() > ph:
            errors.append(
                f"trim {trim.as_dict()} exceeds panorama {pw}x{ph}"
            )
    for cut in cuts:
        if cut <= trim.x or cut >= trim.right():
            errors.append(f"cut x={cut} must be strictly inside trim x-range")
    return errors


def segments_from_geometry(data: dict[str, Any]) -> list[Segment]:
    trim = parse_trim(data)
    cuts = parse_cuts(data)
    edges = [trim.x, *cuts, trim.right()]
    ltr_parts: list[tuple[int, int]] = []
    for i in range(len(edges) - 1):
        x0, x1 = edges[i], edges[i + 1]
        if x1 - x0 < 1:
            raise SystemExit(f"Zero-width segment between x={x0} and x={x1}")
        ltr_parts.append((x0, x1))

    order = str(data.get("order") or DEFAULT_ORDER).lower()
    ordered = list(reversed(ltr_parts)) if order == "rtl" else ltr_parts
    return [
        Segment(index=i, x0=x0, x1=x1, y0=trim.y, y1=trim.bottom())
        for i, (x0, x1) in enumerate(ordered, start=1)
    ]


def _rel_to_scroll(scroll_dir: Path, rel: str | Path) -> Path:
    path = Path(rel)
    if path.is_absolute():
        return path
    return (scroll_dir / path).resolve()


def list_tile_paths(scroll_dir: Path, data: dict[str, Any] | None = None) -> list[Path]:
    if data and data.get("tiles"):
        return [_rel_to_scroll(scroll_dir, p) for p in data["tiles"]]
    tiles_dir = scroll_dir / TILES_DIR_REL
    if not tiles_dir.is_dir():
        return []
    files = [
        p
        for p in tiles_dir.iterdir()
        if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"}
    ]
    return sorted(files, key=lambda p: p.name.lower())


def resolve_panorama_path(scroll_dir: Path, data: dict[str, Any]) -> Path | None:
    if data.get("panorama"):
        return _rel_to_scroll(scroll_dir, data["panorama"])
    candidate = scroll_dir / PANORAMA_REL
    return candidate if candidate.is_file() else None


def parse_tile_overlaps(data: dict[str, Any], *, n_tiles: int) -> list[int]:
    """Overlaps between consecutive tiles in reading order. Length n_tiles-1."""
    raw = data.get("tile_overlaps")
    if raw is None:
        return [0] * max(0, n_tiles - 1)
    if not isinstance(raw, list):
        raise SystemExit("tile_overlaps must be a list of ints")
    if n_tiles <= 1:
        return []
    if len(raw) != n_tiles - 1:
        raise SystemExit(
            f"tile_overlaps length must be {n_tiles - 1} (n_tiles-1), got {len(raw)}"
        )
    overlaps: list[int] = []
    for i, value in enumerate(raw):
        try:
            ov = int(value)
        except (TypeError, ValueError) as exc:
            raise SystemExit(f"tile_overlaps[{i}] must be int: {exc}") from exc
        if ov < 0:
            raise SystemExit(f"tile_overlaps[{i}] must be >= 0")
        overlaps.append(ov)
    return overlaps


def parse_tile_y_offsets(data: dict[str, Any], *, n_tiles: int) -> list[int]:
    """Vertical shifts between consecutive tiles in reading order. Length n_tiles-1.

    Applied to the incoming (right-hand) tile in canvas paste order:
    positive = shift that tile downward relative to its left neighbor.
    """
    raw = data.get("tile_y_offsets")
    if raw is None:
        return [0] * max(0, n_tiles - 1)
    if not isinstance(raw, list):
        raise SystemExit("tile_y_offsets must be a list of ints")
    if n_tiles <= 1:
        return []
    if len(raw) != n_tiles - 1:
        raise SystemExit(
            f"tile_y_offsets length must be {n_tiles - 1} (n_tiles-1), got {len(raw)}"
        )
    offsets: list[int] = []
    for i, value in enumerate(raw):
        try:
            offsets.append(int(value))
        except (TypeError, ValueError) as exc:
            raise SystemExit(f"tile_y_offsets[{i}] must be int: {exc}") from exc
    return offsets


def reading_pair_value_for_paste(
    values: list[int],
    *,
    reading_paths: list[Path],
    left_path: Path,
    right_path: Path,
) -> int:
    """Map a paste-adjacent (left,right) pair to reading-order list value."""
    try:
        i_left = reading_paths.index(left_path)
        i_right = reading_paths.index(right_path)
    except ValueError as exc:
        raise SystemExit(f"tile path not in reading list: {exc}") from exc
    if abs(i_left - i_right) != 1:
        raise SystemExit(
            f"paste pair not adjacent in reading order: {left_path.name} / {right_path.name}"
        )
    return values[min(i_left, i_right)]


def _ncc_gray(a: Image.Image, b: Image.Image) -> float:
    """Normalized cross-correlation in [−1, 1]. Higher is better."""
    if a.size != b.size:
        raise ValueError("size mismatch")
    pa = a.load()
    pb = b.load()
    assert pa is not None and pb is not None
    w, h = a.size
    n = w * h
    if n < 1:
        return -1.0
    sa = sb = 0.0
    for y in range(h):
        for x in range(w):
            sa += pa[x, y]
            sb += pb[x, y]
    ma, mb = sa / n, sb / n
    num = va = vb = 0.0
    for y in range(h):
        for x in range(w):
            da = pa[x, y] - ma
            db = pb[x, y] - mb
            num += da * db
            va += da * da
            vb += db * db
    denom = (va * vb) ** 0.5
    if denom < 1e-6:
        return -1.0
    return num / denom


def overlap_index_for_paste_seam(seam_index: int, n_tiles: int, stitch: str) -> int:
    """Map left→right seam index to reading-order tile_overlaps index."""
    if n_tiles < 2 or seam_index < 0 or seam_index >= n_tiles - 1:
        raise SystemExit(f"seam_index {seam_index} out of range for {n_tiles} tiles")
    if normalize_stitch(stitch) == STITCH_RTL:
        return n_tiles - 2 - seam_index
    return seam_index


def estimate_overlap_pixels(
    left: Image.Image,
    right: Image.Image,
    *,
    min_frac: float = OVERLAP_SEARCH_MIN_FRAC,
    max_frac: float = OVERLAP_SEARCH_MAX_FRAC,
) -> int:
    """Find overlap o where left's right edge matches right's left edge (paste L→R)."""
    if left.height != right.height:
        scale = left.height / right.height
        right = right.resize(
            (max(1, round(right.width * scale)), left.height),
            Image.Resampling.LANCZOS,
        )
    h = left.height
    max_o = min(left.width, right.width) - 1
    if max_o < 8:
        return 0
    lo = max(4, int(min(left.width, right.width) * min_frac))
    hi = min(max_o, int(min(left.width, right.width) * max_frac))
    if lo > hi:
        return 0

    th = OVERLAP_ANALYSIS_HEIGHT
    scale = th / h
    lw = max(1, int(left.width * scale))
    rw = max(1, int(right.width * scale))
    left_s = left.resize((lw, th), Image.Resampling.BILINEAR).convert("L")
    right_s = right.resize((rw, th), Image.Resampling.BILINEAR).convert("L")
    lo_s = max(2, int(lo * scale))
    hi_s = min(min(lw, rw) - 1, max(lo_s, int(hi * scale)))

    scored: list[tuple[float, int]] = []
    for o_s in range(lo_s, hi_s + 1, OVERLAP_STRIP_STEP):
        a = left_s.crop((lw - o_s, 0, lw, th))
        b = right_s.crop((0, 0, o_s, th))
        scored.append((_ncc_gray(a, b), o_s))
    if not scored:
        return lo

    best_ncc = max(item[0] for item in scored)
    # Prefer the larger overlap among near-best scores (avoid ノドの薄い一致).
    near = [o for ncc, o in scored if ncc >= best_ncc - 0.03]
    best_o_s = max(near)

    overlap = int(round(best_o_s / scale))
    return max(0, min(overlap, max_o))


def reading_overlap_for_paste_pair(
    overlaps: list[int],
    *,
    reading_paths: list[Path],
    left_path: Path,
    right_path: Path,
) -> int:
    return reading_pair_value_for_paste(
        overlaps,
        reading_paths=reading_paths,
        left_path=left_path,
        right_path=right_path,
    )


def estimate_y_offset_pixels(
    left: Image.Image,
    right: Image.Image,
    *,
    overlap: int,
    max_dy: int = Y_OFFSET_SEARCH_MAX,
) -> int:
    """Find dy that best aligns right's left strip to left's right strip.

    Positive dy = shift right image downward relative to left.
    """
    if left.height != right.height:
        scale = left.height / right.height
        right = right.resize(
            (max(1, round(right.width * scale)), left.height),
            Image.Resampling.LANCZOS,
        )
    o = max(8, min(overlap, left.width - 1, right.width - 1))
    if o < 8:
        return 0

    th = OVERLAP_ANALYSIS_HEIGHT
    scale = th / left.height
    strip_w = max(4, int(o * scale))
    lw = max(1, int(left.width * scale))
    rw = max(1, int(right.width * scale))
    left_s = left.resize((lw, th), Image.Resampling.BILINEAR).convert("L")
    right_s = right.resize((rw, th), Image.Resampling.BILINEAR).convert("L")
    max_dy_s = max(1, int(max_dy * scale))
    step = max(1, int(Y_OFFSET_SEARCH_STEP * scale))

    best_dy_s = 0
    best_ncc = -2.0
    for dy_s in range(-max_dy_s, max_dy_s + 1, step):
        # Common vertical range after shift
        if dy_s >= 0:
            y0_l, y1_l = 0, th - dy_s
            y0_r, y1_r = dy_s, th
        else:
            y0_l, y1_l = -dy_s, th
            y0_r, y1_r = 0, th + dy_s
        if y1_l - y0_l < 8:
            continue
        a = left_s.crop((lw - strip_w, y0_l, lw, y1_l))
        b = right_s.crop((0, y0_r, strip_w, y1_r))
        if a.size != b.size:
            continue
        ncc = _ncc_gray(a, b)
        if ncc > best_ncc:
            best_ncc = ncc
            best_dy_s = dy_s

    return int(round(best_dy_s / scale))


def estimate_tile_joins(
    tile_paths: list[Path],
    *,
    stitch: str = DEFAULT_STITCH,
) -> tuple[list[int], list[int]]:
    """Estimate (overlaps, y_offsets) for consecutive tiles in reading order."""
    if len(tile_paths) < 2:
        return [], []
    mode = normalize_stitch(stitch)
    images: list[Image.Image] = []
    target_h: int | None = None
    for path in tile_paths:
        img = Image.open(path)
        img = ImageOps.exif_transpose(img)
        if img.mode != "RGB":
            img = img.convert("RGB")
        if target_h is None:
            target_h = img.height
        elif img.height != target_h:
            new_w = max(1, round(img.width * (target_h / img.height)))
            img = img.resize((new_w, target_h), Image.Resampling.LANCZOS)
        images.append(img)

    overlaps: list[int] = []
    y_offsets: list[int] = []
    for i in range(len(images) - 1):
        if mode == STITCH_RTL:
            left, right = images[i + 1], images[i]
        else:
            left, right = images[i], images[i + 1]
        ov = estimate_overlap_pixels(left, right)
        dy = estimate_y_offset_pixels(left, right, overlap=ov)
        overlaps.append(ov)
        y_offsets.append(dy)
        print(f"  join tiles[{i}]–[{i+1}]: overlap={ov}px y={dy:+d}px (est.)")

    for img in images:
        img.close()
    return overlaps, y_offsets


def estimate_tile_overlaps(
    tile_paths: list[Path],
    *,
    stitch: str = DEFAULT_STITCH,
) -> list[int]:
    overlaps, _y = estimate_tile_joins(tile_paths, stitch=stitch)
    return overlaps


def stitch_tiles_horizontal(
    tile_paths: list[Path],
    dest: Path,
    *,
    stitch: str = DEFAULT_STITCH,
    overlaps_reading: list[int] | None = None,
    y_offsets_reading: list[int] | None = None,
    dry_run: bool = False,
) -> tuple[int, int, list[int]]:
    """Stitch tiles. Returns (width, height, seam_x_positions in panorama)."""
    if not tile_paths:
        raise SystemExit("No tiles to stitch")
    reading_paths = list(tile_paths)
    paste_paths = tiles_in_paste_order(tile_paths, stitch)
    mode = normalize_stitch(stitch)
    n_pair = max(0, len(tile_paths) - 1)
    overlaps = overlaps_reading if overlaps_reading is not None else [0] * n_pair
    y_offsets = y_offsets_reading if y_offsets_reading is not None else [0] * n_pair
    if len(overlaps) != n_pair:
        raise SystemExit(f"overlaps length {len(overlaps)} != n_tiles-1 ({n_pair})")
    if len(y_offsets) != n_pair:
        raise SystemExit(f"y_offsets length {len(y_offsets)} != n_tiles-1 ({n_pair})")

    images: list[Image.Image] = []
    target_h: int | None = None
    for path in paste_paths:
        if not path.is_file():
            raise SystemExit(f"Tile not found: {path}")
        img = Image.open(path)
        img = ImageOps.exif_transpose(img)
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        elif img.mode == "L":
            img = img.convert("RGB")
        if target_h is None:
            target_h = img.height
        elif img.height != target_h:
            new_w = max(1, round(img.width * (target_h / img.height)))
            img = img.resize((new_w, target_h), Image.Resampling.LANCZOS)
        images.append(img)

    assert target_h is not None

    cropped: list[Image.Image] = []
    paste_ys: list[int] = []
    seam_xs: list[int] = []
    x_cursor = 0
    y_cursor = 0
    for i, (path, im) in enumerate(zip(paste_paths, images, strict=True)):
        crop_left = 0
        dy = 0
        if i > 0:
            crop_left = reading_pair_value_for_paste(
                overlaps,
                reading_paths=reading_paths,
                left_path=paste_paths[i - 1],
                right_path=path,
            )
            crop_left = min(crop_left, im.width - 1)
            dy = reading_pair_value_for_paste(
                y_offsets,
                reading_paths=reading_paths,
                left_path=paste_paths[i - 1],
                right_path=path,
            )
            y_cursor = paste_ys[i - 1] + dy
        if crop_left > 0:
            piece = im.crop((crop_left, 0, im.width, im.height))
        else:
            piece = im.copy()
        if i > 0:
            seam_xs.append(x_cursor)
        cropped.append(piece)
        paste_ys.append(y_cursor)
        x_cursor += piece.width

    y_min = min(paste_ys)
    paste_ys = [y - y_min for y in paste_ys]
    total_w = sum(im.width for im in cropped)
    total_h = max(y + im.height for y, im in zip(paste_ys, cropped, strict=True))

    if dry_run:
        print(
            f"  [dry-run] Would stitch ({mode}) → {total_w}x{total_h} "
            f"overlaps={overlaps} y={y_offsets} {dest}"
        )
        for im in images:
            im.close()
        for piece in cropped:
            piece.close()
        return total_w, total_h, seam_xs

    # Paper-like fill from first tile corner
    fill = cropped[0].getpixel((0, 0))
    canvas = Image.new("RGB", (total_w, total_h), fill)
    x = 0
    for piece, y in zip(cropped, paste_ys, strict=True):
        canvas.paste(piece, (x, y))
        x += piece.width
        piece.close()
    for im in images:
        im.close()
    dest.parent.mkdir(parents=True, exist_ok=True)
    suffix = dest.suffix.lower()
    if suffix in {".jpg", ".jpeg"}:
        canvas.save(dest, format="JPEG", quality=95, optimize=True)
    else:
        canvas.save(dest)
    canvas.close()
    return total_w, total_h, seam_xs


def ensure_panorama(
    scroll_dir: Path,
    data: dict[str, Any],
    *,
    dry_run: bool = False,
    restitch: bool = False,
    estimate_overlaps: bool = False,
) -> Path:
    """Return panorama path; stitch tiles when panorama is missing or restitch=True."""
    existing = resolve_panorama_path(scroll_dir, data)
    tiles = list_tile_paths(scroll_dir, data)
    stitch = normalize_stitch(data.get("stitch") or DEFAULT_STITCH)
    data["stitch"] = stitch

    if existing and existing.is_file() and not restitch:
        attach_tile_seams(scroll_dir, data)
        return existing

    if not tiles:
        if existing and existing.is_file():
            return existing
        raise SystemExit(
            "No panorama or tiles found. Place sources/panorama.jpg "
            "or sources/tiles/* then re-run propose."
        )

    if estimate_overlaps or data.get("tile_overlaps") is None:
        print("  estimating tile joins (overlap + y)…")
        ov, dy = estimate_tile_joins(tiles, stitch=stitch)
        data["tile_overlaps"] = ov
        if data.get("tile_y_offsets") is None or estimate_overlaps:
            data["tile_y_offsets"] = dy
    overlaps = parse_tile_overlaps(data, n_tiles=len(tiles))
    y_offsets = parse_tile_y_offsets(data, n_tiles=len(tiles))
    data["tile_overlaps"] = overlaps
    data["tile_y_offsets"] = y_offsets

    dest = scroll_dir / PANORAMA_REL
    paste_preview = " → ".join(p.name for p in tiles_in_paste_order(tiles, stitch))
    print(f"  stitch {len(tiles)} tile(s) [{stitch}] L→R: {paste_preview}")
    print(f"  tile_overlaps (reading order): {overlaps}")
    print(f"  tile_y_offsets (reading order): {y_offsets}")
    print(f"    → {dest.relative_to(scroll_dir)}")
    _w, _h, seam_xs = stitch_tiles_horizontal(
        tiles,
        dest,
        stitch=stitch,
        overlaps_reading=overlaps,
        y_offsets_reading=y_offsets,
        dry_run=dry_run,
    )
    data["panorama"] = PANORAMA_REL.as_posix()
    data["tiles"] = [
        (p.relative_to(scroll_dir)).as_posix() if p.is_relative_to(scroll_dir) else str(p)
        for p in tiles
    ]
    data["meta"] = dict(data.get("meta") or {})
    data["meta"]["tile_seams_x"] = seam_xs
    data["meta"]["tile_y_offsets"] = y_offsets
    return dest


def compute_tile_seams_x(scroll_dir: Path, data: dict[str, Any]) -> list[int]:
    """Paste-order seam X without writing panorama. Empty if tiles missing."""
    tiles = list_tile_paths(scroll_dir, data)
    if len(tiles) < 2:
        return []
    stitch = normalize_stitch(data.get("stitch") or DEFAULT_STITCH)
    overlaps = parse_tile_overlaps(data, n_tiles=len(tiles))
    paste_paths = tiles_in_paste_order(tiles, stitch)
    widths: list[int] = []
    target_h: int | None = None
    for path in paste_paths:
        if not path.is_file():
            return []
        with Image.open(path) as img:
            img = ImageOps.exif_transpose(img)
            if target_h is None:
                target_h = img.height
                widths.append(img.width)
            elif img.height != target_h:
                widths.append(max(1, round(img.width * (target_h / img.height))))
            else:
                widths.append(img.width)
    seam_xs: list[int] = []
    x_cursor = 0
    for i, (path, width) in enumerate(zip(paste_paths, widths, strict=True)):
        crop_left = 0
        if i > 0:
            crop_left = reading_overlap_for_paste_pair(
                overlaps,
                reading_paths=tiles,
                left_path=paste_paths[i - 1],
                right_path=path,
            )
            crop_left = min(crop_left, width - 1)
            seam_xs.append(x_cursor)
        x_cursor += width - crop_left
    return seam_xs


def attach_tile_seams(scroll_dir: Path, data: dict[str, Any]) -> dict[str, Any]:
    """Ensure meta.tile_seams_x is present for the review UI."""
    meta = dict(data.get("meta") or {})
    seams = meta.get("tile_seams_x") or []
    if not seams:
        seams = compute_tile_seams_x(scroll_dir, data)
    meta["tile_seams_x"] = seams
    data["meta"] = meta
    return data


def open_panorama(path: Path) -> Image.Image:
    if not path.is_file():
        raise SystemExit(f"Panorama not found: {path}")
    img = Image.open(path)
    img = ImageOps.exif_transpose(img)
    if img.mode != "RGB":
        img = img.convert("RGB")
    return img


def propose_trim(img: Image.Image) -> TrimBox:
    """Content bbox via downscaled luma; ignores near-white margins."""
    w, h = img.size
    scale = ANALYSIS_HEIGHT / h
    small_w = max(1, int(w * scale))
    small = img.resize((small_w, ANALYSIS_HEIGHT), Image.Resampling.BILINEAR).convert("L")
    pixels = small.load()
    assert pixels is not None

    def col_content(x: int) -> bool:
        dark = 0
        for y in range(ANALYSIS_HEIGHT):
            if pixels[x, y] < MARGIN_LUMA:
                dark += 1
        return dark / ANALYSIS_HEIGHT >= MARGIN_CONTENT_RATIO

    def row_content(y: int) -> bool:
        dark = 0
        for x in range(small_w):
            if pixels[x, y] < MARGIN_LUMA:
                dark += 1
        return dark / small_w >= MARGIN_CONTENT_RATIO

    left = 0
    while left < small_w and not col_content(left):
        left += 1
    right = small_w - 1
    while right > left and not col_content(right):
        right -= 1
    top = 0
    while top < ANALYSIS_HEIGHT and not row_content(top):
        top += 1
    bottom = ANALYSIS_HEIGHT - 1
    while bottom > top and not row_content(bottom):
        bottom -= 1

    if left >= right or top >= bottom:
        return TrimBox(0, 0, w, h)

    # Map back + small pad
    pad = 2
    x0 = max(0, int(left / scale) - pad)
    y0 = max(0, int(top / scale) - pad)
    x1 = min(w, int((right + 1) / scale) + pad)
    y1 = min(h, int((bottom + 1) / scale) + pad)
    return TrimBox(x0, y0, max(1, x1 - x0), max(1, y1 - y0))


def _column_scores(img: Image.Image, trim: TrimBox) -> tuple[list[float], float]:
    """Lower score = better cut (low vertical variance / blankish)."""
    crop = img.crop((trim.x, trim.y, trim.right(), trim.bottom()))
    th = ANALYSIS_HEIGHT
    tw = max(1, int(crop.width * (th / crop.height)))
    small = crop.resize((tw, th), Image.Resampling.BILINEAR).convert("L")
    pixels = small.load()
    assert pixels is not None
    scores: list[float] = []
    for x in range(tw):
        vals = [pixels[x, y] for y in range(th)]
        mean = sum(vals) / th
        var = sum((v - mean) ** 2 for v in vals) / th
        # Prefer bright + low variance (paper / empty ground)
        scores.append(var + max(0.0, (200 - mean) * 2.0))
    return scores, crop.width / tw


def propose_cuts(
    img: Image.Image,
    trim: TrimBox,
    *,
    target_aspect: float = DEFAULT_TARGET_ASPECT,
    min_aspect: float = MIN_ASPECT,
    max_aspect: float = MAX_ASPECT,
) -> list[int]:
    if trim.width < 2 or trim.height < 2:
        return []

    target_w = max(1, int(trim.height * target_aspect))
    min_w = max(1, int(trim.height * min_aspect))
    max_w = max(min_w, int(trim.height * max_aspect))

    if trim.width <= max_w:
        return []

    scores, px_per = _column_scores(img, trim)
    n = len(scores)
    if n < 3:
        return []

    cuts: list[int] = []
    cursor = 0  # index in small coords from trim left
    while True:
        remaining_px = trim.width - (cursor * px_per)
        if remaining_px <= max_w:
            break
        ideal = cursor + target_w / px_per
        lo = cursor + min_w / px_per
        hi = cursor + max_w / px_per
        lo_i = max(cursor + 1, int(lo))
        hi_i = min(n - 2, int(hi))
        if lo_i > hi_i:
            # Force a cut near ideal if window collapsed
            lo_i = min(n - 2, max(cursor + 1, int(ideal)))
            hi_i = lo_i
        best_i = lo_i
        best_score = float("inf")
        for i in range(lo_i, hi_i + 1):
            # Prefer closer to ideal
            dist = abs(i - ideal) / max(1.0, (hi - lo) or 1.0)
            score = scores[i] * (1.0 + 0.35 * dist)
            if score < best_score:
                best_score = score
                best_i = i
        cut_x = trim.x + int(round(best_i * px_per))
        cut_x = min(max(cut_x, trim.x + min_w), trim.right() - min_w)
        if cuts and cut_x <= cuts[-1] + min_w // 2:
            break
        cuts.append(cut_x)
        cursor = best_i
        if len(cuts) > 200:
            break
    return cuts


def build_proposed_geometry(
    scroll_dir: Path,
    *,
    target_aspect: float = DEFAULT_TARGET_ASPECT,
    keep_existing_cuts: bool = False,
    existing: dict[str, Any] | None = None,
    dry_run: bool = False,
    restitch: bool = False,
    stitch: str | None = None,
    estimate_overlaps: bool = False,
    keep_overlaps: bool = False,
    tile_overlaps: list[int] | None = None,
    tile_y_offsets: list[int] | None = None,
) -> dict[str, Any]:
    data = dict(existing) if existing else empty_geometry()
    data["version"] = GEOMETRY_VERSION
    if "status" not in data:
        data["status"] = "draft"
    if "order" not in data:
        data["order"] = DEFAULT_ORDER
    if stitch is not None:
        data["stitch"] = normalize_stitch(stitch)
    elif not data.get("stitch"):
        data["stitch"] = DEFAULT_STITCH
    else:
        data["stitch"] = normalize_stitch(data["stitch"])

    if tile_overlaps is not None:
        data["tile_overlaps"] = tile_overlaps
    if tile_y_offsets is not None:
        data["tile_y_offsets"] = tile_y_offsets

    if keep_overlaps and existing:
        if tile_overlaps is None and existing.get("tile_overlaps") is not None:
            data["tile_overlaps"] = existing["tile_overlaps"]
        if tile_y_offsets is None and existing.get("tile_y_offsets") is not None:
            data["tile_y_offsets"] = existing["tile_y_offsets"]

    if tile_overlaps is not None or (
        keep_overlaps and existing and existing.get("tile_overlaps") is not None
    ):
        do_estimate = bool(estimate_overlaps)
    else:
        do_estimate = estimate_overlaps or data.get("tile_overlaps") is None

    panorama = ensure_panorama(
        scroll_dir,
        data,
        dry_run=dry_run,
        restitch=restitch,
        estimate_overlaps=do_estimate,
    )
    if dry_run and not panorama.is_file():
        # Stitch skipped; cannot propose further
        return data

    seam_xs = list((data.get("meta") or {}).get("tile_seams_x") or [])

    with open_panorama(panorama) as img:
        trim = propose_trim(img)
        data["trim"] = trim.as_dict()
        data["panorama"] = (
            panorama.relative_to(scroll_dir).as_posix()
            if panorama.is_relative_to(scroll_dir)
            else str(panorama)
        )
        if keep_existing_cuts and existing and existing.get("cuts") is not None:
            data["cuts"] = parse_cuts(existing)
        else:
            data["cuts"] = propose_cuts(img, trim, target_aspect=target_aspect)
        data["meta"] = {
            "panorama_width": img.width,
            "panorama_height": img.height,
            "segment_count": len(segments_from_geometry(data)),
            "target_aspect": target_aspect,
            "stitch": data["stitch"],
            "tile_seams_x": seam_xs,
            "tile_overlaps": list(data.get("tile_overlaps") or []),
            "tile_y_offsets": list(data.get("tile_y_offsets") or []),
        }
    return data


def render_preview(
    img: Image.Image,
    data: dict[str, Any],
    *,
    max_width: int = 3600,
) -> Image.Image:
    trim = parse_trim(data)
    cuts = parse_cuts(data)
    segments = segments_from_geometry(data)

    scale = min(1.0, max_width / img.width)
    pw = max(1, int(img.width * scale))
    ph = max(1, int(img.height * scale))
    base = img.resize((pw, ph), Image.Resampling.BILINEAR)
    draw = ImageDraw.Draw(base)

    def sx(x: int) -> int:
        return int(round(x * scale))

    def sy(y: int) -> int:
        return int(round(y * scale))

    # Dim outside trim
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    tx0, ty0, tx1, ty1 = sx(trim.x), sy(trim.y), sx(trim.right()), sy(trim.bottom())
    od.rectangle([0, 0, pw, ph], fill=(0, 0, 0, 110))
    od.rectangle([tx0, ty0, tx1, ty1], fill=(0, 0, 0, 0))
    base = Image.alpha_composite(base.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(base)
    draw.rectangle([tx0, ty0, tx1, ty1], outline=(0, 200, 255), width=max(2, int(3 * scale or 1)))

    for cut in cuts:
        cx = sx(cut)
        draw.line([(cx, ty0), (cx, ty1)], fill=(255, 64, 64), width=max(2, int(2 * scale or 1)))

    # Tile seam markers (after overlap crop) — lime
    for seam in (data.get("meta") or {}).get("tile_seams_x") or []:
        cx = sx(int(seam))
        draw.line([(cx, ty0), (cx, ty1)], fill=(80, 220, 80), width=max(2, int(2 * scale or 1)))

    for seg in segments:
        mx = sx((seg.x0 + seg.x1) // 2)
        my = sy(trim.y) + 12
        label = f"{seg.index:02d}"
        draw.rectangle([mx - 14, my - 2, mx + 14, my + 14], fill=(0, 0, 0))
        draw.text((mx - 10, my), label, fill=(255, 255, 0))

    return base


def export_slices(
    scroll_dir: Path,
    data: dict[str, Any],
    *,
    output_dir: Path | None = None,
    dry_run: bool = False,
    force: bool = False,
) -> list[Path]:
    errors = validate_geometry(data)
    if errors:
        raise SystemExit("Invalid geometry:\n  - " + "\n  - ".join(errors))

    panorama = resolve_panorama_path(scroll_dir, data)
    if not panorama or not panorama.is_file():
        raise SystemExit("panorama image missing; run propose first")

    out = output_dir or (scroll_dir / "images" / "_raw")
    out.mkdir(parents=True, exist_ok=True)
    segments = segments_from_geometry(data)
    written: list[Path] = []

    existing = sorted(out.glob("slice_*.jpg")) + sorted(out.glob("slice_*.png"))
    if existing and not force and not dry_run:
        raise SystemExit(
            f"{len(existing)} existing slice_* in {out}. Pass --force to overwrite."
        )

    with open_panorama(panorama) as img:
        pw, ph = img.size
        errs = validate_geometry(data, panorama_size=(pw, ph))
        if errs:
            raise SystemExit("Invalid geometry vs panorama:\n  - " + "\n  - ".join(errs))

        if not dry_run and force:
            for path in existing:
                path.unlink()

        for seg in segments:
            dest = out / f"slice_{seg.index:02d}.jpg"
            print(
                f"  [{seg.index:02d}] crop {seg.x0}:{seg.x1} x {seg.y0}:{seg.y1} "
                f"({seg.width}x{seg.height}) -> {dest.name}"
            )
            if dry_run:
                written.append(dest)
                continue
            crop = img.crop((seg.x0, seg.y0, seg.x1, seg.y1))
            crop.save(dest, format="JPEG", quality=92, optimize=True)
            crop.close()
            written.append(dest)
    return written
