/**
 * 漫画・アニメ ↔ 絵巻の関連付け（手動キュレーション正本）。
 *
 * - 画像は絵巻側（image-metadata-cache.json）を使う。アニメ・漫画の画像は使わない
 * - 外部リンクは公式サイトのみ記載（編集的言及に留める）
 * - emakiTitleen は image-metadata-cache.json に存在する slug を指定する
 */
export const MEDIA_ASSOCIATIONS = [
  {
    id: "jujutsu-kaisen",
    titleJa: "呪術廻戦",
    titleEn: "Jujutsu Kaisen",
    type: "anime",
    emakiTitleen: "jigokusoushi_anzyuin",
    theme: "dark-fantasy",
    rationale: {
      ja: "呪い・怨念・地獄の責め苦という世界観は、地獄草紙が描く亡者たちの苦しみに通じる。",
      en: "Its world of curses, grudges, and hellish torment echoes the suffering spirits of the Hell Scrolls.",
    },
    officialUrl: "https://jujutsukaisen.jp/",
  },
  {
    id: "demon-slayer",
    titleJa: "鬼滅の刃",
    titleEn: "Demon Slayer",
    type: "anime",
    emakiTitleen: "gakisoushi_kawamoto",
    theme: "dark-fantasy",
    rationale: {
      ja: "人を喰らう鬼の存在。飢え渇く亡者たちの餓鬼草紙の描写と重なる。",
      en: "Demons that devour humans — the starving spirits of the Hungry Ghosts Scroll come to mind.",
    },
    officialUrl: "https://kimetsu.com/anime/",
  },
  {
    id: "pom-poko",
    titleJa: "平成狸合戦ぽんぽこ",
    titleEn: "Pom Poko",
    type: "anime",
    emakiTitleen: "Chōjū-jinbutsu-giga_first",
    theme: "satire",
    rationale: {
      ja: "動物たちが人間の世を風刺する姿は、「日本最古のマンガ」鳥獣人物戯画の精神を受け継ぐ。",
      en: "Animals satirizing the human world — the very spirit of Japan's oldest manga, Chōjū-jinbutsu-giga.",
    },
    officialUrl: "https://www.ghibli.jp/works/ponpoko/",
  },
  {
    id: "tezuka-buddha",
    titleJa: "ブッダ（手塚治虫）",
    titleEn: "Buddha (Osamu Tezuka)",
    type: "manga",
    emakiTitleen: "kusouzumaki",
    theme: "dark-fantasy",
    rationale: {
      ja: "生と死、無常を描く手塚治虫の大作。九相図巻の観想の世界と響き合う。",
      en: "Tezuka's epic on life, death, and impermanence resonates with the contemplative world of the Kusōzu scroll.",
    },
    officialUrl: "https://tezukaosamu.net/",
  },
];
