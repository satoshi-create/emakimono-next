#!/usr/bin/env python3
"""Run: py -3.14 scripts/tests/test_scroll_geometry.py"""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

from PIL import Image, ImageDraw

SCRIPTS_DIR = Path(__file__).resolve().parent.parent
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from scroll_geometry import (  # noqa: E402
    TrimBox,
    build_proposed_geometry,
    empty_geometry,
    estimate_overlap_pixels,
    export_slices,
    overlap_index_for_paste_seam,
    parse_trim,
    propose_cuts,
    propose_trim,
    segments_from_geometry,
    stitch_tiles_horizontal,
    tiles_in_paste_order,
    validate_geometry,
)


def _make_panorama(path: Path, width: int = 4000, height: int = 800) -> None:
    """Paper-colored panorama with dark motif blocks (avoids mid cuts)."""
    img = Image.new("RGB", (width, height), (250, 245, 235))
    draw = ImageDraw.Draw(img)
    # Left/right/top/bottom margins
    # Content band
    draw.rectangle([80, 40, width - 80, height - 40], fill=(240, 230, 210))
    # Dark motifs that should not be preferred cut columns
    for x0 in (200, 900, 1600, 2300, 3000, 3600):
        draw.ellipse([x0, 120, x0 + 280, height - 120], fill=(40, 30, 20))
    img.save(path, format="JPEG", quality=90)


class TestSegments(unittest.TestCase):
    def test_rtl_order(self) -> None:
        data = empty_geometry()
        data["trim"] = {"x": 0, "y": 0, "width": 3000, "height": 1000}
        data["cuts"] = [1000, 2000]
        data["order"] = "rtl"
        segs = segments_from_geometry(data)
        self.assertEqual([s.index for s in segs], [1, 2, 3])
        self.assertEqual(segs[0].x0, 2000)  # rightmost = _01
        self.assertEqual(segs[-1].x0, 0)

    def test_ltr_order(self) -> None:
        data = empty_geometry()
        data["trim"] = {"x": 10, "y": 5, "width": 3000, "height": 1000}
        data["cuts"] = [1010, 2010]
        data["order"] = "ltr"
        segs = segments_from_geometry(data)
        self.assertEqual(segs[0].x0, 10)
        self.assertEqual(segs[1].x0, 1010)

    def test_validate_cut_outside(self) -> None:
        data = empty_geometry()
        data["trim"] = {"x": 0, "y": 0, "width": 1000, "height": 500}
        data["cuts"] = [0]
        errs = validate_geometry(data)
        self.assertTrue(any("cut" in e for e in errs))


class TestPropose(unittest.TestCase):
    def test_trim_and_cuts(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            sources = root / "sources"
            sources.mkdir()
            pano = sources / "panorama.jpg"
            _make_panorama(pano)
            with Image.open(pano) as img:
                trim = propose_trim(img)
                self.assertGreater(trim.x, 0)
                self.assertGreater(trim.y, 0)
                self.assertLess(trim.right(), img.width)
                cuts = propose_cuts(img, trim, target_aspect=1.4)
                self.assertGreater(len(cuts), 0)
                for c in cuts:
                    self.assertGreater(c, trim.x)
                    self.assertLess(c, trim.right())

    def test_propose_export_roundtrip(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            scroll = Path(tmp) / "demo-scroll"
            sources = scroll / "sources"
            sources.mkdir(parents=True)
            _make_panorama(sources / "panorama.jpg", width=5000, height=900)
            data = build_proposed_geometry(scroll, target_aspect=1.4)
            data["status"] = "reviewed"
            errs = validate_geometry(data)
            self.assertEqual(errs, [])
            segs = segments_from_geometry(data)
            self.assertGreaterEqual(len(segs), 2)
            out = scroll / "images" / "_raw"
            written = export_slices(scroll, data, output_dir=out, force=True)
            self.assertEqual(len(written), len(segs))
            self.assertTrue((out / "slice_01.jpg").is_file())
            with Image.open(out / "slice_01.jpg") as slice_img:
                self.assertEqual(slice_img.height, parse_trim(data).height)


class TestTrimBox(unittest.TestCase):
    def test_as_dict(self) -> None:
        box = TrimBox(1, 2, 3, 4)
        self.assertEqual(box.as_dict(), {"x": 1, "y": 2, "width": 3, "height": 4})


class TestStitchRtl(unittest.TestCase):
    def test_paste_order_reverses_for_rtl(self) -> None:
        paths = [Path("0005.jpg"), Path("0006.jpg"), Path("0007.jpg")]
        self.assertEqual(
            [p.name for p in tiles_in_paste_order(paths, "horizontal-rtl")],
            ["0007.jpg", "0006.jpg", "0005.jpg"],
        )
        self.assertEqual(
            [p.name for p in tiles_in_paste_order(paths, "horizontal")],
            ["0005.jpg", "0006.jpg", "0007.jpg"],
        )

    def test_stitch_puts_first_tile_on_right(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            tiles = []
            # Distinct solid colors: R, G, B for 0005/0006/0007
            colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255)]
            for name, color in zip(("0005.png", "0006.png", "0007.png"), colors, strict=True):
                path = root / name
                Image.new("RGB", (100, 50), color).save(path)
                tiles.append(path)
            dest = root / "panorama.png"
            _w, _h, seams = stitch_tiles_horizontal(tiles, dest, stitch="horizontal-rtl")
            self.assertEqual(seams, [100, 200])
            with Image.open(dest) as img:
                self.assertEqual(img.size, (300, 50))
                # Left pixel = last tile (0007 = blue), right = first (0005 = red)
                self.assertEqual(img.getpixel((10, 25)), (0, 0, 255))
                self.assertEqual(img.getpixel((290, 25)), (255, 0, 0))

    def test_overlap_crops_duplicate(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            # Two tiles sharing 40px of red on the join edge (RTL reading: A then B)
            # B (巻末) left of A (巻頭) on canvas: right edge of B == left edge of A
            a = Image.new("RGB", (100, 40), (240, 240, 240))
            b = Image.new("RGB", (100, 40), (240, 240, 240))
            for x in range(40):
                for y in range(40):
                    a.putpixel((x, y), (200, 20, 20))  # left of A
                    b.putpixel((60 + x, y), (200, 20, 20))  # right of B
            pa, pb = root / "a.png", root / "b.png"
            a.save(pa)
            b.save(pb)
            dest = root / "out.png"
            _w, _h, seams = stitch_tiles_horizontal(
                [pa, pb],
                dest,
                stitch="horizontal-rtl",
                overlaps_reading=[40],
            )
            with Image.open(dest) as img:
                # B full (100) + A cropped by 40 (60) = 160
                self.assertEqual(img.size, (160, 40))
                self.assertEqual(seams, [100])  # seam after full left tile B

    def test_y_offset_shifts_right_tile(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            # Distinct markers: left tile red at top, right tile blue at top
            a = Image.new("RGB", (80, 60), (240, 240, 240))
            b = Image.new("RGB", (80, 60), (240, 240, 240))
            for x in range(20):
                for y in range(10):
                    a.putpixel((x, y), (200, 0, 0))
                    b.putpixel((60 + x, y), (0, 0, 200))
            pa, pb = root / "a.png", root / "b.png"
            a.save(pa)
            b.save(pb)
            dest = root / "out.png"
            # RTL: paste B then A. dy for pair A-B applied when placing A to right of B.
            _w, h, _seams = stitch_tiles_horizontal(
                [pa, pb],
                dest,
                stitch="horizontal-rtl",
                overlaps_reading=[0],
                y_offsets_reading=[15],
            )
            self.assertEqual(h, 75)  # 60 + 15
            with Image.open(dest) as img:
                # Right tile (A) starts at x=80, y=15 → red marker at left of A
                self.assertEqual(img.getpixel((80, 0)), (240, 240, 240))
                self.assertEqual(img.getpixel((80, 15)), (200, 0, 0))

    def test_overlap_index_rtl(self) -> None:
        self.assertEqual(overlap_index_for_paste_seam(0, 3, "horizontal-rtl"), 1)
        self.assertEqual(overlap_index_for_paste_seam(1, 3, "horizontal-rtl"), 0)
        self.assertEqual(overlap_index_for_paste_seam(0, 3, "horizontal"), 0)

    def test_estimate_prefers_large_overlap(self) -> None:
        w, h = 200, 40
        overlap = 80
        left = Image.new("RGB", (w, h), (230, 230, 220))
        right = Image.new("RGB", (w, h), (230, 230, 220))
        for x in range(overlap):
            for y in range(h):
                v = 40 + (x * 3 + y * 5) % 180
                left.putpixel((w - overlap + x, y), (v, 20, 20))
                right.putpixel((x, y), (v, 20, 20))
        est = estimate_overlap_pixels(left, right)
        self.assertGreater(est, 50)
        self.assertLess(abs(est - overlap), 12)


if __name__ == "__main__":
    unittest.main()
