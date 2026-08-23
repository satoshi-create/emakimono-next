#!/usr/bin/env python3
"""Write scroll_config.yaml with summarized commentary (not verbatim RMDA)."""

from __future__ import annotations

from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "scrolls" / "tsukumogami" / "scroll_config.yaml"

HEADER = """\
# 付喪神絵巻 — 国立国会図書館所蔵（上下合冊・加工画像 1 スクロール）
# 段構成: sources/scene-mapping.csv（slot 種別反映）
# 層1 gendaibun（短い現代文）/ 層2 desc・descen（解説 ja/en）
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
            "百年を経た器物に魂が宿るという付喪神の話と、都の煤払いの風習から物語が始まります。"
        ),
        "desc": (
            "『陰陽雑記』によれば、百年を経た器物には魂が宿り、人の心を惑わす——これが付喪神（つくもがみ）と呼ばれるものです。"
            "<br><br>"
            "都では新年の煤払（すすはらい）に古道具を路地へ捨てる風習があり、付喪神の災いを避けるための行事でもあります。物語は、その習慣の裏側で起きた出来事から始まります。"
        ),
        "descen": (
            "According to the Onmyō Zakki, objects that have lasted a hundred years gain souls and unsettle human hearts—these are called tsukumogami."
            "<br><br>"
            "In the capital, people discard old tools in the alleys during the New Year soot-sweeping (susuharai), a custom meant to ward off tsukumogami calamities. The tale begins with what happened behind that practice."
        ),
    },
    {
        "id": 2,
        "title": "人間への復讐を企てる古道具たち",
        "titleen": "Tools plot revenge against humans",
        "range": [3, 4],
        "slots": ["ekotoba", "image"],
        "gendaibun": (
            "捨てられた古道具たちが復讐を企て、諫める一連入道は荒太郎に打ち倒されます。"
        ),
        "desc": (
            "康保の頃、煤払いで捨てられた古道具たちが集まり、長年の奉公への報いもなく路傍に捨てられた恨みを語り合います。復讐を企てる中、数珠の一連入道が「仇を恩で返せ」と諫言しますが、手棒の荒太郎に打ち倒されてしまいます。"
            "<br><br>"
            "相談は続き、古文先生は節分に陰陽が入れ替わる時節に命を絶てば造化の神が妖物へと作り替えてくれる、と教えます。"
        ),
        "descen": (
            "In the Kōhō era, discarded tools gather and share their resentment at being cast aside after years of service. As they plot revenge, the rosary monk Ichiren Nyūdō urges them to repay enmity with kindness, but he is struck down by the club-wielding Aratarō."
            "<br><br>"
            "Their council continues: Master Kobun teaches that if they end their lives at Setsubun, when yin and yang reverse, the god of creation will remake them as spirits."
        ),
    },
    {
        "id": 3,
        "title": "一連入道の和歌と節分の大変身",
        "titleen": "Ichiren's waka and Setsubun transformation",
        "range": [5, 6],
        "slots": ["ekotoba", "image"],
        "gendaibun": (
            "一連入道は和歌で心を鎮め、節分の夜に古道具たちは妖怪へと変わります。"
        ),
        "desc": (
            "打たれた一連入道は悔しさに堪えず仕返しを望みますが、弟子たちに引き留められ和歌を詠んで心を鎮めます。"
            "<br><br>"
            "やがて節分の夜。古文先生の教えに従い、古道具たちは命を絶ち造化の神に身を委ね、男女人老若・鬼や獣の姿など、さまざまな妖怪へと変わり果てます。"
        ),
        "descen": (
            "Beaten Ichiren longs for revenge, but his disciples restrain him and he calms himself by composing a waka."
            "<br><br>"
            "Then comes Setsubun night. Following Master Kobun’s teaching, the tools give up their lives and entrust themselves to the god of creation, transforming into all kinds of yokai—men and women, young and old, demons and beasts."
        ),
    },
    {
        "id": 4,
        "title": "船岡山の暴れと宴楽",
        "titleen": "Funaoka lair and revelry",
        "range": [7, 8],
        "slots": ["ekotoba", "image"],
        "gendaibun": (
            "妖怪たちは船岡山を住処に都を襲い、酒宴にふけります。"
        ),
        "desc": (
            "妖怪たちは都近くの船岡山の奥を住処と定め、都へ出ては人や牛馬を襲い、捨てられた恨みを晴らします。人々は目に見えぬ化け物を退治できず、神仏に祈るばかりです。"
            "<br><br>"
            "妖怪の方は酒宴と舞遊びにふけり、都を侵すたびに宴を開くなど、調子に乗った有様です。"
        ),
        "descen": (
            "The yokai make their lair deep in Mount Funaoka near the capital, raid people and livestock, and vent the grudge of being discarded. People cannot fight unseen monsters and can only pray to gods and buddhas."
            "<br><br>"
            "The yokai themselves feast, dance, and revel each time they strike the capital—growing ever more presumptuous."
        ),
    },
    {
        "id": 5,
        "title": "和歌と変化大明神の神事",
        "titleen": "Waka and rites of Henge Daimyojin",
        "range": [9, 10],
        "slots": ["ekotoba", "image"],
        "gendaibun": (
            "妖怪たちは和歌を詠み、船岡山に変化大明神を祀ります。"
        ),
        "desc": (
            "宴のさなか、妖怪たちは「花」を題に和歌を詠み、立春から魂を得た自分たちの変化を歌に込めます。"
            "<br><br>"
            "造化の神を祀らねば心ない木石と同じだ、という声から、船岡山の奥に変化大明神を祀り、神主や神楽男を定めて朝夕の神事を行うようになります。"
        ),
        "descen": (
            "Mid-banquet, the yokai compose waka on the theme of “flowers,” putting their Setsubun transformation into verse."
            "<br><br>"
            "Someone argues that without enshrining the god of creation they are no better than mindless wood and stone, so they dedicate Henge Daimyōjin deep on Mount Funaoka, appoint priests and kagura performers, and hold morning and evening rites."
        ),
    },
    {
        "id": 6,
        "title": "一条大路の行列と尊勝陀羅尼",
        "titleen": "Procession on Ichijo and Sonsho Darani",
        "range": [11, 14],
        "slots": ["ekotoba", "image", "image", "image"],
        "gendaibun": (
            "一条大路の行列で関白と鉢合わせし、尊勝陀羅尼のお守りが妖怪を退けます。"
        ),
        "desc": (
            "神輿を作り、卯月五日の深夜に一条大路を行列する妖怪たち。臨時の除目のため同じ大路を進む関白殿下と鉢合わせし、従者たちは気絶するほどの恐れを見せます。"
            "<br><br>"
            "しかし殿下は動じず、お守りから炎が噴き出して妖怪一行を退散させます。そのお守りには、僧正が書写した尊勝陀羅尼が入っていたと後に明らかになります。"
        ),
        "descen": (
            "Building a portable shrine, the yokai parade along Ichijō Avenue late on the fifth of the fourth month. They collide with the Chancellor, who is on the same road for an extraordinary appointment ceremony; his attendants faint with terror."
            "<br><br>"
            "The Chancellor is unmoved: flame bursts from his amulet and scatters the procession. The amulet, it later turns out, held a Sonshō Darani copied by a high priest."
        ),
    },
    {
        "id": 7,
        "title": "僧正の祈祷",
        "titleen": "Sojo's ritual",
        "range": [15, 16],
        "slots": ["ekotoba", "image"],
        "gendaibun": (
            "僧正が清涼殿で尊勝の大法を修し、都の安泰を祈ります。"
        ),
        "desc": (
            "下巻。関白殿下は騒ぎを帝に奏上し、占いの結果、神社への幣奉納と寺での祈祷が始まります。昨夜の炎は尊勝陀羅尼の力と知られた僧正が、勅命により清涼殿で如法尊勝の大法を修します。"
            "<br><br>"
            "高徳の僧侶たちが護摩を焚き、数珠を振り、都の安泰を祈念する法会が行われます。"
        ),
        "descen": (
            "Volume two. The Chancellor reports the uproar to the emperor; divination leads to offerings at shrines and prayers at temples. The priest who recognizes last night’s flame as the power of the Sonshō Darani performs the great Sonshō rite at the Seiryōden by imperial order."
            "<br><br>"
            "Virtuous monks burn goma fires, shake rosaries, and pray for the capital’s peace."
        ),
    },
    {
        "id": 8,
        "title": "護法童子の顕現と退治",
        "titleen": "Dharmapalas subdue yokai",
        "range": [17, 18],
        "slots": ["ekotoba", "image"],
        "gendaibun": (
            "護法童子が現れ妖怪を退治し、彼らは改心を誓います。"
        ),
        "desc": (
            "法会六日目、帝が清涼殿へ向かう途中、御殿の上に光が現れ、武装した護法童子たちが姿を見せます。光は北へ飛び去り、不動明王の眷属が悪を調伏する兆しと解されます。"
            "<br><br>"
            "護法童子は妖怪の城へ向かい、危害を止め仏教を尊ぶと約束するなら命だけは助けると告げ、退治のうえ妖怪たちは改心を誓います。"
        ),
        "descen": (
            "On the sixth day of the rite, as the emperor approaches the Seiryōden, light appears above the hall and armed dharmapāla youths reveal themselves. The light flies north—read as a sign that Fudō Myōō’s attendants are subduing evil."
            "<br><br>"
            "The dharmapālas go to the yokai fortress, spare their lives if they stop harming people and honor Buddhism, then defeat them; the yokai swear to reform."
        ),
    },
    {
        "id": 9,
        "title": "発心と上人への旅立ち",
        "titleen": "Repentance and journey",
        "range": [19, 20],
        "slots": ["ekotoba", "image"],
        "gendaibun": (
            "改心した妖怪たちは一連上人を師と仰ぎ、山奥への旅立ちを始めます。"
        ),
        "desc": (
            "命を助けられた妖怪たちは、これまでの殺生を悔い、仏罰を受けたのは当然の報いだと悟ります。そして仏教に帰依して菩提を求めようと、たちまち道心を発します。"
            "<br><br>"
            "師となるべきは、かつて諫言した数珠の一連上人——以前辱めた罪を懺悔すれば許していただけるだろう、と決めて山奥を尋ねる旅立ちを始めます。"
        ),
        "descen": (
            "Spared, the yokai repent their killings and see the Buddhist punishment as just. They resolve at once to take refuge in Buddhism and seek enlightenment."
            "<br><br>"
            "Their teacher, they decide, should be Ichiren Shōnin—the rosary master who once admonished them. They set out for the mountains to confess the insult they once dealt him."
        ),
    },
    {
        "id": 10,
        "title": "一連上人の庵で懺悔",
        "titleen": "Confession at the hermitage",
        "range": [21, 22],
        "slots": ["ekotoba", "image"],
        "gendaibun": (
            "庵で懺悔した妖怪たちを、一連上人は因縁として迎え入れます。"
        ),
        "desc": (
            "一連上人は前年の一件から世を厭い、山奥の庵に隠棲していました。日暮れ、恐ろしい姿の来客——それが古道具の妖怪たちです。"
            "<br><br>"
            "彼らは変化の経緯と発心を告白し、荒太郎は心から懺悔します。上人は「お前がわしを打ったからこそ発心した。これも因縁」と許し、皆を喜んで迎え入れます。"
        ),
        "descen": (
            "Since the previous year’s affair, Ichiren Shōnin has withdrawn to a hermitage deep in the mountains. At dusk, terrifying visitors arrive—the tool yokai."
            "<br><br>"
            "They confess their transformation and conversion; Aratarō repents from the heart. The master forgives them—“Your blow made me take the path; this too is karmic bond”—and welcomes them gladly."
        ),
    },
    {
        "id": 11,
        "title": "出家と真言の教え",
        "titleen": "Ordination and Shingon",
        "range": [23, 24],
        "slots": ["ekotoba", "image"],
        "gendaibun": (
            "出家した妖怪たちは、即身成仏の道として真言の教えを受けます。"
        ),
        "desc": (
            "妖怪たちは上人のもとで出家し、熱心に修行に励みます。速やかに悟りを開きたいとの願いに、上人は諸宗の教えは一つながら、即身成仏の道として真言密教こそ最も力がある、と説きます。"
            "<br><br>"
            "弘法大師の即身成仏の理えを引き合いに、妖怪たちは真言の教えを受け、器としての広さゆえに教えを十分に受け止める姿も描かれます。"
        ),
        "descen": (
            "The yokai take ordination under the master and train fervently. Wishing to awaken quickly, they hear that while all schools are one, Shingon esoteric Buddhism is the most powerful path to becoming a buddha in this body."
            "<br><br>"
            "Citing Kūkai’s teaching of sokushin jōbutsu, they receive Shingon instruction—and their very nature as vessels lets them take the teaching in fully."
        ),
    },
    {
        "id": 12,
        "title": "一連上人の成仏と遁世",
        "titleen": "Master's parinirvana",
        "range": [25, 27],
        "slots": ["ekotoba", "image", "image"],
        "gendaibun": (
            "上人が即身成仏したのち、弟子たちは深山へ分かれて精進します。"
        ),
        "desc": (
            "年月を経て、上人は教えを尽くし伝え終えたと告げ、108歳にしてその場で即身成仏します。光に満ちた部屋を目の当たりにし、弟子たちの信心はますます深まります。"
            "<br><br>"
            "その後、甘えが修行を妨げるとの提案から、妖怪たちは名残惜しみながらもおのおの深山幽谷へ分かれ、俗世との縁を断って精進することになります。"
        ),
        "descen": (
            "Years later the master declares his teaching complete and, at 108, attains buddhahood on the spot. Seeing the light-filled room, the disciples’ faith deepens."
            "<br><br>"
            "Then, lest dependence hinder practice, the yokai reluctantly part for remote mountains and valleys, cutting worldly ties to devote themselves to training."
        ),
    },
    {
        "id": 13,
        "title": "各自成仏・結び",
        "titleen": "Enlightenment and closing",
        "range": [28, 31],
        "slots": ["ekotoba", "image", "image", "image"],
        "gendaibun": (
            "各自が成仏を遂げ、器物さえ成仏しうるという教えで物語は結ばれます。"
        ),
        "desc": (
            "岩間や松の下に庵を結び、各自が修行を続けた妖怪たちは、ついにそれぞれ即身成仏を遂げます。修行により現れた仏の姿は人それぞれ異なり、真言宗の教えの深さを物語ります。"
            "<br><br>"
            "心のない器物さえ成仏しうる——この奇談は、草木国土悉皆成仏の思想と非情成仏の教えを伝える物語として結ばれます。"
        ),
        "descen": (
            "Dwelling in cliff hermitages and under pines, each yokai continues practice until each attains buddhahood in this body. The buddha forms that appear differ by person, showing the depth of Shingon teaching."
            "<br><br>"
            "Even soulless objects can become buddhas—this strange tale closes by conveying the idea that plants, land, and all things may attain enlightenment, and the teaching of nonsentient beings’ buddhahood."
        ),
    }
]

def yaml_escape(text: str) -> str:
    return text.replace("'", "''")


def yaml_text_block(scene: dict) -> str:
    """Emit layer-1 gendaibun + layer-2 desc/descen for viewer i18n."""
    g = yaml_escape(scene["gendaibun"])
    d = yaml_escape(scene["desc"])
    de = yaml_escape(scene["descen"])
    return (
        f"    gendaibun: '{g}'\n"
        f"    kobun: ''\n"
        f"    desc: '{d}'\n"
        f"    descen: '{de}'"
    )


def scene_yaml(scene: dict) -> str:
    rs, re = scene["range"]
    lines = [
        f"- id: {scene['id']}",
        f'  title: "{scene["title"]}"',
        f'  titleen: "{scene["titleen"]}"',
        f"  range: [{rs}, {re}]",
        "  slots:",
    ]
    for slot in scene["slots"]:
        lines.append(f"    - {slot}")
    lines.append("  text:")
    lines.append(yaml_text_block(scene))
    return "\n".join(lines)


def main() -> None:
    body = HEADER + "\n".join(scene_yaml(s) for s in SCENES) + "\n"
    OUT.write_text(body, encoding="utf-8")
    print(f"wrote {OUT} ({len(body.splitlines())} lines)")


if __name__ == "__main__":
    main()
