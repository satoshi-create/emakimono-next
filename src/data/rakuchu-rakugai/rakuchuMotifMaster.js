/** 洛中洛外図 — 構図形式・スポットマスター（scroll-metadata spots.id と aliasSpotIds で整合） */

export const RAKUCHU_COMPOSITION_FORMS = {
  first: {
    id: "first",
    labelJa: "第一形式（戦国期・初期型）",
    labelEn: "First Form (Sengoku / Early)",
    rightFocusJa: "内裏（天皇）・祇園社・清水寺・下京の町並み",
    rightFocusEn: "Imperial Palace, Gion Shrine, Kiyomizu-dera & Shimogyo",
    leftFocusJa: "花の御所（室町将軍）・武家屋敷群・北野天満宮",
    leftFocusEn: "Hana-no-Gosho (Shogun's Palace), Samurai Mansions & Kitano",
    summaryJa:
      "16世紀の戦国期景観。右隻に天皇（内裏）、左隻に将軍（公方御所）を配し、四季の秩序とともに京の都を描く（上杉本・歴博甲本など）。",
    summaryEn:
      "16th-century Sengoku landscape contrasting the Emperor (Imperial Palace, right) and the Shogun (Hana-no-Gosho, left), as seen in the Uesugi and Rekihaku-A screens.",
    representativesJa: "上杉本（国宝）、歴博甲本、歴博乙本、東博模本",
    representativesEn: "Uesugi Version, Rekihaku A & B, TNM Copy",
  },
  second: {
    id: "second",
    labelJa: "第二形式（江戸期定型）",
    labelEn: "Second Form (Edo Standard)",
    rightFocusJa: "方広寺大仏殿（豊臣）・豊国社・清水寺・祇園祭",
    rightFocusEn: "Hoko-ji Great Buddha (Toyotomi), Toyokuni Shrine, Kiyomizu-dera & Gion Festival",
    leftFocusJa: "二条城（徳川）・内裏・西陣・遊楽風俗",
    leftFocusEn: "Nijo Castle (Tokugawa), Imperial Palace & Urban Amusements",
    summaryJa:
      "江戸時代初期に確立した定型構図。右隻の「方広寺大仏殿（豊臣）」と左隻の「二条城（徳川）」を左右の対比軸に据える（舟木本・バーク本など）。",
    summaryEn:
      "Standard Edo-period composition contrasting Toyotomi's Hoko-ji Great Buddha Hall (right) with Tokugawa's Nijo Castle (left), seen in the Funaki and Burke/MET screens.",
    representativesJa: "舟木本（国宝）、バーク本（MET蔵）、勝興寺本、池田本",
    representativesEn: "Funaki Version, Burke/MET Version, Shoko-ji, Ikeda",
  },
  second_variant: {
    id: "second_variant",
    labelJa: "第一形式（初期系譜・定型外）",
    labelEn: "First Form (Early-Lineage Variant)",
    rightFocusJa: "清水寺・八坂神社・五条大橋・寺町通の店舗群",
    rightFocusEn: "Kiyomizu-dera, Yasaka Shrine, Gojo Bridge & Teramachi Shops",
    leftFocusJa: "内裏（御所）の花見・市井の職人や南蛮風俗",
    leftFocusEn: "Imperial Palace Cherry Blossoms, Artisans & Nanban Visitors",
    summaryJa:
      "江戸初期の作でありながら、第二形式の「方広寺大仏殿」も「二条城」も描かず、初期系譜の伝統を受け継ぎつつ寺町商業や市井の風俗・名所を主役とする独自構図（福岡市博物館本）。",
    summaryEn:
      "An early-Edo variant omitting both Nijo Castle and the Great Buddha Hall, focusing instead on Teramachi commerce, street artisans, and classic landmarks (Fukuoka Version).",
    representativesJa: "福岡市博物館本（黒田家伝来・重文）",
    representativesEn: "Fukuoka City Museum Version (Kuroda Family)",
  },
};

export const SCROLL_COMPOSITION_MAP = {
  rakuchu_rakugai_funaki: { formId: "second" },
  rakuchu_rakugai_met: { formId: "second" },
  rakuchu_rakugai_fukuoka: { formId: "second_variant" },
};

/**
 * @param {string} titleen
 * @returns {{ formId: string, badgeJa: string, badgeEn: string, summaryJa: string, summaryEn: string } | null}
 */
export function getScrollCompositionForm(titleen) {
  const entry = SCROLL_COMPOSITION_MAP[titleen];
  if (!entry) return null;
  const form = RAKUCHU_COMPOSITION_FORMS[entry.formId];
  if (!form) return null;
  return {
    formId: form.id,
    badgeJa: form.labelJa,
    badgeEn: form.labelEn,
    summaryJa: form.summaryJa,
    summaryEn: form.summaryEn,
  };
}

/** @typedef {"right" | "left"} RakuchuWing */
/** @typedef {"power" | "temple" | "town"} RakuchuSpotCategory */

export const RAKUCHU_SPOT_MASTERS = [
  {
    masterId: "hokoji_daibutsu",
    nameJa: "方広寺大仏殿",
    nameEn: "Great Buddha Hall (Hoko-ji)",
    wing: "right",
    category: "power",
    formIds: ["second"],
    summaryJa: "第二形式右隻の視覚的頂点。豊臣政権の記憶を担う方広寺大仏殿の巨構。",
    summaryEn: "Visual apex of the right scroll in the Edo standard; the colossal Hoko-ji hall embodies Toyotomi memory.",
    aliasSpotIds: ["daibutsuden", "myohoin", "mimizuka"],
    presentIn: ["rakuchu_rakugai_funaki", "rakuchu_rakugai_met"],
  },
  {
    masterId: "nijo_castle",
    nameJa: "二条城",
    nameEn: "Nijo Castle",
    wing: "left",
    category: "power",
    formIds: ["second"],
    summaryJa: "第二形式左隻の対桁。徳川武家政治の象徴として大仏殿と並置される。",
    summaryEn: "Counterpole on the left scroll, paired with the Great Buddha Hall as emblem of Tokugawa warrior government.",
    aliasSpotIds: ["nijocastle", "shoshidai-residence"],
    presentIn: ["rakuchu_rakugai_funaki", "rakuchu_rakugai_met"],
  },
  {
    masterId: "imperial_palace",
    nameJa: "内裏・御所（紫宸殿・清涼殿）",
    nameEn: "Imperial Palace (Shishinden & Seiryoden)",
    wing: "left",
    category: "power",
    formIds: ["first", "second", "second_variant"],
    summaryJa: "天皇・朝廷の中枢。形式を問わず洛中政治・儀礼の象徴として描かれる。",
    summaryEn: "Core of imperial rule; depicted across all composition lineages as the symbol of court ritual and authority.",
    aliasSpotIds: ["shishinden", "seiryoden", "minamimon", "imperial-palace-shishinden"],
    presentIn: ["rakuchu_rakugai_funaki", "rakuchu_rakugai_fukuoka", "rakuchu_rakugai_met"],
  },
  {
    masterId: "toyokuni_shrine",
    nameJa: "豊国社・豊国廟",
    nameEn: "Toyokuni Shrine & Mausoleum",
    wing: "right",
    category: "power",
    formIds: ["second"],
    summaryJa: "秀吉に捧げる豊臣系の神社・廟。第二形式右隻の権力層の記念建築。",
    summaryEn: "Shrines and mausolea to Hideyoshi; memorial architecture of Toyotomi power on the right scroll.",
    aliasSpotIds: ["toyokunisha", "toyokunitebutai", "hokoku-mausoleum"],
    presentIn: ["rakuchu_rakugai_funaki", "rakuchu_rakugai_met"],
  },
  {
    masterId: "kiyomizudera",
    nameJa: "清水寺",
    nameEn: "Kiyomizu-dera",
    wing: "right",
    category: "temple",
    formIds: ["first", "second", "second_variant"],
    summaryJa: "東山信仰の代表。三形式いずれでも洛外東部のランドマークとして登場する。",
    summaryEn: "Icon of Higashiyama faith; a landmark of eastern Rakugai in every major composition lineage.",
    aliasSpotIds: ["kiyomizudera"],
    presentIn: ["rakuchu_rakugai_funaki", "rakuchu_rakugai_met", "rakuchu_rakugai_fukuoka"],
  },
  {
    masterId: "gion_yasaka",
    nameJa: "祇園社（八坂神社）",
    nameEn: "Gion Shrine (Yasaka-jinja)",
    wing: "right",
    category: "temple",
    formIds: ["first", "second", "second_variant"],
    summaryJa: "祇園信仰と祭礼の中心。洛外南部を代表する神社建築。",
    summaryEn: "Heart of Gion cult and festival culture; the shrine architecture defining southern Rakugai.",
    aliasSpotIds: ["gionsha", "gionryosho"],
    presentIn: ["rakuchu_rakugai_funaki", "rakuchu_rakugai_met", "rakuchu_rakugai_fukuoka"],
  },
  {
    masterId: "sanjusangendo",
    nameJa: "三十三間堂",
    nameEn: "Sanjusangen-do",
    wing: "right",
    category: "temple",
    formIds: ["first", "second"],
    summaryJa: "千手観音像を収める長堂。戦国期・江戸定型双方に見える東山の宗教施設。",
    summaryEn: "Long hall of Senju Kannon; an eastern Higashiyama temple in both early and standard lineages.",
    aliasSpotIds: ["sanjusangendo"],
    presentIn: ["rakuchu_rakugai_funaki", "rakuchu_rakugai_met"],
  },
  {
    masterId: "chionin",
    nameJa: "知恩院",
    nameEn: "Chion-in",
    wing: "right",
    category: "temple",
    formIds: ["second"],
    summaryJa: "净土宗総本山。第二形式における東山・洛外の大伽藍。",
    summaryEn: "Head temple of Jodo Shu; a major monastic complex in Type II Higashiyama scenes.",
    aliasSpotIds: ["chionin"],
    presentIn: ["rakuchu_rakugai_funaki", "rakuchu_rakugai_met"],
  },
  {
    masterId: "toji",
    nameJa: "東寺",
    nameEn: "To-ji",
    wing: "left",
    category: "temple",
    formIds: ["first", "second"],
    summaryJa: "五重塔で知られる洛南の真言宗寺院。左隻・洛外西部の地標。",
    summaryEn: "Shingon temple famed for its pagoda; a western Rakugai landmark on the left scroll.",
    aliasSpotIds: ["toji"],
    presentIn: ["rakuchu_rakugai_funaki", "rakuchu_rakugai_met"],
  },
  {
    masterId: "kamogawa",
    nameJa: "賀茂川（鴨川）",
    nameEn: "Kamo River (Kamogawa)",
    wing: "right",
    category: "town",
    formIds: ["first", "second", "second_variant"],
    summaryJa: "都の東西を分ける河川景観。屋形船・川岸の賑わいが画面の動線を貫く。",
    summaryEn: "The river dividing the capital; pleasure boats and riverbank bustle thread through the composition.",
    aliasSpotIds: ["kamogawa", "sanjobashi", "takasegawa", "oi-river"],
    presentIn: ["rakuchu_rakugai_funaki", "rakuchu_rakugai_met"],
  },
  {
    masterId: "gojo_bridge",
    nameJa: "五条大橋・河原の賑わい",
    nameEn: "Gojo Bridge & Riverside Bustle",
    wing: "right",
    category: "town",
    formIds: ["first", "second", "second_variant"],
    summaryJa: "五条橋と河原の商業・座頭・茶屋。交通と風俗が交わる都市の結節点。",
    summaryEn: "Gojo Bridge and riverside commerce, barbers, and tea houses—a hub of traffic and urban custom.",
    aliasSpotIds: ["gojobashi", "gojo-bridge-barber", "kanjin-zumo-teahouse", "gojodori", "shichijo-kawara"],
    presentIn: ["rakuchu_rakugai_funaki", "rakuchu_rakugai_fukuoka"],
  },
  {
    masterId: "teramachi",
    nameJa: "寺町通と町衆・職人の店",
    nameEn: "Teramachi Street & Artisan Shops",
    wing: "right",
    category: "town",
    formIds: ["second", "second_variant"],
    summaryJa: "武器・漆器など町衆経済の通り。定型外本では大仏・二条に替わる主役街区。",
    summaryEn: "Street of townspeople’s trade in arms and lacquer; in the Fukuoka variant it substitutes for the canonical power dyad.",
    aliasSpotIds: [
      "teramachi",
      "teramachi-armor-shops",
      "gojoteramachi",
      "artisan-shops-townspeople",
      "shijodori",
      "muromachidori",
      "shinmachidori",
      "nijodori",
      "shimodachiuridori",
      "horikawadori",
      "higashinotoindori",
    ],
    presentIn: ["rakuchu_rakugai_funaki", "rakuchu_rakugai_fukuoka"],
  },
  {
    masterId: "gion_festival",
    nameJa: "祇園祭（山鉾巡行）",
    nameEn: "Gion Festival (Yamahoko Procession)",
    wing: "right",
    category: "town",
    formIds: ["first", "second"],
    summaryJa: "山鉾を伴う祇園祭の行列。洛中の時間秩序を季節儀礼で示す風景。",
    summaryEn: "Procession of Gion Festival floats; seasonal ritual ordering urban time in the capital.",
    aliasSpotIds: ["gion-festival"],
    presentIn: ["rakuchu_rakugai_met"],
  },
  {
    masterId: "kabuki_amusements",
    nameJa: "四条河原・お国歌舞伎と遊楽",
    nameEn: "Shijo Kawara, Okuni Kabuki & Amusements",
    wing: "right",
    category: "town",
    formIds: ["second"],
    summaryJa: "四条河原の演芸と遊郭文化。江戸期都市の娯楽層を写す風俗群。",
    summaryEn: "Performance and pleasure quarters at Shijo Kawara; genre scenes of Edo-period urban amusement.",
    aliasSpotIds: ["shijokawara", "okuni-kabuki", "rokujosanjyomachi"],
    presentIn: ["rakuchu_rakugai_funaki", "rakuchu_rakugai_met"],
  },
  {
    masterId: "nanban_visitors",
    nameJa: "南蛮人・異国風俗と京の往来",
    nameEn: "Nanban Visitors & Exotic Street Life",
    wing: "left",
    category: "town",
    formIds: ["second", "second_variant"],
    summaryJa: "南蛮人・大原女・猿廻しなど国際感ある市井。福岡本の風俗ディテールの核。",
    summaryEn: "Nanban figures, peddlers, and street performers—the Fukuoka scroll’s distinctive cosmopolitan detail.",
    aliasSpotIds: ["nanban-oharame-monkey-trainer"],
    presentIn: ["rakuchu_rakugai_fukuoka"],
  },
  {
    masterId: "kitano_kinkaku",
    nameJa: "北野天満宮・金閣寺（洛北・洛西の名所）",
    nameEn: "Kitano Tenman-gu, Kinkaku-ji & Northern/Western Landmarks",
    wing: "left",
    category: "temple",
    formIds: ["first", "second"],
    summaryJa: "洛北・洛西の名刹群。第一形式の北野や金閣など、左隻・郊外信仰の束ね。",
    summaryEn: "Cluster of famed temples in northern and western Kyoto—Kitano, Kinkaku, and allied sites on the left scroll.",
    aliasSpotIds: ["kitano-shrine", "kinkakuji", "daitokuji", "kamigamo-shrine"],
    presentIn: ["rakuchu_rakugai_met"],
  },
  {
    masterId: "honganji",
    nameJa: "東本願寺・西本願寺",
    nameEn: "Higashi Hongan-ji & Nishi Hongan-ji",
    wing: "left",
    category: "temple",
    formIds: ["second"],
    summaryJa: "浄土真宗の大本山二つ。洛中西部に連なる堂宇が権力と信仰の層を示す。",
    summaryEn: "The twin head temples of Shin Buddhism; their halls in western Rakuchu mark layers of faith and patronage.",
    aliasSpotIds: ["higashi-honganji", "nishihonganji"],
    presentIn: ["rakuchu_rakugai_funaki"],
  },
  {
    masterId: "kenninji",
    nameJa: "建仁寺",
    nameEn: "Kennin-ji",
    wing: "right",
    category: "temple",
    formIds: ["second"],
    summaryJa: "臨済宗建仁寺派の祖庭。東山の禅刹として第二形式の洛外景観に添えられる。",
    summaryEn: "Head temple of the Kennin-ji Rinzai lineage; a Higashiyama Zen complex in Type II Rakugai scenes.",
    aliasSpotIds: ["kenninji"],
    presentIn: ["rakuchu_rakugai_funaki"],
  },
  {
    masterId: "kodaiin",
    nameJa: "高台院",
    nameEn: "Kodai-in",
    wing: "right",
    category: "temple",
    formIds: ["second"],
    summaryJa: "秀吉・ねねにゆかりの院。東山の寺門として豊臣記憶の宗教層を象徴する。",
    summaryEn: "Temple linked to Hideyoshi and Nene; a Higashiyama monument to Toyotomi-era religious memory.",
    aliasSpotIds: ["kodaiin"],
    presentIn: ["rakuchu_rakugai_funaki"],
  },
  {
    masterId: "rokuharamitsuji",
    nameJa: "六波羅蜜寺",
    nameEn: "Rokuharamitsu-ji",
    wing: "right",
    category: "temple",
    formIds: ["second"],
    summaryJa: "平清盛ゆかりの古刹。洛中南部の歴史層を想起させる六波羅の寺。",
    summaryEn: "Ancient temple associated with Taira no Kiyomori; recalls the historical strata of southern Rakuchu.",
    aliasSpotIds: ["rokuharamitsuji"],
    presentIn: ["rakuchu_rakugai_funaki"],
  },
  {
    masterId: "tofukuji",
    nameJa: "東福寺",
    nameEn: "Tofuku-ji",
    wing: "left",
    category: "temple",
    formIds: ["second"],
    summaryJa: "京都五山の巨刹。洛南の伽藍が左隻・郊外の宗教景観を象徴する。",
    summaryEn: "One of Kyoto's Five Great Zen temples; its southern complex marks religious Rakugai on the left scroll.",
    aliasSpotIds: ["tofukuji"],
    presentIn: ["rakuchu_rakugai_met"],
  },
  {
    masterId: "rokkakudo",
    nameJa: "六角堂（誓願寺）",
    nameEn: "Rokkaku-do (Seigan-ji)",
    wing: "right",
    category: "temple",
    formIds: ["second", "second_variant"],
    summaryJa: "市街中心の六角形堂宇。洛中の信仰と通り文化の交点として描かれる。",
    summaryEn: "Hexagonal hall at the urban core; a junction of downtown faith and street life in the capital.",
    aliasSpotIds: ["rokkakudo", "seigan-ji"],
    presentIn: ["rakuchu_rakugai_funaki", "rakuchu_rakugai_fukuoka"],
  },
  {
    masterId: "fushimijo",
    nameJa: "伏見城",
    nameEn: "Fushimi Castle",
    wing: "left",
    category: "power",
    formIds: ["second"],
    summaryJa: "豊臣秀吉が築いた伏見の城郭。洛外南部の武家政権の記念として登場する。",
    summaryEn: "Castle built by Hideyoshi at Fushimi; a southern Rakugai emblem of warrior-era power.",
    aliasSpotIds: ["fushimijo"],
    presentIn: ["rakuchu_rakugai_met"],
  },
  {
    masterId: "rakusai_arashiyama",
    nameJa: "天龍寺・法輪寺・桂離宮",
    nameEn: "Tenryu-ji, Horin-ji & Katsura Villa",
    wing: "left",
    category: "temple",
    formIds: ["second"],
    summaryJa: "洛西・嵯峨野の名刹と離宮。左隻の郊外景観を担う西部の文化層。",
    summaryEn: "Famed western temples and villa at Saga-Arashiyama; the cultural layer of Rakugai on the left scroll.",
    aliasSpotIds: ["tenryuji", "kokuzodo", "katsura-villa"],
    presentIn: ["rakuchu_rakugai_met"],
  },
];

/**
 * @param {string} rawSpotId scroll-metadata spots[].id
 * @returns {(typeof RAKUCHU_SPOT_MASTERS)[number] | undefined}
 */
export function getMasterByRawSpotId(rawSpotId) {
  return RAKUCHU_SPOT_MASTERS.find((m) => m.aliasSpotIds.includes(rawSpotId));
}

const WATER_SPOT_IDS = new Set([
  "kamogawa",
  "takasegawa",
  "oi-river",
  "gojobashi",
  "gojo-bridge-barber",
  "sanjobashi",
]);

const POWER_EXTRA_IDS = new Set([
  "fushimijo",
  "shoshidai-residence",
  "katsura-villa",
]);

const TEMPLE_EXTRA_IDS = new Set([
  "tofukuji",
  "mimizuka",
  "hidetsugu-mound",
  "tenryuji",
  "kokuzodo",
  "seigan-ji",
  "myohoin",
  "rokuharamitsuji",
  "kenninji",
  "rokkakudo",
  "higashi-honganji",
  "nishihonganji",
  "kodaiin",
]);

/**
 * ビューアのピンバッジ用ビジュアル種別を返す
 * @param {string} rawSpotId
 * @returns {"power" | "temple" | "water" | "town"}
 */
export function getSpotVisualKind(rawSpotId) {
  if (!rawSpotId) return "town";
  if (WATER_SPOT_IDS.has(rawSpotId)) return "water";
  if (POWER_EXTRA_IDS.has(rawSpotId)) return "power";
  if (TEMPLE_EXTRA_IDS.has(rawSpotId)) return "temple";
  const master = getMasterByRawSpotId(rawSpotId);
  if (master?.category === "power") return "power";
  if (master?.category === "temple") return "temple";
  return "town";
}

/** @deprecated 互換エイリアス — 新規は RAKUCHU_SPOT_MASTERS を参照 */
export const RAKUCHU_MOTIF_MASTER = RAKUCHU_SPOT_MASTERS;