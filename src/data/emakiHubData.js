/**
 * 京都編 / 鎌倉編ハブページの追加メタデータ。
 *
 * 絵巻タイトル・サムネ・説明は正本（src/data/json-data/dataEmakis.json）から
 * titleen で JOIN する。ここにはハブ専用の追加情報のみを持つ。
 * ビューア URL は /{titleen}。
 */

/** リージョン定義（中心座標・キャッチコピー） */
export const REGIONS = {
  kyoto: {
    id: "kyoto",
    labelJa: "京都編",
    labelEn: "Kyoto",
    center: { lat: 35.0116, lng: 135.7681 },
    zoom: 11,
    copy: {
      ja: "千年の物語絵巻とダークファンタジーを、京都で辿る。",
      en: "Explore 1,000 Years of Visual Storytelling & Dark Fantasy in Kyoto",
    },
    lead: {
      ja: "平安〜鎌倉の都・京都ゆかりの絵巻を、横スクロールで味わう。",
      en: "Unroll picture scrolls tied to the ancient capital of Kyoto.",
    },
  },
  kamakura: {
    id: "kamakura",
    labelJa: "鎌倉編",
    labelEn: "Kamakura",
    center: { lat: 35.3197, lng: 139.5515 },
    zoom: 12,
    copy: {
      ja: "武士の合戦絵巻と妖怪退治を、鎌倉で体験する。",
      en: "Experience the Epic Samurai Battles & Monster Hunts in Kamakura",
    },
    lead: {
      ja: "武家の都・鎌倉ゆかりの絵巻を、横スクロールで体験する。",
      en: "Unroll picture scrolls of the samurai capital, Kamakura.",
    },
  },
};

/** テーマフィルター定義（フィルタの表示順・日本語名） */
export const THEMES = [
  { id: "all", labelJa: "すべて", labelEn: "All" },
  { id: "satire", labelJa: "風刺とユーモア", labelEn: "Satire & Humor" },
  { id: "dark-fantasy", labelJa: "ダークファンタジー", labelEn: "Dark Fantasy & Curses" },
  { id: "samurai", labelJa: "武士の活劇", labelEn: "Samurai & Action" },
];

/**
 * ハブ掲載作品。
 * titleen が実在する作品は dataEmakis.json と JOIN する。
 * status: "coming-soon" の作品はビューア未公開のため準備中カードとして表示。
 */
export const HUB_EMAKIS = [
  // ---- 京都編 ----
  {
    titleen: "Chōjū-jinbutsu-giga_first",
    region: "kyoto",
    theme: "satire",
    tags: ["Manga", "Animals", "Humor"],
    spot: {
      nameJa: "高山寺",
      nameEn: "Kōzan-ji",
      lat: 35.0601,
      lng: 135.6763,
    },
  },
  {
    titleen: "jigokusoushi_anzyuin",
    region: "kyoto",
    theme: "dark-fantasy",
    tags: ["Curses", "Hell", "Buddhism"],
    spot: {
      nameJa: "京都国立博物館",
      nameEn: "Kyoto National Museum",
      lat: 34.9902,
      lng: 135.7731,
    },
  },
  {
    titleen: "jigokusoushi_masuda_kou",
    region: "kyoto",
    theme: "dark-fantasy",
    tags: ["Curses", "Hell", "Buddhism"],
    spot: {
      nameJa: "京都国立博物館",
      nameEn: "Kyoto National Museum",
      lat: 34.9902,
      lng: 135.7731,
    },
  },
  {
    titleen: "gakisoushi_kawamoto",
    region: "kyoto",
    theme: "dark-fantasy",
    tags: ["Ghosts", "Hunger", "Buddhism"],
    spot: {
      nameJa: "京都国立博物館",
      nameEn: "Kyoto National Museum",
      lat: 34.9902,
      lng: 135.7731,
    },
  },
  // ---- 鎌倉編 ----
  {
    titleen: "",
    titleJa: "平治物語絵巻",
    titleEn: "Tale of Heiji",
    region: "kamakura",
    theme: "samurai",
    tags: ["Samurai", "Battle", "History"],
    status: "coming-soon",
    spot: {
      nameJa: "鎌倉国宝館",
      nameEn: "Kamakura Museum of National Treasures",
      lat: 35.326,
      lng: 139.5564,
    },
  },
  {
    titleen: "",
    titleJa: "土蜘蛛草紙",
    titleEn: "Tsuchigumo Sōshi",
    region: "kamakura",
    theme: "samurai",
    tags: ["Monster", "Yokai", "Sword"],
    status: "coming-soon",
    spot: {
      nameJa: "鎌倉エリア",
      nameEn: "Kamakura Area",
      lat: 35.319,
      lng: 139.551,
    },
  },
  {
    titleen: "",
    titleJa: "蒙古襲来絵詞",
    titleEn: "Mōko Shūrai Ekotoba",
    region: "kamakura",
    theme: "samurai",
    tags: ["History", "Invasion", "Samurai"],
    status: "coming-soon",
    spot: {
      nameJa: "鎌倉エリア",
      nameEn: "Kamakura Area",
      lat: 35.32,
      lng: 139.553,
    },
  },
];
