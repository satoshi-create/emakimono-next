#!/usr/bin/env python3
"""
process_figma_slices.py — Figma ラフ書き出し → ビューア用アセット + scroll_config 骨格。

Figma 側は余白トリムとスライス境界のみ。本スクリプトが:
  - 高さ 1080px リサイズ (LANCZOS)
  - Brightness / UnsharpMask
  - JPEG optimize で 1MB 未満
  - _NN-1080.jpg 連番
  - scroll_config.yaml の scenes 骨格（CSV があれば merge）

Usage:
  py -3.14 scripts/process_figma_slices.py scrolls/my-scroll/ --input-dir scrolls/my-scroll/images/_raw
  py -3.14 scripts/process_figma_slices.py scrolls/my-scroll/ --input-dir ... --dry-run
  py -3.14 scripts/process_figma_slices.py scrolls/my-scroll/ --input-dir ... --scene-text --force
"""

from __future__ import annotations

import argparse
import io
import re
import sys
from pathlib import Path

import yaml
from PIL import Image, ImageEnhance, ImageFilter

from scroll_image_utils import IMAGE_EXTENSIONS, canonical_filename

REPO_ROOT = Path(__file__).resolve().parent.parent
TARGET_HEIGHT = 1080
MAX_BYTES = 1_048_576
DEFAULT_BRIGHTNESS = 1.05
DEFAULT_SHARPEN_PERCENT = 130
UNSHARP_RADIUS = 1.5
UNSHARP_THRESHOLD = 3
JPEG_QUALITY_START = 90
JPEG_QUALITY_FLOOR = 50
SKIP_INPUT_NAMES = frozenset(
    {"contact_sheet.jpg", "contact_sheet.jpeg", "preview.jpg", "preview.jpeg"}
)


def resolve_scroll_dir(arg: str) -> Path:
    path = Path(arg)
    if not path.is_absolute():
        path = REPO_ROOT / path
    if path.name == "scroll_config.yaml":
        path = path.parent
    if not path.is_dir():
        raise SystemExit(f"Scroll directory not found: {arg}")
    return path.resolve()


def collect_input_images(input_dir: Path) -> list[Path]:
    if not input_dir.is_dir():
        raise SystemExit(f"Input directory not found: {input_dir}")
    files = [
        p
        for p in input_dir.iterdir()
        if p.is_file()
        and p.suffix.lower() in IMAGE_EXTENSIONS
        and p.name.lower() not in SKIP_INPUT_NAMES
    ]
    files.sort(key=lambda p: p.name.lower())
    if not files:
        raise SystemExit(f"No images found in {input_dir}")
    return files


def encode_jpeg_under_limit(img: Image.Image, dest: Path, *, dry_run: bool) -> tuple[int, int]:
    """Save JPEG ≤ MAX_BYTES. Returns (bytes, quality_used)."""
    working = img
    quality = JPEG_QUALITY_START

    for _scale_attempt in range(8):
        quality = JPEG_QUALITY_START
        while quality >= JPEG_QUALITY_FLOOR:
            buf = io.BytesIO()
            working.save(buf, format="JPEG", quality=quality, optimize=True)
            size = buf.tell()
            if size <= MAX_BYTES:
                if not dry_run:
                    dest.write_bytes(buf.getvalue())
                return size, quality
            quality -= 5

        # Still too large: shrink width slightly, keep height 1080
        w, h = working.size
        new_w = max(1, int(w * 0.95))
        if new_w >= w:
            break
        working = working.resize((new_w, TARGET_HEIGHT), Image.Resampling.LANCZOS)

    raise SystemExit(
        f"Could not compress under {MAX_BYTES} bytes: {dest.name} "
        f"(last size attempt exceeded limit at quality={JPEG_QUALITY_FLOOR})"
    )


def process_one_image(
    src: Path,
    dest: Path,
    *,
    dry_run: bool,
    brightness: float,
    sharpen_percent: int,
) -> dict:
    with Image.open(src) as opened:
        img = opened.convert("RGB")
        w, h = img.size
        if h <= 0:
            raise SystemExit(f"Invalid image height: {src}")
        new_w = max(1, round(w * (TARGET_HEIGHT / h)))
        img = img.resize((new_w, TARGET_HEIGHT), Image.Resampling.LANCZOS)
        img = ImageEnhance.Brightness(img).enhance(brightness)
        if sharpen_percent > 0:
            img = img.filter(
                ImageFilter.UnsharpMask(
                    radius=UNSHARP_RADIUS,
                    percent=sharpen_percent,
                    threshold=UNSHARP_THRESHOLD,
                )
            )
        size, quality = encode_jpeg_under_limit(img, dest, dry_run=dry_run)

    return {
        "src": src.name,
        "dest": dest.name,
        "width": new_w,
        "height": TARGET_HEIGHT,
        "bytes": size,
        "quality": quality,
    }


def default_scenes(image_count: int, *, scene_text: bool) -> list[dict]:
    scenes: list[dict] = []
    for i in range(1, image_count + 1):
        scene: dict = {
            "id": i,
            "title": f"第{i}段",
            "titleen": f"Scene {i}",
            "range": [i, i],
        }
        if scene_text:
            scene["text"] = {"desc": "", "descen": ""}
        scenes.append(scene)
    return scenes


def scenes_from_csv(csv_path: Path, image_count: int, *, scene_text: bool) -> list[dict]:
    from scroll_checks.scene_mapping import load_scenes_summary_csv, scene_rows_to_yaml_dicts

    rows = load_scenes_summary_csv(csv_path)
    scenes = scene_rows_to_yaml_dicts(rows)
    covered: set[int] = set()
    for scene in scenes:
        start, end = scene["range"]
        covered.update(range(start, end + 1))
        if scene_text and "text" not in scene:
            scene["text"] = {"desc": "", "descen": ""}

    expected = set(range(1, image_count + 1))
    if covered != expected:
        missing = sorted(expected - covered)
        extra = sorted(covered - expected)
        parts = []
        if missing:
            parts.append(f"missing indices {missing}")
        if extra:
            parts.append(f"extra indices {extra}")
        raise SystemExit(
            f"CSV ranges do not cover images 1..{image_count}: " + "; ".join(parts)
        )
    return scenes


def _is_placeholder_title(title: str, *, ja: bool) -> bool:
    if ja:
        return bool(re.fullmatch(r"第\d+段", title or ""))
    return bool(re.fullmatch(r"Scene \d+", title or ""))


def merge_scenes_preserve_text(
    new_scenes: list[dict], existing_scenes: list[dict] | None
) -> list[dict]:
    """Keep hand-written titles/text from existing YAML when new scenes are placeholders."""
    if not existing_scenes:
        return new_scenes
    by_id = {int(s.get("id", 0)): s for s in existing_scenes}
    merged: list[dict] = []
    for scene in new_scenes:
        old = by_id.get(int(scene["id"]))
        if not old:
            merged.append(scene)
            continue
        if old.get("title") and _is_placeholder_title(str(scene.get("title", "")), ja=True):
            scene["title"] = old["title"]
        if old.get("titleen") and _is_placeholder_title(str(scene.get("titleen", "")), ja=False):
            scene["titleen"] = old["titleen"]
        if old.get("slots"):
            scene["slots"] = old["slots"]
        text = dict(scene.get("text") or {})
        old_text = dict(old.get("text") or {})
        for key in ("gendaibun", "gendaibunen", "kobun", "kobunen", "desc", "descen"):
            if old_text.get(key):
                text[key] = old_text[key]
            elif old.get(key) and not text.get(key):
                # Misplaced scene-level desc/descen → text.*
                text[key] = old[key]
        if text:
            scene["text"] = text
        merged.append(scene)
    return merged


def load_or_build_config(
    config_path: Path,
    *,
    scroll_id: str,
    scene_text: bool,
    kotobagaki: bool,
) -> tuple[dict, bool]:
    """Return (data, existed). Does not write."""
    if config_path.is_file():
        with config_path.open("r", encoding="utf-8") as handle:
            data = yaml.safe_load(handle) or {}
        existed = True
    else:
        titleen = scroll_id.replace("-", "_")
        data = {
            "scroll_id": scroll_id,
            "volume_num": 1,
            "theme_id": scroll_id.split("-")[0] or scroll_id,
            "folder": "emakimono",
            "metadata": {
                "id": 99,
                "title": scroll_id,
                "titleen": titleen,
                "type": "絵巻",
                "typeen": "emaki",
                "thumb": f"/{titleen}_thumb.webp",
                "kotobagaki": kotobagaki,
                "favorite": False,
                "readMore": False,
            },
            "scenes": [],
        }
        existed = False

    data.setdefault("scroll_id", scroll_id)
    data.setdefault("folder", "emakimono")
    meta = data.setdefault("metadata", {})
    meta.setdefault("kotobagaki", kotobagaki)
    if scene_text:
        meta["sceneText"] = True
    return data, existed


def _ensure_scene_text_flag(config_path: Path, *, enabled: bool) -> None:
    if not enabled or not config_path.is_file():
        return
    text = config_path.read_text(encoding="utf-8")
    if re.search(r"^\s*sceneText:\s*", text, flags=re.MULTILINE):
        return
    if re.search(r"kotobagaki:\s*(?:true|false)", text):
        text = re.sub(
            r"(kotobagaki:\s*(?:true|false))",
            r"\1\n  sceneText: true",
            text,
            count=1,
        )
    else:
        text = re.sub(
            r"(^metadata:\s*\n)",
            r"\1  sceneText: true\n",
            text,
            count=1,
            flags=re.MULTILINE,
        )
    config_path.write_text(text, encoding="utf-8")


def _dump_config_with_scenes(config_path: Path, data: dict, scenes: list[dict]) -> None:
    """Write full YAML using block-style scenes via build_scene_mapping formatter."""
    from build_scene_mapping import build_scenes_yaml_block

    data = dict(data)
    data.pop("scenes", None)
    header = yaml.safe_dump(data, allow_unicode=True, sort_keys=False).rstrip() + "\n\n"
    body = build_scenes_yaml_block(scenes)
    config_path.parent.mkdir(parents=True, exist_ok=True)
    config_path.write_text(header + body, encoding="utf-8")
    print(f"  Wrote {config_path} ({len(scenes)} scene(s))")


def write_scenes_to_yaml(
    config_path: Path,
    data: dict,
    scenes: list[dict],
    *,
    existed: bool,
    dry_run: bool,
) -> None:
    data["scenes"] = scenes
    data["folder"] = data.get("folder") or "emakimono"
    scene_text = bool((data.get("metadata") or {}).get("sceneText"))

    if dry_run:
        print(f"  [dry-run] Would write {len(scenes)} scene(s) to {config_path}")
        return

    if existed and config_path.is_file():
        text = config_path.read_text(encoding="utf-8")
        # Empty list form "scenes: []" cannot be patched by build_scene_mapping
        if re.search(r"^scenes:\s*\[\s*\]\s*$", text, flags=re.MULTILINE):
            text = re.sub(r"^scenes:\s*\[\s*\]\s*$", "scenes:", text, count=1, flags=re.MULTILINE)
            config_path.write_text(text, encoding="utf-8")
            text = config_path.read_text(encoding="utf-8")
        if re.search(r"^scenes:\s*$", text, flags=re.MULTILINE) or re.search(
            r"^scenes:\s*\n\s+-", text, flags=re.MULTILINE
        ):
            from build_scene_mapping import patch_scroll_config

            patch_scroll_config(config_path, scenes, dry_run=False)
            _ensure_scene_text_flag(config_path, enabled=scene_text)
            return

    _dump_config_with_scenes(config_path, data, scenes)


def clear_existing_outputs(output_dir: Path, *, force: bool, dry_run: bool) -> None:
    existing = sorted(output_dir.glob("_*-*.jpg")) + sorted(output_dir.glob("_*-*.jpeg"))
    if not existing:
        return
    if not force:
        raise SystemExit(
            f"{len(existing)} existing _NN-*.jpg in {output_dir}. "
            "Pass --force to overwrite, or choose another --output-dir."
        )
    for path in existing:
        print(f"  remove {path.name}")
        if not dry_run:
            path.unlink()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Process Figma slice exports into viewer assets + scroll_config skeleton"
    )
    parser.add_argument(
        "scroll_path",
        help="scrolls/{scroll_id}/ or path to scroll_config.yaml",
    )
    parser.add_argument(
        "--input-dir",
        required=True,
        help="Directory of rough Figma exports (PNG/JPG)",
    )
    parser.add_argument(
        "--output-dir",
        default=None,
        help="Output images dir (default: scrolls/{id}/images)",
    )
    parser.add_argument(
        "--scenes-csv",
        default=None,
        help="Optional sources/scenes-summary.csv (default: auto-detect)",
    )
    parser.add_argument(
        "--scene-text",
        action="store_true",
        help="Set metadata.sceneText and empty text.desc/descen on scenes",
    )
    parser.add_argument(
        "--kotobagaki",
        choices=("true", "false"),
        default="false",
        help="metadata.kotobagaki (default: false)",
    )
    parser.add_argument("--dry-run", action="store_true", help="Report only; write nothing")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing _NN-*.jpg in output-dir",
    )
    parser.add_argument(
        "--skip-yaml",
        action="store_true",
        help="Only process images; do not touch scroll_config.yaml",
    )
    parser.add_argument(
        "--brightness",
        type=float,
        default=DEFAULT_BRIGHTNESS,
        help=f"Brightness enhance factor (default: {DEFAULT_BRIGHTNESS})",
    )
    parser.add_argument(
        "--sharpen",
        type=int,
        default=DEFAULT_SHARPEN_PERCENT,
        help=f"UnsharpMask percent; 0 disables (default: {DEFAULT_SHARPEN_PERCENT})",
    )
    parser.add_argument(
        "--skip-contact-sheet-check",
        action="store_true",
        help="Allow process without images/_raw/contact_sheet.jpg (explicit skip)",
    )
    args = parser.parse_args(argv)

    scroll_dir = resolve_scroll_dir(args.scroll_path)
    scroll_id = scroll_dir.name
    input_dir = Path(args.input_dir)
    if not input_dir.is_absolute():
        input_dir = (REPO_ROOT / input_dir).resolve()
    else:
        input_dir = input_dir.resolve()

    output_dir = Path(args.output_dir) if args.output_dir else scroll_dir / "images"
    if not output_dir.is_absolute():
        output_dir = (REPO_ROOT / output_dir).resolve()
    else:
        output_dir = output_dir.resolve()

    # Guard: do not write into the same folder as raw inputs unless forced names differ
    if input_dir.resolve() == output_dir.resolve():
        raise SystemExit(
            "input-dir and output-dir must differ "
            "(put Figma exports in images/_raw/)"
        )

    if not args.skip_contact_sheet_check:
        sheet_names = ("contact_sheet.jpg", "contact_sheet.jpeg")
        if not any((input_dir / name).is_file() for name in sheet_names):
            raise SystemExit(
                f"Missing contact_sheet.jpg in {input_dir}. "
                "Run generate_contact_sheet.py and decide Brightness/Sharpen first, "
                "or pass --skip-contact-sheet-check to override."
            )

    kotobagaki = args.kotobagaki == "true"
    sources = collect_input_images(input_dir)

    print(f"\n=== process_figma_slices: {scroll_id} ===")
    print(f"  input:  {input_dir} ({len(sources)} file(s))")
    print(f"  output: {output_dir}")
    print(f"  correct: brightness={args.brightness} sharpen={args.sharpen}%")
    if args.dry_run:
        print("  mode:   dry-run")

    if not args.dry_run:
        output_dir.mkdir(parents=True, exist_ok=True)
    clear_existing_outputs(output_dir, force=args.force, dry_run=args.dry_run)

    results: list[dict] = []
    for index, src in enumerate(sources, start=1):
        dest_name = canonical_filename(index, TARGET_HEIGHT, ".jpg")
        dest = output_dir / dest_name
        info = process_one_image(
            src,
            dest,
            dry_run=args.dry_run,
            brightness=args.brightness,
            sharpen_percent=args.sharpen,
        )
        results.append(info)
        print(
            f"  [{index:02d}] {info['src']} -> {info['dest']} "
            f"{info['width']}x{info['height']} "
            f"{info['bytes'] / 1024:.0f}KB q={info['quality']}"
        )

    image_count = len(results)
    overs = [r for r in results if r["bytes"] > MAX_BYTES]
    if overs:
        print("\nERROR: files still over 1MB:")
        for r in overs:
            print(f"  x {r['dest']}: {r['bytes']} bytes")
        return 1

    if args.skip_yaml:
        print("\nImages OK (--skip-yaml)")
        return 0

    config_path = scroll_dir / "scroll_config.yaml"
    csv_path = Path(args.scenes_csv) if args.scenes_csv else scroll_dir / "sources" / "scenes-summary.csv"
    if args.scenes_csv and not csv_path.is_absolute():
        csv_path = (REPO_ROOT / csv_path).resolve()

    data, existed = load_or_build_config(
        config_path,
        scroll_id=scroll_id,
        scene_text=args.scene_text,
        kotobagaki=kotobagaki,
    )
    if not existed:
        print(f"  YAML: will create {config_path.name}")

    if csv_path.is_file():
        print(f"  scenes: from {csv_path}")
        scenes = scenes_from_csv(csv_path, image_count, scene_text=args.scene_text)
    else:
        print("  scenes: 1 image = 1 scene (no CSV)")
        scenes = default_scenes(image_count, scene_text=args.scene_text)

    existing = data.get("scenes") if isinstance(data.get("scenes"), list) else []
    scenes = merge_scenes_preserve_text(scenes, existing)

    if data.get("scroll_id") and data["scroll_id"] != scroll_id:
        print(
            f"  ! warning: YAML scroll_id={data['scroll_id']} "
            f"differs from folder={scroll_id}"
        )

    write_scenes_to_yaml(
        config_path, data, scenes, existed=existed, dry_run=args.dry_run
    )

    print(f"\nDone: {image_count} image(s), {len(scenes)} scene(s)")
    print("Next:")
    print(f"  py -3.14 scripts/normalize_scroll_images.py {scroll_dir.relative_to(REPO_ROOT)}/ --dry-run")
    print(f"  py -3.14 scripts/preflight_upstream.py {scroll_dir.relative_to(REPO_ROOT)}/ --skip-similarity")
    return 0


if __name__ == "__main__":
    sys.exit(main())
