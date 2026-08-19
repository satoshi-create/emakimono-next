/**
 * 「絵巻物 ✕ マンガ・アニメのルーツ」特設LP（京都編）のキュレーション正本。
 *
 * データは「ノード（絵巻・現代作品・キーワードタグ）＋ 弱いエッジ（タグ）」で構成する。
 * 絵巻 ⇔ 漫画 を直接つなぐのではなく、キーワードタグが仲介する弱いつながりを表現する。
 * 絵巻のサムネ・タイトルは image-metadata-cache.json を titleen で JOIN する（現代作品の画像は使わない）。
 */
import { getEmakiSpot } from "@/data/emakiHubData";

/** キーワードタグ＝媒介ノード。絵巻側の keyword[] と同系のゆかり語 */
export const MANGA_ROOTS_TAGS = [
  { id: "animal", labelJa: "動物擬人化", labelEn: "Animals & Anthropomorphism" },
  { id: "hell", labelJa: "地獄", labelEn: "Hell & Torment" },
  { id: "yokai", labelJa: "妖怪・呪い", labelEn: "Yokai & Curses" },
  { id: "kusozu", labelJa: "九相・無常", labelEn: "Decay & Impermanence" },
];

/** 絵巻ノード（京都編の代表作品） */
export const MANGA_ROOTS_EMAKE = [
  { id: "chojugiga", titleen: "Chōjū-jinbutsu-giga_first", titleEn: "Chōjū-jinbutsu-giga", tags: ["animal"] },
  { id: "jigoku", titleen: "jigokusoushi_anzyuin", titleEn: "Hell Scroll (Anjū-in)", tags: ["hell"] },
  { id: "gaki", titleen: "gakisoushi_kawamoto", titleEn: "Hungry Ghosts Scroll", tags: ["hell", "yokai"] },
  { id: "kusouzumaki", titleen: "kusouzumaki", titleEn: "Kusōzu", tags: ["kusozu", "yokai"] },
];

/** 現代作品ノード。外部リンクは公式サイトのみ（編集的言及） */
export const MANGA_ROOTS_MEDIA = [
  {
    id: "astro-boy",
    titleJa: "鉄腕アトム",
    titleEn: "Astro Boy",
    type: "manga",
    tags: ["animal"],
    officialUrl: "https://tezukaosamu.net/",
  },
  {
    id: "pom-poko",
    titleJa: "平成狸合戦ぽんぽこ",
    titleEn: "Pom Poko",
    type: "anime",
    tags: ["animal"],
    officialUrl: "https://www.ghibli.jp/works/ponpoko/",
  },
  {
    id: "beastars",
    titleJa: "BEASTARS",
    titleEn: "BEASTARS",
    type: "manga",
    tags: ["animal"],
    officialUrl: "https://beastars.jp/",
  },
  {
    id: "odd-taxi",
    titleJa: "オッドタクシー",
    titleEn: "ODDTAXI",
    type: "anime",
    tags: ["animal"],
    officialUrl: "https://oddtaxi.jp/",
  },
  {
    id: "chainsaw-man",
    titleJa: "チェンソーマン",
    titleEn: "Chainsaw Man",
    type: "manga",
    tags: ["hell"],
    officialUrl: "https://chainsawman.dog/",
  },
  {
    id: "hells-paradise",
    titleJa: "地獄楽",
    titleEn: "Hell's Paradise",
    type: "manga",
    tags: ["hell", "yokai"],
    officialUrl: "https://www.shonenjump.com/j/rensai/hellsparadise.html",
  },
  {
    id: "hozuki",
    titleJa: "鬼灯の冷徹",
    titleEn: "Hozuki's Coolheadedness",
    type: "manga",
    tags: ["hell"],
    officialUrl: "https://kc.kodansha.co.jp/title?code=1000004091",
  },
  {
    id: "jujutsu-kaisen",
    titleJa: "呪術廻戦",
    titleEn: "Jujutsu Kaisen",
    type: "anime",
    tags: ["yokai", "kusozu"],
    officialUrl: "https://jujutsukaisen.jp/",
  },
  {
    id: "berserk",
    titleJa: "ベルセルク",
    titleEn: "Berserk",
    type: "manga",
    tags: ["hell", "kusozu"],
    officialUrl: "https://www.hakusensha.co.jp/special/berserk/",
  },
  {
    id: "tokyo-ghoul",
    titleJa: "東京喰種",
    titleEn: "Tokyo Ghoul",
    type: "manga",
    tags: ["kusozu"],
    officialUrl: "https://youngjump.jp/tokyoghoul/",
  },
];

/** Then & Now カード（物語セクション）。各テーマはタグ集合と絵巻集合に対応 */
export const MANGA_ROOTS_THEMES = [
  {
    id: "origin-of-manga",
    titleKey: "originTitle",
    storyKey: "originStory",
    modernKey: "originModern",
    tagIds: ["animal"],
    scrollIds: ["Chōjū-jinbutsu-giga_first"],
    ctas: [{ titleen: "Chōjū-jinbutsu-giga_first", ctaKey: "ctaChoju" }],
  },
  {
    id: "hell-dark-fantasy",
    titleKey: "hellTitle",
    storyKey: "hellStory",
    modernKey: "hellModern",
    tagIds: ["hell"],
    scrollIds: ["jigokusoushi_anzyuin"],
    ctas: [{ titleen: "jigokusoushi_anzyuin", ctaKey: "ctaJigoku" }],
  },
  {
    id: "curse-kusozu",
    titleKey: "curseTitle",
    storyKey: "curseStory",
    modernKey: "curseModern",
    tagIds: ["yokai", "kusozu"],
    scrollIds: ["gakisoushi_kawamoto", "kusouzumaki"],
    ctas: [
      { titleen: "gakisoushi_kawamoto", ctaKey: "ctaGaki" },
      { titleen: "kusouzumaki", ctaKey: "ctaKusouzu" },
    ],
  },
];

const joinScroll = (emakisData, titleen) => {
  const meta = emakisData.find((item) => item.titleen === titleen);
  if (!meta) return null;
  const hub = getEmakiSpot(titleen);
  return {
    titleen,
    title: meta.title || titleen,
    thumb: meta.thumb || "",
    spot: hub?.spot || null,
  };
};

const themeFromDef = (def, emakisData) => ({
  id: def.id,
  titleKey: def.titleKey,
  storyKey: def.storyKey,
  modernKey: def.modernKey,
  tagIds: def.tagIds,
  scrolls: def.scrollIds
    .map((titleen) => joinScroll(emakisData, titleen))
    .filter(Boolean),
});

/** グラフ構築: 絵巻ノード・現代作品ノード・タグノードと、タグを仲介する弱いエッジ */
const buildGraph = (emakisData) => {
  const emakiNodes = MANGA_ROOTS_EMAKE.map((def) => {
    const meta = emakisData.find((item) => item.titleen === def.titleen);
    return {
      id: def.id,
      titleen: def.titleen,
      title: meta?.title || def.titleen,
      titleEn: def.titleEn || def.titleen,
      thumb: meta?.thumb || "",
      tags: def.tags,
    };
  }).filter((n) => n.titleen);

  const mediaNodes = MANGA_ROOTS_MEDIA.map((m) => ({
    id: m.id,
    titleJa: m.titleJa,
    titleEn: m.titleEn,
    type: m.type,
    tags: m.tags,
    officialUrl: m.officialUrl,
  }));

  const tagNodes = MANGA_ROOTS_TAGS.map((t) => ({ ...t }));

  // エッジ: 絵巻→タグ と タグ→作品（弱いつながり。直接リンクではない）
  const emakiToTag = [];
  const tagToMedia = [];
  tagNodes.forEach((tag) => {
    emakiNodes.forEach((e) => {
      if (e.tags.includes(tag.id)) emakiToTag.push({ from: e.id, via: tag.id });
    });
    mediaNodes.forEach((m) => {
      if (m.tags.includes(tag.id)) tagToMedia.push({ to: m.id, via: tag.id });
    });
  });

  return { emakiNodes, mediaNodes, tagNodes, edges: { emakiToTag, tagToMedia } };
};

/** ページ用データ（カード用テーマ + スポット + ネットワーク用グラフ） */
export const buildMangaRootsPageData = (emakisData) => {
  const themes = MANGA_ROOTS_THEMES.map((def) => themeFromDef(def, emakisData)).filter(
    (theme) => theme.scrolls.length > 0
  );

  const spots = [];
  const seen = new Set();
  themes.forEach((theme) => {
    theme.scrolls.forEach((scroll) => {
      if (!scroll.spot) return;
      const key = scroll.spot.nameEn || scroll.spot.nameJa;
      if (seen.has(key)) return;
      seen.add(key);
      spots.push(scroll.spot);
    });
  });

  return {
    themes,
    spots,
    graph: buildGraph(emakisData),
  };
};
