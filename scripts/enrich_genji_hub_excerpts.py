# -*- coding: utf-8 -*-
"""Remap / enrich chapters-of-genji.json hub source URLs and pilot excerpts.

Field contract:
  summary       = あらすじのみ
  kobun         = 古文抜粋（JA）
  gendaibun     = 現代文抜粋（JA）
  kobunen       = 古文抜粋の英訳（パイロットのみ）
  gendaibunen   = 現代文抜粋の英訳（パイロットのみ）
  desc/descen   = 持たない（削除済み）

Wikisource: 源氏物語/{帖名}
Aozora Yosano: card 5016–5071（54帖↔56分冊対応）
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "src/data/emaki-text-data/chapters-of-genji.json"

WIKI_TITLE = {"少女": "乙女", "匂宮": "匂兵部卿"}

AOZORA_CARD = {
    1: 5016,
    2: 5017,
    3: 5018,
    4: 5019,
    5: 5020,
    6: 5021,
    7: 5022,
    8: 5023,
    9: 5024,
    10: 5025,
    11: 5026,
    12: 5027,
    13: 5028,
    14: 5029,
    15: 5030,
    16: 5031,
    17: 5032,
    18: 5033,
    19: 5034,
    20: 5035,
    21: 5036,
    22: 5037,
    23: 5038,
    24: 5039,
    25: 5040,
    26: 5041,
    27: 5042,
    28: 5043,
    29: 5044,
    30: 5045,
    31: 5046,
    32: 5047,
    33: 5048,
    34: 5049,
    35: 5050,
    36: 5051,
    37: 5052,
    38: 5053,
    39: 5054,
    40: 5056,
    41: 5057,
    42: 5059,
    43: 5060,
    44: 5061,
    45: 5062,
    46: 5063,
    47: 5064,
    48: 5065,
    49: 5066,
    50: 5067,
    51: 5068,
    52: 5069,
    53: 5070,
    54: 5071,
}

EXCERPTS = {
    "1": {
        "kobun": (
            "いづれの御時にか、女御、更衣あまたさぶらひたまひける中に、"
            "いとやむごとなき際にはあらぬが、すぐれて時めきたまふありけり。"
            "はじめより我はと思ひあがりたまへる御方がた、めざましきものに推しなして、"
            "いとどあつしくなりゆき、殿上人なども、あんなりの人の御忍びありきや、"
            "心づきなしと思いつつ、怨じの心を加へたる。……"
        ),
        "gendaibun": (
            "どの帝の御代であったか、女御や更衣たちが大勢お仕えしている中に、"
            "たいして高い身分ではなかったが、だれよりも帝の寵愛を一身に集めていらした方があった。"
            "最初から自分こそはとプライドを持っていられた他の御方々は、目ざわりな者として扱い、"
            "ますます意地悪くなってゆく。……"
        ),
        "kobunen": (
            "In which reign was it? Among the many Consorts and Intimates in service, "
            "there was one who, though not of the very highest rank, enjoyed exceptional favor. "
            "Ladies who from the first had thought highly of themselves treated her as an affront "
            "and grew ever more spiteful; even the courtiers, hearing of the Emperor's secret visits, "
            "felt displeased and added their resentment. …"
        ),
        "gendaibunen": (
            "In which emperor's reign was it? Among the many Consorts and Intimates serving at court, "
            "there was one who was not of especially high birth, yet she alone received the Emperor's fullest favor. "
            "The other ladies, who had prided themselves from the start, treated her as an eyesore "
            "and grew ever more spiteful. …"
        ),
    },
    "36": {
        "kobun": (
            "女三の宮の御事は、まして人の聞こえもゆゆしく、"
            "内裏にも、いかにと聞こし召したるにや、"
            "いとほしう思しのたまはするをりをりあり。……"
        ),
        "gendaibun": (
            "女三の宮のご病気のことは、世間の噂もいまいましく、"
            "内裏でもどのようにお聞きになっているのか、"
            "お気の毒にと思ってお言葉をくださるときがある。……"
        ),
        "kobunen": (
            "As for the Third Princess, the talk of others was all the more ominous; "
            "even at the palace, he seemed to hear how things stood and would from time to time "
            "speak words of pity. …"
        ),
        "gendaibunen": (
            "Word of the Third Princess's illness was still more distressing in the world's gossip; "
            "even at the palace, he wondered how they had heard of it, and there were times "
            "when he offered words of sympathy, feeling for her. …"
        ),
    },
    "45": {
        "kobun": (
            "そのころ、世にかずまへられたまはぬ古宮おはしけり。"
            "母宮に後れたまひて、中将の君と聞ゆる御子たちを率て、"
            "宇治の山庄にこもりゐたまへり。……"
        ),
        "gendaibun": (
            "そのころ、世間であまり顧みられなかった古い宮がいらした。"
            "母宮に先立たれ、中将の君と呼ばれる御子たちを連れて、"
            "宇治の山庄に引きこもっていられた。……"
        ),
        "kobunen": (
            "In those days there was an aged prince whom the world scarcely counted among its number. "
            "Having lost his mother the princess, he withdrew with the young men known as the Middle Captain's sons "
            "to a mountain villa at Uji. …"
        ),
        "gendaibunen": (
            "In those days there was an old prince whom the world little regarded. "
            "After his mother the princess died, he took the young men called the Middle Captain's sons "
            "and shut himself away in a mountain villa at Uji. …"
        ),
    },
}


def wiki_url(title: str) -> str:
    wiki_title = WIKI_TITLE.get(title, title)
    page = f"源氏物語/{wiki_title}"
    return "https://ja.wikisource.org/wiki/" + quote(page, safe="/")


def aozora_url(chapter_en: int) -> str:
    card = AOZORA_CARD[chapter_en]
    return f"https://www.aozora.gr.jp/cards/000052/card{card}.html"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--with-excerpts",
        action="store_true",
        help="Also (re)write pilot kobun/gendaibun/kobunen/gendaibunen",
    )
    args = parser.parse_args()

    data = json.loads(PATH.read_text(encoding="utf-8"))
    for e in data:
        ch = int(e["chapter_en"])
        e["source_kobun_url"] = wiki_url(e["title"])
        e["source_gendaibun_url"] = aozora_url(ch)
        e.pop("desc", None)
        e.pop("descen", None)
        e.pop("excerpt_kobun", None)
        e.pop("excerpt_gendaibun", None)
        e.setdefault("kobunen", "")
        e.setdefault("gendaibunen", "")
        if args.with_excerpts:
            pilot = EXCERPTS.get(str(ch))
            if pilot:
                e["kobun"] = pilot["kobun"]
                e["gendaibun"] = pilot["gendaibun"]
                e["kobunen"] = pilot["kobunen"]
                e["gendaibunen"] = pilot["gendaibunen"]

    PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print("updated", len(data))
    for e in data[:1] + [data[35], data[44]]:
        print(
            f"ch{e['chapter_en']} kobun={len(e.get('kobun') or '')} "
            f"kobunen={len(e.get('kobunen') or '')} "
            f"gendaibun={len(e.get('gendaibun') or '')} "
            f"gendaibunen={len(e.get('gendaibunen') or '')}"
        )


if __name__ == "__main__":
    main()
