/**
 * 京都編 / 鎌倉編ハブページの追加メタデータ。
 *
 * 絵巻タイトル・サムネ・説明は正本（src/data/scroll-metadata/scrolls/{titleen}.json）から
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
      ja: "絵巻と屏風に描かれた都の風景を、京都の地図で辿る。",
      en: "Explore the historic cityscape depicted in handscrolls and folding screens on the map of Kyoto.",
    },
    lead: {
      ja: "洛中洛外図屏風に描かれた寺社・河川・町並みを、現在の京都の地理と照らし合わせて巡ります。",
      en: "Discover temples, rivers, and historic streets painted in Rakuchu-Rakugai-zu screens alongside modern Kyoto geography.",
    },
  },
  kamakura: {
    id: "kamakura",
    labelJa: "鎌倉編",
    labelEn: "Kamakura",
    center: { lat: 35.3197, lng: 139.5515 },
    zoom: 12,
    copy: {
      ja: "中世の物語絵巻と歴史の舞台を、鎌倉の地図で辿る。",
      en: "Trace medieval narrative handscrolls and historic sites on the map of Kamakura.",
    },
    lead: {
      ja: "絵巻に描かれた古都・鎌倉の寺社や街道の面影を地図とともに歩きます。",
      en: "Walk through the temples and historic roads of ancient Kamakura featured in narrative scrolls.",
    },
  },
};

/** テーマフィルター定義（フィルタの表示順・日本語名） */
export const THEMES = [
  { id: "all", labelJa: "すべて", labelEn: "All" },
  { id: "landmark", labelJa: "寺社・名所", labelEn: "Temples & Shrines" },
  { id: "river", labelJa: "河川・橋", labelEn: "Rivers & Bridges" },
  { id: "street", labelJa: "町並み・通り", labelEn: "Streets & Towns" },
  { id: "power", labelJa: "御所・城郭・史跡", labelEn: "Palaces & Historic Sites" },
];

/**
 * ハブ掲載作品。
 * titleen が実在する作品は scroll-metadata/scrolls/{titleen}.json と JOIN する。
 * status: "coming-soon" の作品はビューア未公開のため準備中カードとして表示。
 */
export const HUB_EMAKIS = [
  {
    titleen: "rakuchu_rakugai_funaki",
    region: "kyoto",
    theme: "landmark",
    tags: ["Kyoto", "Screen", "Townspeople"],
    spot: {
      nameJa: "清水寺",
      nameEn: "Kiyomizu-dera",
      lat: 34.9949,
      lng: 135.785,
      desc: {
        ja: "岩佐又兵衛筆と伝わる国宝「洛中洛外図屏風（舟木本）」。方広寺大仏殿や豊国社をはじめ、慶長期の京の街並みと躍動する人々の風俗を描きます。",
        en: "The Funaki Version of Scenes in and around the Capital, attributed to Iwasa Matabei, vividly depicting Keichō-era Kyoto landmarks such as Hōkō-ji and Toyokuni Shrine alongside lively townspeople.",
      },
    },
  },
  {
    titleen: "rakuchu_rakugai_fukuoka",
    region: "kyoto",
    theme: "landmark",
    tags: ["Kyoto", "Screen", "Festival"],
    spot: {
      nameJa: "祇園社・八坂神社",
      nameEn: "Gion Shrine (Yasaka-jinja)",
      lat: 35.0037,
      lng: 135.7785,
      desc: {
        ja: "福岡市博物館所蔵の「洛中洛外図屏風」。五条大橋や清水寺など東山から鴨川にかけての景観と、四季の祭礼や庶民の暮らしを華やかに伝えます。",
        en: "Held by the Fukuoka City Museum, this screen captures the scenery from Gojō Bridge to Kiyomizu-dera, seasonal festivals, and everyday life in Kyoto.",
      },
    },
  },
  {
    titleen: "rakuchu_rakugai_met",
    region: "kyoto",
    theme: "power",
    tags: ["Kyoto", "Screen", "Nijō Castle"],
    spot: {
      nameJa: "内裏・京都御所",
      nameEn: "Imperial Palace (Kyoto Gosho)",
      lat: 35.0254,
      lng: 135.7621,
      desc: {
        ja: "メトロポリタン美術館所蔵の「洛中洛外図屏風」。二条城を中心とする洛中の壮麗な建築群と武家・公家・町衆の往来を緻密に描き出しています。",
        en: "Held by the Metropolitan Museum of Art, this screen portrays Nijō Castle and central Kyoto in intricate detail, bustling with samurai, courtiers, and townspeople.",
      },
    },
  },
];

/**
 * おすすめ観光ルート（手動キュレーション正本）。
 * stops は spotId で洛中洛外図屏風各本（titleen）と JOIN する。
 */
export const ROUTES = [
  {
    id: "rakuchu-higashiyama-right-screen",
    region: "kyoto",
    titleJa: "東山・鴨川パノラマコース（右隻の王道）",
    titleEn: "Higashiyama & Kamo River Panorama (Right Screen Classic)",
    durationJa: "半日",
    durationEn: "Half Day",
    summaryJa:
      "洛中洛外図の右隻を彩る東山の名刹と鴨川沿いの賑わいを南から北へ辿る王道コース。三伝本すべてに描かれるランドマークを巡ります。",
    summaryEn:
      "A classic south-to-north walk along Higashiyama's great temples and the bustling Kamo River—landmarks shared across all three Rakuchu-Rakugai screen versions.",
    summary: {
      ja: "洛中洛外図の右隻を彩る東山の名刹と鴨川沿いの賑わいを南から北へ辿る王道コース。三伝本すべてに描かれるランドマークを巡ります。",
      en: "A classic south-to-north walk along Higashiyama's great temples and the bustling Kamo River—landmarks shared across all three Rakuchu-Rakugai screen versions.",
    },
    stops: [
      {
        lat: 34.9879,
        lng: 135.7717,
        titleen: "rakuchu_rakugai_funaki",
        spotId: "sanjusangendo",
        name: { ja: "", en: "" },
        note: { ja: "", en: "" },
      },
      {
        lat: 34.9917,
        lng: 135.7722,
        titleen: "rakuchu_rakugai_funaki",
        spotId: "hokoji-daibutsuden",
      },
      {
        lat: 34.9949,
        lng: 135.785,
        titleen: "rakuchu_rakugai_funaki",
        spotId: "kiyomizudera",
      },
      {
        lat: 35.0007,
        lng: 135.7812,
        titleen: "rakuchu_rakugai_funaki",
        spotId: "kodaiin",
      },
      {
        lat: 35.0037,
        lng: 135.7785,
        titleen: "rakuchu_rakugai_funaki",
        spotId: "gion-shrine",
      },
      {
        lat: 35.0038,
        lng: 135.7712,
        titleen: "rakuchu_rakugai_funaki",
        spotId: "shijo-kawara",
      },
    ],
  },
  {
    id: "rakuchu-power-axis-center-left",
    region: "kyoto",
    titleJa: "洛中・公家と武家の権力軸コース（中央〜左隻）",
    titleEn: "Imperial Court & Shogunate Axis (Center to Left Screen)",
    durationJa: "半日",
    durationEn: "Half Day",
    summaryJa:
      "朝廷の象徴・内裏（御所）から町衆の寺町・高瀬川を経て、幕府権力の象徴・二条城へ至る洛中横断ルート。屏風の中央から左隻への空間構成を体感できます。",
    summaryEn:
      "Cross central Kyoto from the imperial palace through merchant temple towns and the Takase River to Nijō Castle—experiencing the screen's center-to-left spatial composition.",
    summary: {
      ja: "朝廷の象徴・内裏（御所）から町衆の寺町・高瀬川を経て、幕府権力の象徴・二条城へ至る洛中横断ルート。屏風の中央から左隻への空間構成を体感できます。",
      en: "Cross central Kyoto from the imperial palace through merchant temple towns and the Takase River to Nijō Castle—experiencing the screen's center-to-left spatial composition.",
    },
    stops: [
      {
        lat: 35.0254,
        lng: 135.7621,
        titleen: "rakuchu_rakugai_funaki",
        spotId: "imperial-palace",
      },
      {
        lat: 35.0072,
        lng: 135.7675,
        titleen: "rakuchu_rakugai_fukuoka",
        spotId: "seigan-ji",
      },
      {
        lat: 35.0079,
        lng: 135.7703,
        titleen: "rakuchu_rakugai_met",
        spotId: "hidetsugu-mound",
      },
      {
        lat: 35.0142,
        lng: 135.7481,
        titleen: "rakuchu_rakugai_funaki",
        spotId: "nijo-castle",
      },
      {
        lat: 35.0165,
        lng: 135.7485,
        titleen: "rakuchu_rakugai_met",
        spotId: "shoshidai-residence",
      },
    ],
  },
  {
    id: "rakuchu-rakuhoku-rakusai-classic",
    region: "kyoto",
    titleJa: "洛北・洛西の景勝と王城鎮護コース（第一定型）",
    titleEn: "Rakuhoku & Rakusai Scenic Landmarks (First Composition)",
    durationJa: "1日",
    durationEn: "Full Day",
    summaryJa:
      "メトロポリタン本など初期定型の屏風に描かれる洛北・洛西の名勝を巡る広域コース。北の上賀茂神社・金閣寺から西の嵐山・大堰川、南の東寺まで京の四方を一望します。",
    summaryEn:
      "A wide-ranging tour of scenic landmarks in the north and west as seen in early canonical screens—from Kamigamo and Kinkaku-ji to Arashiyama, the Ōi River, and Tō-ji in the south.",
    summary: {
      ja: "メトロポリタン本など初期定型の屏風に描かれる洛北・洛西の名勝を巡る広域コース。北の上賀茂神社・金閣寺から西の嵐山・大堰川、南の東寺まで京の四方を一望します。",
      en: "A wide-ranging tour of scenic landmarks in the north and west as seen in early canonical screens—from Kamigamo and Kinkaku-ji to Arashiyama, the Ōi River, and Tō-ji in the south.",
    },
    stops: [
      {
        lat: 35.0596,
        lng: 135.7525,
        titleen: "rakuchu_rakugai_met",
        spotId: "kamigamo-shrine",
      },
      {
        lat: 35.0394,
        lng: 135.7292,
        titleen: "rakuchu_rakugai_met",
        spotId: "kinkakuji",
      },
      {
        lat: 35.0156,
        lng: 135.6745,
        titleen: "rakuchu_rakugai_met",
        spotId: "tenryuji",
      },
      {
        lat: 35.0129,
        lng: 135.6777,
        titleen: "rakuchu_rakugai_met",
        spotId: "oi-river",
      },
      {
        lat: 34.9806,
        lng: 135.7478,
        titleen: "rakuchu_rakugai_met",
        spotId: "toji",
      },
    ],
  },
];

/** titleen から絵巻のゆかりの地（region + spot）を引く。ハブ未掲載なら null。 */
export const getEmakiSpot = (titleen) => {
  const hit = HUB_EMAKIS.find((e) => e.titleen === titleen);
  if (!hit?.spot) return null;
  return { region: hit.region, spot: hit.spot };
};
