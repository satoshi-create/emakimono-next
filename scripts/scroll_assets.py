"""Thumb / OGP asset helpers for scroll_upload.py."""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
THUMB_DIR = REPO_ROOT / "public" / "thumb"
TMP_THUMB_DIR = REPO_ROOT / "scrolls" / "_tmp-thumb"
OGP_DIR = REPO_ROOT / "public" / "ogp"


def thumb_webp_path(titleen: str) -> Path:
    return THUMB_DIR / f"{titleen}_thumb.webp"


def ogp_path(titleen: str) -> Path:
    return OGP_DIR / f"{titleen}.jpg"


def run_cmd(cmd: list[str], *, label: str) -> int:
    print(f"\n========== {label} ==========")
    print(" ", " ".join(cmd))
    result = subprocess.run(cmd, cwd=REPO_ROOT)
    return result.returncode


def ensure_thumb_webp(
    titleen: str,
    *,
    config_path: Path | None = None,
    public_id: str | None = None,
    crop: str | None = None,
    dry_run: bool = False,
) -> bool:
    """Return True when thumb webp exists or was generated."""
    out = thumb_webp_path(titleen)
    if out.is_file() and out.stat().st_size > 0:
        print(f"  Thumb OK: {out.relative_to(REPO_ROOT)}")
        return True

    if dry_run:
        print(f"  [dry-run] Would generate thumb: {out.relative_to(REPO_ROOT)}")
        return False

    # 1) scrolls/_tmp-thumb/{titleen}_thumb.png|jpg
    code = run_cmd(
        ["node", "scripts/generate-thumb-webp.js", titleen],
        label="Thumb from _tmp-thumb",
    )
    if code == 0 and out.is_file():
        return True

    # 2) public/thumb/{titleen}_thumb.png → _tmp-thumb → webp
    for ext in (".png", ".jpg", ".jpeg"):
        src = THUMB_DIR / f"{titleen}_thumb{ext}"
        if not src.is_file():
            continue
        TMP_THUMB_DIR.mkdir(parents=True, exist_ok=True)
        dest = TMP_THUMB_DIR / f"{titleen}_thumb{ext if ext != '.jpeg' else '.jpg'}"
        shutil.copy2(src, dest)
        print(f"  Copied {src.relative_to(REPO_ROOT)} → {dest.relative_to(REPO_ROOT)}")
        code = run_cmd(
            ["node", "scripts/generate-thumb-webp.js", titleen],
            label="Thumb from public/thumb PNG",
        )
        if code == 0 and out.is_file():
            return True

    # 3) Cloudinary scene (requires prior sync)
    if config_path and config_path.is_file():
        cmd = ["node", "scripts/generate-thumb-from-scene.js", str(config_path)]
        if public_id:
            cmd.extend(["--public-id", public_id])
        if crop:
            cmd.extend(["--crop", crop])
        code = run_cmd(cmd, label="Thumb from Cloudinary scene")
        if code == 0 and out.is_file():
            return True

    print(f"  WARN: thumb not generated for {titleen}")
    return False


def ensure_ogp(titleen: str, *, dry_run: bool = False) -> bool:
    """Return True when OGP jpg exists or was generated."""
    out = ogp_path(titleen)
    if out.is_file() and out.stat().st_size > 0:
        print(f"  OGP OK: {out.relative_to(REPO_ROOT)}")
        return True

    if dry_run:
        print(f"  [dry-run] Would generate OGP: {out.relative_to(REPO_ROOT)}")
        return False

    code = run_cmd(
        ["node", "src/script/generateOgImages.js", titleen],
        label="OGP from thumb",
    )
    if code == 0 and out.is_file():
        return True

    print(f"  WARN: OGP not generated for {titleen}")
    return False
