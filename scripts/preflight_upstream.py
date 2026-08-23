#!/usr/bin/env python3
"""
preflight_upstream.py — Run upstream gates before sync (no Cloudinary).

Usage:
  py -3.14 scripts/preflight_upstream.py scrolls/my-scroll/
  py -3.14 scripts/preflight_upstream.py scrolls/my-scroll/ --skip-similarity
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PYTHON = sys.executable


def resolve_paths(arg: str) -> tuple[Path, Path, Path]:
    path = Path(arg)
    if not path.is_absolute():
        path = REPO_ROOT / path
    if path.name == "scroll_config.yaml":
        scroll_dir = path.parent
    else:
        scroll_dir = path
    config_path = scroll_dir / "scroll_config.yaml"
    images_dir = scroll_dir / "images"
    return scroll_dir.resolve(), config_path.resolve(), images_dir.resolve()


def run_step(label: str, cmd: list[str]) -> int:
    print(f"\n========== {label} ==========")
    print(" ", " ".join(cmd))
    result = subprocess.run(cmd, cwd=REPO_ROOT)
    return result.returncode


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Upstream validation before scroll sync")
    parser.add_argument("scroll_dir", help="scrolls/{scroll_id}/ or scroll_config.yaml")
    parser.add_argument("--skip-similarity", action="store_true", help="Skip sources/ similarity check")
    parser.add_argument("--strict-text", action="store_true", help="Strict text-layer checks")
    parser.add_argument(
        "--require-reviewed",
        action="store_true",
        help="Require scene-mapping confidence != draft",
    )
    parser.add_argument("--skip-mapping-check", action="store_true", help="Skip CSV vs YAML check")
    args = parser.parse_args(argv)

    scroll_dir, config_path, images_dir = resolve_paths(args.scroll_dir)
    if not config_path.is_file():
        print(f"Config not found: {config_path}")
        return 1

    print(f"\n=== Upstream preflight: {scroll_dir.name} ===")

    steps: list[tuple[str, list[str]]] = []

    if images_dir.is_dir():
        steps.append(
            (
                "Normalize (dry-run)",
                [PYTHON, "scripts/normalize_scroll_images.py", str(images_dir), "--dry-run"],
            )
        )

    sources_dir = scroll_dir / "sources"
    has_csv = (sources_dir / "scenes-summary.csv").is_file() or (sources_dir / "scene-mapping.csv").is_file()
    if has_csv and not args.skip_mapping_check:
        steps.append(
            (
                "Scene mapping check",
                [PYTHON, "scripts/build_scene_mapping.py", str(scroll_dir), "--check"],
            )
        )

    preflight_cmd = [PYTHON, "scripts/preflight_scroll.py", str(config_path)]
    if args.strict_text:
        preflight_cmd.append("--strict-text")
    if args.skip_similarity:
        preflight_cmd.append("--skip-similarity")
    if args.require_reviewed:
        preflight_cmd.append("--require-reviewed")
    steps.append(("Preflight", preflight_cmd))

    for label, cmd in steps:
        code = run_step(label, cmd)
        if code != 0:
            print(f"\nUpstream preflight FAILED at: {label}")
            return code

    print("\nUpstream preflight OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
