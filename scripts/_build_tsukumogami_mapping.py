#!/usr/bin/env python3
"""Build scene-mapping files and update scroll_config.yaml for tsukumogami."""

from __future__ import annotations

import csv
import re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
BASE = REPO / "scrolls" / "tsukumogami" / "sources"
CONFIG = REPO / "scrolls" / "tsukumogami" / "scroll_config.yaml"

SCENES = [
    (1, 1, 2, "陰陽雑記・付喪神とは", "Origin of tsukumogami", "冒頭词書・付喪神の説明"),
    (2, 3, 4, "煤払いと古道具の怨み", "Susuharai and resentment", "捨てられた道具・復讐の相談"),
    (3, 5, 5, "一連入道の諫言", "Ichiren Nyudo's counsel", "数珠一連入道「仇を恩で返せ」"),
    (4, 6, 7, "古文先生と節分の教え", "Setsubun transformation", "荒太郎の暴行・節分待ち"),
    (5, 8, 9, "節分の夜・大変身", "Night of transformation", "妖怪へ変化"),
    (6, 10, 12, "船岡山の宴楽と神事", "Funaokayama revelry and rites", "都を荒らす・変化大明神"),
    (7, 13, 14, "卯月五日の行列と関白", "Procession and Kanpaku", "一条大路・尊勝陀羅尼"),
    (8, 15, 16, "僧正の祈祷", "Sojo's ritual", "下巻開始・法会"),
    (9, 17, 18, "護法童子の顕現と退治", "Dharmapalas subdue yokai", "清涼殿・退治"),
    (10, 19, 20, "発心と上人への旅立ち", "Repentance and journey", "道心・山奥へ"),
    (11, 21, 22, "一連上人の庵で懺悔", "Confession at the hermitage", "許し・因縁"),
    (12, 23, 24, "出家と真言の教え", "Ordination and Shingon", "真言密教を学ぶ"),
    (13, 25, 27, "一連上人の成仏と遁世", "Master's parinirvana", "即身成仏・別々に修行"),
    (14, 28, 31, "各自成仏・結び", "Enlightenment and closing", "成仏・非情成仏の教え"),
]

IMAGE_NOTES: dict[int, tuple[str, str]] = {
    1: ("mixed", "词書（陰陽雑記）＋冒頭挿絵"),
    2: ("mixed", "词書続き＋煤払い・捨て道具（超横長）"),
    3: ("illustration", "捨てられた古道具・相談の絵"),
    4: ("illustration", "復讐を企てる古道具たち"),
    5: ("text_heavy", "词書（一連入道の諫言・古文先生）"),
    6: ("illustration", "荒太郎が一連入道を打つ"),
    7: ("illustration", "悔しがる一連入道と弟子 / 節分待ち"),
    8: ("illustration", "節分の夜・妖怪変化（横長）"),
    9: ("illustration", "妖怪となった古道具たち"),
    10: ("illustration", "船岡山・飲めや歌え"),
    11: ("text_heavy", "和歌・词書"),
    12: ("illustration", "神事・変化大明神（横長）"),
    13: ("illustration", "お祭り行列 1–2（超横長）"),
    14: ("illustration", "行列・関白殿下・炎（超横長）"),
    15: ("text_heavy", "下巻词書（関白・僧正・祈祷）"),
    16: ("mixed", "僧正参内・法会（横長）"),
    17: ("illustration", "護法童子の顕現（幅狭）"),
    18: ("illustration", "護法童子による退治"),
    19: ("illustration", "発心する妖怪たち"),
    20: ("illustration", "一連上人のもとへ旅立つ"),
    21: ("illustration", "庵をたずねる妖怪"),
    22: ("illustration", "懺悔と許し（横長）"),
    23: ("text_heavy", "出家・真言教え（词書含む）"),
    24: ("illustration", "修行の様子"),
    25: ("illustration", "一連上人の最期"),
    26: ("text_heavy", "上人即身成仏（词書）"),
    27: ("illustration", "別々に遁世"),
    28: ("illustration", "深山での修行"),
    29: ("text_heavy", "成仏の词書（幅狭）"),
    30: ("illustration", "仏になった妖怪たち（金泥風）"),
    31: ("mixed", "結び・非情成仏の教え"),
}


def scene_by_index() -> dict[int, tuple]:
    mapping: dict[int, tuple] = {}
    for sid, rs, re, tja, ten, beat in SCENES:
        for index in range(rs, re + 1):
            mapping[index] = (sid, tja, ten, beat, rs, re)
    return mapping


def build_scenes_yaml() -> str:
    lines = ["scenes:"]
    for sid, rs, re, tja, ten, _ in SCENES:
        lines.extend(
            [
                f"  - id: {sid}",
                f'    title: "{tja}"',
                f'    titleen: "{ten}"',
                f"    range: [{rs}, {re}]",
                "",
            ]
        )
    return "\n".join(lines).rstrip() + "\n"


def build_markdown() -> str:
    rows = [
        "# 付喪神絵巻 — 段構成対応表（草案）",
        "",
        "加工画像 **31 枚**（`_01-975.jpg` … `_31-975.jpg`）を **14 段**にグループ化した草案。",
        "",
        "- **編集用 CSV:** `scene-mapping.csv`",
        "- **段サマリー CSV:** `scenes-summary.csv`",
        "- **状態:** 目視確認前（`confidence=draft`）",
        "",
        "## 段一覧",
        "",
        "| 段 id | range | 枚数 | タイトル（ja） | titleen |",
        "|------|-------|------|----------------|---------|",
    ]
    for sid, rs, re, tja, ten, _ in SCENES:
        rows.append(f"| {sid} | {rs}–{re} | {re - rs + 1} | {tja} | {ten} |")
    rows.extend(["", "## 画像別メモ", "", "| index | 内容 |", "|------|------|"])
    for index in range(1, 32):
        _, desc = IMAGE_NOTES[index]
        rows.append(f"| {index} | {desc} |")
    return "\n".join(rows) + "\n"


def write_csv_files() -> None:
    BASE.mkdir(parents=True, exist_ok=True)
    index_map = scene_by_index()

    with (BASE / "scene-mapping.csv").open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(
            [
                "global_index",
                "filename",
                "content_type",
                "visual_description_ja",
                "story_beat_ja",
                "scene_id",
                "scene_title_ja",
                "scene_title_en",
                "range_start",
                "range_end",
                "confidence",
                "notes",
            ]
        )
        for index in range(1, 32):
            sid, tja, ten, beat, rs, re = index_map[index]
            ctype, desc = IMAGE_NOTES[index]
            writer.writerow(
                [
                    index,
                    f"_{index:02d}-975.jpg",
                    ctype,
                    desc,
                    beat,
                    sid,
                    tja,
                    ten,
                    rs,
                    re,
                    "draft",
                    "",
                ]
            )

    with (BASE / "scenes-summary.csv").open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(
            [
                "scene_id",
                "title_ja",
                "title_en",
                "range_start",
                "range_end",
                "image_count",
                "story_beat_ja",
                "confidence",
                "notes",
            ]
        )
        for sid, rs, re, tja, ten, beat in SCENES:
            writer.writerow([sid, tja, ten, rs, re, re - rs + 1, beat, "draft", ""])


def update_scroll_config() -> None:
    text = CONFIG.read_text(encoding="utf-8")
    scenes_yaml = build_scenes_yaml()

    if re.search(r"^scenes:\s*$", text, flags=re.MULTILINE):
        text = re.sub(
            r"^scenes:\s*\n.*\Z",
            scenes_yaml,
            text,
            flags=re.DOTALL | re.MULTILINE,
        )
    else:
        text = text.rstrip() + "\n\n" + scenes_yaml

    text = re.sub(
        r"^  edition: .*$",
        '  edition: "国立国会図書館本（模本・上下合冊）"',
        text,
        flags=re.MULTILINE,
    )

    if 'id: "otogizoshi"' not in text:
        text = text.replace(
            '    - { name: "絵巻", id: "emaki", slug: "emaki" }',
            '    - { name: "御伽草子", id: "otogizoshi", slug: "otogizoshi" }\n'
            '    - { name: "絵巻", id: "emaki", slug: "emaki" }',
        )

    if "rmda.kulib.kyoto-u.ac.jp" not in text:
        text = text.replace(
            '    - type: "所蔵機関（下巻）"',
            '    - type: "あらすじ参考"\n'
            '      url: "https://rmda.kulib.kyoto-u.ac.jp/item/rb00013599/explanation/otogi_05"\n'
            '      title: "挿絵とあらすじで楽しむお伽草子 第5話 付喪神 | 京都大学"\n'
            '    - type: "所蔵機関（下巻）"',
        )

    text = re.sub(
        r"# TODO: 加工画像.*\n",
        "# 段構成: sources/scene-mapping.md / scene-mapping.csv（2026-08-22 草案）\n",
        text,
    )

    CONFIG.write_text(text, encoding="utf-8")


def main() -> None:
    write_csv_files()
    (BASE / "scene-mapping.md").write_text(build_markdown(), encoding="utf-8")
    (BASE / "scenes-draft.yaml").write_text(build_scenes_yaml(), encoding="utf-8")
    update_scroll_config()
    print(f"Updated {CONFIG}")
    print(f"Wrote {BASE / 'scene-mapping.csv'}")
    print(f"Wrote {BASE / 'scenes-summary.csv'}")
    print(f"Wrote {BASE / 'scene-mapping.md'}")


if __name__ == "__main__":
    main()
