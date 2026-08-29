#!/usr/bin/env python3
"""
scroll_upload.py — Orchestrate scroll preflight → sync → thumb/OGP → postflight.

Usage:
  py -3.14 scripts/scroll_upload.py scrolls/my-scroll/
  py -3.14 scripts/scroll_upload.py scrolls/my-scroll/ --dry-run
  py -3.14 scripts/scroll_upload.py scrolls/my-scroll/ --skip-upload
  py -3.14 scripts/scroll_upload.py scrolls/my-scroll/ --preflight-only

PowerShell wrapper: scripts/scroll_upload.ps1
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

import sync_scroll as ss
from scroll_assets import ensure_ogp, ensure_thumb_webp

REPO_ROOT = Path(__file__).resolve().parent.parent
PYTHON = sys.executable


def resolve_paths(arg: str) -> tuple[Path, Path]:
    path = Path(arg)
    if not path.is_absolute():
        path = REPO_ROOT / path
    if path.name == "scroll_config.yaml":
        scroll_dir = path.parent
    else:
        scroll_dir = path
    config_path = scroll_dir / "scroll_config.yaml"
    return scroll_dir.resolve(), config_path.resolve()


def run_step(label: str, cmd: list[str]) -> int:
    print(f"\n========== {label} ==========")
    print(" ", " ".join(cmd))
    return subprocess.run(cmd, cwd=REPO_ROOT).returncode


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Orchestrate scroll preflight, sync, thumb/OGP, and postflight"
    )
    parser.add_argument(
        "scroll_path",
        help="scrolls/{scroll_id}/ or scroll_config.yaml",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preflight + sync --dry-run only (no uploads, no asset writes)",
    )
    parser.add_argument(
        "--preflight-only",
        action="store_true",
        help="Upstream preflight + usage check only (no sync)",
    )
    parser.add_argument(
        "--skip-upload",
        action="store_true",
        help="Pass --skip-upload to sync_all (metadata/JSON only)",
    )
    parser.add_argument(
        "--force-upload",
        action="store_true",
        help="Pass --force-upload to sync_all",
    )
    parser.add_argument(
        "--with-thumb",
        action="store_true",
        help="Generate thumb webp after sync when missing",
    )
    parser.add_argument(
        "--with-ogp",
        action="store_true",
        help="Generate OGP jpg after thumb when missing",
    )
    parser.add_argument(
        "--no-thumb",
        action="store_true",
        help="Skip thumb generation and thumb postflight checks",
    )
    parser.add_argument(
        "--no-ogp",
        action="store_true",
        help="Skip OGP generation and OGP postflight checks",
    )
    parser.add_argument(
        "--skip-build",
        action="store_true",
        help="Skip npm run build in postflight_downstream",
    )
    parser.add_argument(
        "--skip-similarity",
        action="store_true",
        help="Pass --skip-similarity to preflight",
    )
    parser.add_argument(
        "--require-reviewed",
        action="store_true",
        help="Require scene-mapping confidence=reviewed",
    )
    parser.add_argument(
        "--ack-no-color-correction",
        action="store_true",
        help="Acknowledge skipping contact-sheet color correction",
    )
    parser.add_argument("--thumb-public-id", help="Cloudinary public_id for thumb crop")
    parser.add_argument(
        "--thumb-crop",
        choices=["west", "centre", "center", "east"],
        help="Crop position for generate-thumb-from-scene.js",
    )
    args = parser.parse_args(argv)

    scroll_dir, config_path = resolve_paths(args.scroll_path)
    if not config_path.is_file():
        print(f"Config not found: {config_path}")
        return 1

    config = ss.load_yaml(str(config_path))
    titleen = (config.get("metadata") or {}).get("titleen", scroll_dir.name)
    production = not args.dry_run and not args.preflight_only

    # Default: generate assets on production sync (not metadata-only unless asked)
    with_thumb = args.with_thumb or (production and not args.skip_upload and not args.no_thumb)
    with_ogp = args.with_ogp or (production and not args.no_ogp)
    if args.no_thumb:
        with_thumb = False
    if args.no_ogp:
        with_ogp = False

    print(f"\n=== Scroll upload: {scroll_dir.name} (titleen={titleen}) ===")
    if args.dry_run:
        print("  Mode: dry-run")
    elif args.preflight_only:
        print("  Mode: preflight-only")
    elif args.skip_upload:
        print("  Mode: skip-upload (JSON/metadata)")
    else:
        print("  Mode: production sync")

    # --- Phase 1: upstream preflight ---
    upstream_cmd = [PYTHON, "scripts/preflight_upstream.py", str(scroll_dir)]
    if args.skip_similarity:
        upstream_cmd.append("--skip-similarity")
    if args.require_reviewed:
        upstream_cmd.append("--require-reviewed")
    if args.ack_no_color_correction:
        upstream_cmd.append("--ack-no-color-correction")
    if run_step("Upstream preflight", upstream_cmd) != 0:
        return 1

    # --- Phase 2: Cloudinary usage ---
    usage_cmd = [
        PYTHON,
        "scripts/check_cloudinary_usage.py",
        "--warn-at",
        "18",
        "--fail-at",
        "20",
        "--no-save",
    ]
    usage_code = run_step("Cloudinary usage", usage_cmd)
    if usage_code != 0 and production and not args.skip_upload:
        print("\nScroll upload FAILED at: Cloudinary usage")
        return usage_code

    if args.preflight_only:
        print("\nScroll upload OK (preflight-only)")
        return 0

    # --- Phase 3: sync dry-run ---
    dry_cmd = [PYTHON, "scripts/sync_all.py", str(config_path), "--dry-run"]
    if args.skip_upload:
        dry_cmd.append("--skip-upload")
    if args.ack_no_color_correction:
        dry_cmd.append("--ack-no-color-correction")
    if run_step("Sync dry-run", dry_cmd) != 0:
        return 1

    if args.dry_run:
        print("\nScroll upload OK (dry-run)")
        return 0

    # --- Phase 4: production sync ---
    sync_cmd = [PYTHON, "scripts/sync_all.py", str(config_path)]
    if args.skip_upload:
        sync_cmd.append("--skip-upload")
    if args.force_upload:
        sync_cmd.append("--force-upload")
    if args.ack_no_color_correction:
        sync_cmd.append("--ack-no-color-correction")
    if run_step("Sync production", sync_cmd) != 0:
        return 1

    # --- Phase 5: thumb / OGP ---
    if with_thumb:
        ensure_thumb_webp(
            titleen,
            config_path=config_path,
            public_id=args.thumb_public_id,
            crop=args.thumb_crop,
        )
    if with_ogp:
        ensure_ogp(titleen)

    # --- Phase 6: postflight ---
    if run_step("Postflight sync", [PYTHON, "scripts/postflight_sync.py", str(scroll_dir)]) != 0:
        return 1

    downstream_cmd = [PYTHON, "scripts/postflight_downstream.py", str(scroll_dir)]
    if args.skip_build:
        downstream_cmd.append("--skip-build")
    if args.no_thumb:
        downstream_cmd.append("--skip-thumb")
    if args.no_ogp:
        downstream_cmd.append("--skip-ogp")
    if run_step("Postflight downstream", downstream_cmd) != 0:
        return 1

    run_step(
        "Cloudinary usage (post)",
        usage_cmd,
    )

    print("\nScroll upload OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
