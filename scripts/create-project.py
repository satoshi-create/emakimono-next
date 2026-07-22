#!/usr/bin/env python3
"""
create-project.py — Scaffold a new emaki scroll under scrolls/{scroll_id}/.

Usage:
  python scripts/create-project.py my-new-scroll

Creates:
  scrolls/{scroll_id}/scroll_config.yaml
  scrolls/{scroll_id}/images/
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
TEMPLATE_DIR = REPO_ROOT / "scrolls" / "_template"


def sanitize_scroll_id(name: str) -> str:
    """Convert a user-friendly name to a kebab-case scroll_id."""
    return name.lower().replace(" ", "-").replace("_", "-")


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python scripts/create-project.py <scroll-id-or-name>")
        sys.exit(1)

    raw_name = sys.argv[1]
    scroll_id = sanitize_scroll_id(raw_name)
    project_dir = REPO_ROOT / "scrolls" / scroll_id

    if project_dir.exists():
        print(f"Error: Directory already exists: {project_dir}")
        sys.exit(1)

    if not TEMPLATE_DIR.exists():
        print(f"Error: Template not found: {TEMPLATE_DIR}")
        sys.exit(1)

    shutil.copytree(TEMPLATE_DIR, project_dir)

    config_path = project_dir / "scroll_config.yaml"
    content = config_path.read_text(encoding="utf-8")
    content = content.replace("my-scroll-id", scroll_id)
    content = content.replace("my-theme", scroll_id.split("-")[0])
    content = content.replace("my_scroll_slug", scroll_id.replace("-", "_"))
    config_path.write_text(content, encoding="utf-8")

    print(f"\n  Created scroll project: {project_dir}")
    print(f"  Config: {config_path}")
    print(f"  Images: {project_dir / 'images'}")
    print()
    print("  Next steps:")
    print(f"    1. Place scroll images in scrolls/{scroll_id}/images/")
    print("    2. Edit scroll_config.yaml (metadata, scenes)")
    print(f"    3. python scripts/sync_scroll.py scrolls/{scroll_id}/scroll_config.yaml --dry-run")
    print(f"    4. python scripts/sync_all.py scrolls/{scroll_id}/scroll_config.yaml")
    print()


if __name__ == "__main__":
    main()
