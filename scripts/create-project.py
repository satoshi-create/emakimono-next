#!/usr/bin/env python3
"""
create-project.py — Scaffold a new emaki scroll under scrolls/{scroll_id}/.

Usage:
  py -3.14 scripts/create-project.py my-new-scroll
  py -3.14 scripts/create-project.py tsukumogami --title-ja "付喪神絵巻" --ndl-pid 2574271,2574272
"""

from __future__ import annotations

import argparse
import csv
import shutil
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
TEMPLATE_DIR = REPO_ROOT / "scrolls" / "_template"

SOURCES_README = """# sources/ — 参考資料（sync には直接使わない）

- NDL manifest やあらすじ原文は **出典メタ・執筆参考** として保管する
- manifest の canvas 枚数・サイズは **加工済み images/ と無関係**
- 上下2巻など複数 PID があっても **scroll_id は 1 つ**（加工画像を 1 scroll に統合）

## 段構成の正本

| ファイル | 役割 |
|---------|------|
| `scenes-summary.csv` | 段タイトル・range の正本（推奨） |
| `scene-mapping.csv` | 画像ごとの目視メモ（任意） |

CSV 更新後:

```powershell
py -3.14 scripts/build_scene_mapping.py scrolls/{scroll_id}/ --write-yaml
py -3.14 scripts/preflight_upstream.py scrolls/{scroll_id}/
```
"""

SCENES_SUMMARY_HEADER = [
    "scene_id",
    "title_ja",
    "title_en",
    "range_start",
    "range_end",
    "image_count",
    "slot_types",
    "confidence",
    "notes",
]


def sanitize_scroll_id(name: str) -> str:
    return name.lower().replace(" ", "-").replace("_", "-")


def write_scenes_summary_template(path: Path) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(SCENES_SUMMARY_HEADER)
        writer.writerow([1, "第1段", "Scene 1", 1, 1, 1, "", "draft", "TODO: update after image review"])


def apply_metadata(
    config_path: Path,
    *,
    scroll_id: str,
    title_ja: str | None,
    title_en: str | None,
    ndl_pids: list[str],
    kotobagaki: bool,
    kotobagaki_mode: str | None,
) -> None:
    content = config_path.read_text(encoding="utf-8")
    content = content.replace("my-scroll-id", scroll_id)
    content = content.replace("my-theme", scroll_id.split("-")[0])
    content = content.replace("my_scroll_slug", scroll_id.replace("-", "_"))

    if title_ja:
        content = content.replace('title: "エンタイトル"', f'title: "{title_ja}"')
    if title_en:
        content = content.replace('titleen: "my_scroll_slug"', f'titleen: "{title_en}"')
        content = content.replace(f'titleen: "{scroll_id.replace("-", "_")}"', f'titleen: "{title_en}"')

    if ndl_pids:
        primary = f"https://dl.ndl.go.jp/pid/{ndl_pids[0]}"
        content = content.replace('sourceImageUrl: ""', f'sourceImageUrl: "{primary}"')
        refs_lines = "\n".join(
            f'    - type: "NDL"\n      url: "https://dl.ndl.go.jp/pid/{pid}"\n      title: "国立国会図書館デジタルコレクション"'
            for pid in ndl_pids
        )
        if "references:" not in content:
            content = content.replace(
                "  keywords:",
                f"  references:\n{refs_lines}\n  keywords:",
            )

    if kotobagaki:
        content = content.replace("kotobagaki: false", "kotobagaki: true", 1)
        if kotobagaki_mode and "kotobagaki_mode:" not in content:
            content = content.replace(
                "  kotobagaki: true",
                f'  kotobagaki: true\n  kotobagaki_mode: "{kotobagaki_mode}"',
                1,
            )

    config_path.write_text(content, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Scaffold a new scroll under scrolls/{scroll_id}/")
    parser.add_argument("name", help="scroll-id or display name (kebab-case)")
    parser.add_argument("--title-ja", help="metadata.title")
    parser.add_argument("--title-en", help="metadata.titleen")
    parser.add_argument("--ndl-pid", help="Comma-separated NDL pid(s), e.g. 2574271,2574272")
    parser.add_argument("--kotobagaki", action="store_true", help="Set metadata.kotobagaki: true")
    parser.add_argument(
        "--kotobagaki-mode",
        choices=("alternating", "explicit"),
        help="metadata.kotobagaki_mode when --kotobagaki",
    )
    args = parser.parse_args()

    scroll_id = sanitize_scroll_id(args.name)
    project_dir = REPO_ROOT / "scrolls" / scroll_id

    if project_dir.exists():
        print(f"Error: Directory already exists: {project_dir}")
        sys.exit(1)

    if not TEMPLATE_DIR.exists():
        print(f"Error: Template not found: {TEMPLATE_DIR}")
        sys.exit(1)

    shutil.copytree(TEMPLATE_DIR, project_dir)

    ndl_pids = [part.strip() for part in (args.ndl_pid or "").split(",") if part.strip()]
    config_path = project_dir / "scroll_config.yaml"
    apply_metadata(
        config_path,
        scroll_id=scroll_id,
        title_ja=args.title_ja,
        title_en=args.title_en,
        ndl_pids=ndl_pids,
        kotobagaki=args.kotobagaki,
        kotobagaki_mode=args.kotobagaki_mode,
    )

    sources_dir = project_dir / "sources"
    sources_dir.mkdir(exist_ok=True)
    (sources_dir / "README.md").write_text(SOURCES_README.replace("{scroll_id}", scroll_id), encoding="utf-8")
    write_scenes_summary_template(sources_dir / "scenes-summary.csv")

    print(f"\n  Created scroll project: {project_dir}")
    print(f"  Config: {config_path}")
    print(f"  Images: {project_dir / 'images'}")
    print(f"  Sources: {sources_dir}")
    print()
    print("  Next steps:")
    print(f"    1. Place scroll images in scrolls/{scroll_id}/images/")
    print(f"    2. py -3.14 scripts/normalize_scroll_images.py scrolls/{scroll_id}/ --fix")
    print(f"    3. Edit sources/scenes-summary.csv (confidence=draft → reviewed)")
    print(f"    4. py -3.14 scripts/build_scene_mapping.py scrolls/{scroll_id}/ --write-yaml")
    print(f"    5. py -3.14 scripts/preflight_upstream.py scrolls/{scroll_id}/")
    print(f"    6. py -3.14 scripts/sync_all.py scrolls/{scroll_id}/scroll_config.yaml --dry-run")
    print()


if __name__ == "__main__":
    main()
