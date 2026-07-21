#!/usr/bin/env python3
"""
create-project.py — Scaffold a new emaki project from the emakimono-next template.

Creates a minimal project directory with:
  - scroll_config.yaml  (ready to edit for a new emaki)
  - public/images/       (place your scroll images here)
  - README.md           (getting-started instructions)

Usage:
  python scripts/create-project.py my-new-emaki

The new project will be created at ../my-new-emaki/ relative to the repo root.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_TEMPLATE_DIR = REPO_ROOT / "project-template"

SCROLL_CONFIG_TEMPLATE = """# scroll_config.yaml — {project_name}
# Edit this file with your scroll's metadata and scene structure.
# Then run:
#   python ../emakimono-next/scripts/sync_all.py scroll_config.yaml

scroll_id: "{scroll_id}"
volume_num: 1
theme_id: "{theme_id}"
folder: "emakimono"

metadata:
  id: 1
  title: "絵巻タイトル"
  titleen: "{titleen}"
  author: "作者名"
  authoren: "author-name-in-en"
  edition: ""
  era: "平安"
  eraen: "heiann"
  type: "絵巻"
  typeen: "emaki"
  desc: "説明文"
  descen: "Description in English"
  thumb: "/{scroll_id}_thumb.webp"
  thumb2: ""
  backgroundImage: ""
  video: ""
  sourceImageUrl: ""
  sourceImage: ""
  encodeUrl: "https://emakimono.com/{titleen}"
  favorite: false
  kotobagaki: false
  readMore: false
  keywords:
    - {{ name: "キーワード1", id: "keyword1", slug: "keyword1" }}

scenes:
  - id: 1
    title: "第1章"
    titleen: "Chapter 1"
    range: [1, 1]
  # - id: 2
  #   title: "第2章"
  #   titleen: "Chapter 2"
  #   range: [2, 3]
"""

README_TEMPLATE = """# {project_name}

Emaki scroll project for [emakimono-next](https://github.com/satoshi-create/emakimono-next).

## Quick start

1. Place your scroll images in `public/images/{scroll_id}/`

2. Edit `scroll_config.yaml` with your metadata and scene structure

3. Sync to Cloudinary and generate JSON:

```bash
pip install -r ../emakimono-next/scripts/requirements-sync.txt
export CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"

# Dry run first
python ../emakimono-next/scripts/sync_all.py scroll_config.yaml --dry-run

# Real run
python ../emakimono-next/scripts/sync_all.py scroll_config.yaml
```

4. Create text data (optional):

```bash
cp scroll_config.yaml ../emakimono-next/scroll_config_{scroll_id}.yaml
```

See the parent project's docs for more details.
"""


def sanitize_project_name(name: str) -> str:
    """Convert a user-friendly name to a valid scroll_id."""
    return name.lower().replace(" ", "-").replace("_", "-")


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python scripts/create-project.py <project-name>")
        sys.exit(1)

    raw_name = sys.argv[1]
    scroll_id = sanitize_project_name(raw_name)
    project_dir = REPO_ROOT.parent / raw_name

    if project_dir.exists():
        print(f"Error: Directory already exists: {project_dir}")
        sys.exit(1)

    # Create directories
    (project_dir / "public/images").mkdir(parents=True, exist_ok=True)

    # Write scroll_config.yaml
    config_content = SCROLL_CONFIG_TEMPLATE.format(
        project_name=raw_name,
        scroll_id=scroll_id,
        theme_id=scroll_id,
        titleen=scroll_id,
    )
    with open(project_dir / "scroll_config.yaml", "w", encoding="utf-8") as f:
        f.write(config_content)

    # Write README
    with open(project_dir / "README.md", "w", encoding="utf-8") as f:
        f.write(README_TEMPLATE.format(
            project_name=raw_name,
            scroll_id=scroll_id,
        ))

    print(f"\n  Created project: {project_dir}")
    print(f"  Config: {project_dir / 'scroll_config.yaml'}")
    print(f"  Images: {project_dir / 'public/images/'}")
    print()
    print("  Next steps:")
    print(f"    1. Place scroll images in public/images/{scroll_id}/")
    print("    2. Edit scroll_config.yaml with your metadata")
    print("    3. Run sync (see README.md for instructions)")
    print()


if __name__ == "__main__":
    main()
