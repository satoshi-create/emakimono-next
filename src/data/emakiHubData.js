/**
 * 京都編 / 鎌倉編ハブページの追加メタデータ。
 *
 * 絵巻タイトル・サムネ・説明は正本（src/data/image-metadata-cache/image-metadata-cache.json）から
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
 * titleen が実在する作品は image-metadata-cache.json と JOIN する。
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
      desc: {
        ja: "鳥獣人物戯画は高山寺の寺宝として伝来し、現在も同寺に所蔵されています。",
        en: "Chōjū-jinbutsu-giga has been passed down as a treasure of Kōzan-ji and is still kept there today.",
      },
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
      desc: {
        ja: "当館が所蔵する絵巻の一つ。地獄の責め苦の情景を迫力ある筆致で描きます。",
        en: "One of the hell-scroll versions held by the museum, depicting torments with powerful brushwork.",
      },
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
      desc: {
        ja: "同じく京都国立博物館の所蔵。独自の場面構成で、地獄の世界観を細部まで描き込んでいます。",
        en: "Also held by the museum. This version arranges its scenes independently, detailing the underworld in minute brushwork.",
      },
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
      desc: {
        ja: "飢えた亡者たちの姿を描く餓鬼草紙。本図は京都国立博物館が所蔵する作品です。",
        en: "Hungry Ghosts Scroll depicts starving spirits in their torment. This version is held by the Kyoto National Museum.",
      },
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
      desc: {
        ja: "平治の乱を描いた合戦絵巻の現存断簡を、鎌倉国宝館が収蔵しています。",
        en: "Surviving fragments of the battle scroll of the Heiji Rebellion are kept at the Kamakura Museum of National Treasures.",
      },
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
      desc: {
        ja: "源頼光の土蜘蛛退治を描いた絵巻で、鎌倉ゆかりの武家文化を伝えます。",
        en: "A scroll of Minamoto no Yorimitsu slaying the Tsuchigumo, carrying on the samurai culture of Kamakura.",
      },
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
      desc: {
        ja: "元寇（蒙古襲来）の戦いを記録した絵詞で、当時の武士の活躍を伝えます。",
        en: "An illustrated record of the Mongol invasions, telling of the samurai who fought in the era.",
      },
    },
  },
];
