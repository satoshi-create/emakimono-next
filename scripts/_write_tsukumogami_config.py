#!/usr/bin/env python3
"""Write scroll_config.yaml with summarized commentary (not verbatim RMDA)."""

from __future__ import annotations

from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "scrolls" / "tsukumogami" / "scroll_config.yaml"

HEADER = """\
# 付喪神絵巻 — 国立国会図書館所蔵（上下合冊・加工画像 1 スクロール）
# 段構成: sources/scene-mapping.csv（slot 種別反映）
# 解説 gendaibun: 京都大学 RMDA「お伽草子 第5話」を参考にした独自要約（全文転載なし）
# kotobagaki_mode: explicit — 各段先頭を ekotoba（解説バー・段タイトルの正本）
scroll_id: tsukumogami
volume_num: 1
theme_id: tsukumogami
folder: emakimono

metadata:
  id: 100
  title: 付喪神絵巻
  titleen: tsukumogami
  author: 作者不詳
  authoren: anonymous
  edition: 国立国会図書館本（模本・上下合冊）
  era: 室町
  eraen: muromachi
  type: 絵巻
  typeen: emaki
  desc: 国立国会図書館所蔵の付喪神絵巻。煤払いで捨てられた古道具が付喪神となり都を騒がすが、改心ののち仏門修行を経て成仏する物語絵巻。
  descen: Tsukumogami emaki (National Diet Library). Household objects discarded at year-end susuharai become tsukumogami spirits; after repentance they undertake Buddhist practice and attain enlightenment.
  thumb: /thumb/tsukumogami_thumb.webp
  thumb2: ""
  backgroundImage: ""
  video: ""
  sourceImageUrl: https://dl.ndl.go.jp/pid/2574271
  sourceImage: 付喪神絵巻（国立国会図書館）
  sourceAuthor: National Diet Library, JAPAN
  sourceCollection: 国立国会図書館（請求記号 す-36）
  # 表示は formatSourceAttribution の ndl プロバイダ（転載条件ページ）に委譲。PDM 文字列はバッジ未対応のため空。
  sourceLicense: ""
  encodeUrl: ""
  favorite: false
  kotobagaki: true
  readMore: false
  reference:
    - type: 所蔵機関（上巻）
      url: https://dl.ndl.go.jp/pid/2574271
      title: 付喪神絵巻（上）| 国立国会図書館デジタルコレクション
    - type: 転載条件
      url: https://www.ndl.go.jp/use/reproduction
      title: 国立国会図書館ウェブサイトからのコンテンツの転載
    - type: あらすじ参考
      url: https://rmda.kulib.kyoto-u.ac.jp/item/rb00013599/explanation/otogi_05
      title: 挿絵とあらすじで楽しむお伽草子 第5話 付喪神 | 京都大学
    - type: 所蔵機関（下巻）
      url: https://dl.ndl.go.jp/pid/2574272
      title: 付喪神絵巻（下）| 国立国会図書館デジタルコレクション
  keywords:
    - { name: 付喪神, id: tsukumogami, slug: tsukumogami }
    - { name: 妖怪, id: yokai, slug: yokai }
    - { name: 仏教, id: buddhism, slug: buddhism }
    - { name: 御伽草子, id: otogizoshi, slug: otogizoshi }
    - { name: 絵巻, id: emaki, slug: emaki }
  kotobagaki_mode: explicit
  sceneText: true

scenes:
"""

SCENES = [
    {
        "id": 1,
        "title": "陰陽雑記・付喪神とは",
        "titleen": "Origin of tsukumogami",
        "range": [1, 2],
        "slots": ["ekotoba", "image"],
        "gendaibun": (
            "『陰陽雑記』によれば、百年を経た器物には魂が宿り、人の心を惑わす——これが付喪神（つくもがみ）と呼ばれるものです。"
            "<br><br>"
            "都では新年の煤払（すすはらい）に古道具を路地へ捨てる風習があり、付喪神の災いを避けるための行事でもあります。"
            "物語は、その習慣の裏側で起きた出来事から始まります。"
        ),
    },
    {
        "id": 2,
        "title": "人間への復讐を企てる古道具たち",
        "titleen": "Tools plot revenge against humans",
        "range": [3, 4],
        "slots": ["ekotoba", "image"],
        "gendaibun": (
            "康保の頃、煤払いで捨てられた古道具たちが集まり、長年の奉公への報いもなく路傍に捨てられた恨みを語り合います。"
            "復讐を企てる中、数珠の一連入道が「仇を恩で返せ」と諫言しますが、手棒の荒太郎に打ち倒されてしまいます。"
            "<br><br>"
            "相談は続き、古文先生は節分に陰陽が入れ替わる時節に命を絶てば造化の神が妖物へと作り替えてくれる、と教えます。"
        ),
    },
    {
        "id": 3,
        "title": "一連入道の和歌と節分の大変身",
        "titleen": "Ichiren's waka and Setsubun transformation",
        "range": [5, 6],
        "slots": ["ekotoba", "image"],
        "gendaibun": (
            "打たれた一連入道は悔しさに堪えず仕返しを望みますが、弟子たちに引き留められ和歌を詠んで心を鎮めます。"
            "<br><br>"
            "やがて節分の夜。古文先生の教えに従い、古道具たちは命を絶ち造化の神に身を委ね、"
            "男女人老若・鬼や獣の姿など、さまざまな妖怪へと変わり果てます。"
        ),
    },
    {
        "id": 4,
        "title": "船岡山の暴れと宴楽",
        "titleen": "Funaoka lair and revelry",
        "range": [7, 8],
        "slots": ["ekotoba", "image"],
        "gendaibun": (
            "妖怪たちは都近くの船岡山の奥を住処と定め、都へ出ては人や牛馬を襲い、捨てられた恨みを晴らします。"
            "人々は目に見えぬ化け物を退治できず、神仏に祈るばかりです。"
            "<br><br>"
            "妖怪の方は酒宴と舞遊びにふけり、都を侵すたびに宴を開くなど、調子に乗った有様です。"
        ),
    },
    {
        "id": 5,
        "title": "和歌と変化大明神の神事",
        "titleen": "Waka and rites of Henge Daimyojin",
        "range": [9, 10],
        "slots": ["ekotoba", "image"],
        "gendaibun": (
            "宴のさなか、妖怪たちは「花」を題に和歌を詠み、立春から魂を得た自分たちの変化を歌に込めます。"
            "<br><br>"
            "造化の神を祀らねば心ない木石と同じだ、という声から、船岡山の奥に変化大明神を祀り、"
            "神主や神楽男を定めて朝夕の神事を行うようになります。"
        ),
    },
    {
        "id": 6,
        "title": "一条大路の行列と尊勝陀羅尼",
        "titleen": "Procession on Ichijo and Sonsho Darani",
        "range": [11, 14],
        "slots": ["ekotoba", "image", "image", "image"],
        "gendaibun": (
            "神輿を作り、卯月五日の深夜に一条大路を行列する妖怪たち。"
            "臨時の除目のため同じ大路を進む関白殿下と鉢合わせし、従者たちは気絶するほどの恐れを見せます。"
            "<br><br>"
            "しかし殿下は動じず、お守りから炎が噴き出して妖怪一行を退散させます。"
            "そのお守りには、僧正が書写した尊勝陀羅尼が入っていたと後に明らかになります。"
        ),
    },
    {
        "id": 7,
        "title": "僧正の祈祷",
        "titleen": "Sojo's ritual",
        "range": [15, 16],
        "slots": ["ekotoba", "image"],
        "gendaibun": (
            "下巻。関白殿下は騒ぎを帝に奏上し、占いの結果、神社への幣奉納と寺での祈祷が始まります。"
            "昨夜の炎は尊勝陀羅尼の力と知られた僧正が、勅命により清涼殿で如法尊勝の大法を修します。"
            "<br><br>"
            "高徳の僧侶たちが護摩を焚き、数珠を振り、都の安泰を祈念する法会が行われます。"
        ),
    },
    {
        "id": 8,
        "title": "護法童子の顕現と退治",
        "titleen": "Dharmapalas subdue yokai",
        "range": [17, 18],
        "slots": ["ekotoba", "image"],
        "gendaibun": (
            "法会六日目、帝が清涼殿へ向かう途中、御殿の上に光が現れ、武装した護法童子たちが姿を見せます。"
            "光は北へ飛び去り、不動明王の眷属が悪を調伏する兆しと解されます。"
            "<br><br>"
            "護法童子は妖怪の城へ向かい、危害を止め仏教を尊ぶと約束するなら命だけは助けると告げ、"
            "退治のうえ妖怪たちは改心を誓います。"
        ),
    },
    {
        "id": 9,
        "title": "発心と上人への旅立ち",
        "titleen": "Repentance and journey",
        "range": [19, 20],
        "slots": ["ekotoba", "image"],
        "gendaibun": (
            "命を助けられた妖怪たちは、これまでの殺生を悔い、仏罰を受けたのは当然の報いだと悟ります。"
            "そして仏教に帰依して菩提を求めようと、たちまち道心を発します。"
            "<br><br>"
            "師となるべきは、かつて諫言した数珠の一連上人——以前辱めた罪を懺悔すれば許していただけるだろう、"
            "と決めて山奥を尋ねる旅立ちを始めます。"
        ),
    },
    {
        "id": 10,
        "title": "一連上人の庵で懺悔",
        "titleen": "Confession at the hermitage",
        "range": [21, 22],
        "slots": ["ekotoba", "image"],
        "gendaibun": (
            "一連上人は前年の一件から世を厭い、山奥の庵に隠棲していました。"
            "日暮れ、恐ろしい姿の来客——それが古道具の妖怪たちです。"
            "<br><br>"
            "彼らは変化の経緯と発心を告白し、荒太郎は心から懺悔します。"
            "上人は「お前がわしを打ったからこそ発心した。これも因縁」と許し、皆を喜んで迎え入れます。"
        ),
    },
    {
        "id": 11,
        "title": "出家と真言の教え",
        "titleen": "Ordination and Shingon",
        "range": [23, 24],
        "slots": ["ekotoba", "image"],
        "gendaibun": (
            "妖怪たちは上人のもとで出家し、熱心に修行に励みます。"
            "速やかに悟りを開きたいとの願いに、上人は諸宗の教えは一つながら、"
            "即身成仏の道として真言密教こそ最も力がある、と説きます。"
            "<br><br>"
            "弘法大師の即身成仏の理えを引き合いに、妖怪たちは真言の教えを受け、"
            "器としての広さゆえに教えを十分に受け止める姿も描かれます。"
        ),
    },
    {
        "id": 12,
        "title": "一連上人の成仏と遁世",
        "titleen": "Master's parinirvana",
        "range": [25, 27],
        "slots": ["ekotoba", "image", "image"],
        "gendaibun": (
            "年月を経て、上人は教えを尽くし伝え終えたと告げ、108歳にしてその場で即身成仏します。"
            "光に満ちた部屋を目の当たりにし、弟子たちの信心はますます深まります。"
            "<br><br>"
            "その後、甘えが修行を妨げるとの提案から、妖怪たちは名残惜しみながらも"
            "おのおの深山幽谷へ分かれ、俗世との縁を断って精進することになります。"
        ),
    },
    {
        "id": 13,
        "title": "各自成仏・結び",
        "titleen": "Enlightenment and closing",
        "range": [28, 31],
        "slots": ["ekotoba", "image", "image", "image"],
        "gendaibun": (
            "岩間や松の下に庵を結び、各自が修行を続けた妖怪たちは、ついにそれぞれ即身成仏を遂げます。"
            "修行により現れた仏の姿は人それぞれ異なり、真言宗の教えの深さを物語ります。"
            "<br><br>"
            "心のない器物さえ成仏しうる——この奇談は、草木国土悉皆成仏の思想と"
            "非情成仏の教えを伝える物語として結ばれます。"
        ),
    },
]


def yaml_text_block(text: str) -> str:
    """Single-quoted gendaibun with <br><br> paragraph breaks (viewer html-react-parser)."""
    escaped = text.replace("'", "''")
    return f"    gendaibun: '{escaped}'\n    kobun: ''\n    desc: ''"


def scene_yaml(scene: dict) -> str:
    rs, re = scene["range"]
    lines = [
        f"- id: {scene['id']}",
        f"  title: \"{scene['title']}\"",
        f"  titleen: \"{scene['titleen']}\"",
        f"  range: [{rs}, {re}]",
        "  slots:",
    ]
    for slot in scene["slots"]:
        lines.append(f"    - {slot}")
    lines.append("  text:")
    lines.append(yaml_text_block(scene["gendaibun"]).rstrip())
    return "\n".join(lines)


def main() -> None:
    body = HEADER + "\n".join(scene_yaml(s) for s in SCENES) + "\n"
    OUT.write_text(body, encoding="utf-8")
    print(f"wrote {OUT} ({len(body.splitlines())} lines)")


if __name__ == "__main__":
    main()
