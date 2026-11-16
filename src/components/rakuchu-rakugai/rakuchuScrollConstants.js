export const FORM_TAB_IDS = ["first", "second_variant", "second"];

export const SCROLL_EDITIONS = [
  {
    titleen: "rakuchu_rakugai_funaki",
    labelJa: "舟木本（国宝）",
    labelEn: "Funaki Version (National Treasure)",
  },
  {
    titleen: "rakuchu_rakugai_met",
    labelJa: "バーク本（MET）",
    labelEn: "Burke Version (MET)",
  },
  {
    titleen: "rakuchu_rakugai_fukuoka",
    labelJa: "福岡本（重文）",
    labelEn: "Fukuoka Version (Important Cultural Property)",
  },
];

/** 構図比較用 — 屏風全体のワイドプレビュー（スポット切り抜きではない） */
export const SCROLL_PANORAMA_PREVIEW = {
  rakuchu_rakugai_funaki: "/thumb/rakuchu_rakugai_funaki_thumb.webp",
  rakuchu_rakugai_met: "/thumb/rakuchu_rakugai_met_thumb.webp",
  rakuchu_rakugai_fukuoka: "/thumb/rakuchu_rakugai_fukuoka_thumb.webp",
};

export const FORM_PANORAMA = {
  first: {
    isBlankCanvas: true,
    titleen: null,
    panoramaImage: null,
    spots: [
      { masterId: "kitano_kinkaku", primary: true, cx: 22, cy: 48 },
      { masterId: "imperial_palace", primary: true, cx: 78, cy: 46 },
      { masterId: "kiyomizudera", cx: 64, cy: 58 },
    ],
  },
  second: {
    titleen: "rakuchu_rakugai_funaki",
    panoramaImage: SCROLL_PANORAMA_PREVIEW.rakuchu_rakugai_funaki,
    spots: [
      { masterId: "nijo_castle", primary: true },
      { masterId: "hokoji_daibutsu", primary: true },
      { masterId: "imperial_palace" },
    ],
  },
  second_variant: {
    titleen: "rakuchu_rakugai_fukuoka",
    panoramaImage: SCROLL_PANORAMA_PREVIEW.rakuchu_rakugai_fukuoka,
    spots: [
      { masterId: "imperial_palace", primary: true },
      { masterId: "kiyomizudera", primary: true },
    ],
  },
};

export const CATEGORY_FILTERS = [
  { id: "all", labelJa: "すべて", labelEn: "All" },
  { id: "power", labelJa: "権力・城郭", labelEn: "Power & Castles" },
  { id: "temple", labelJa: "寺社", labelEn: "Temples & Shrines" },
  { id: "town", labelJa: "町並み・祭礼・河川", labelEn: "Town, Festivals & Rivers" },
];

export const SCROLL_PILL_LABELS = {
  ja: ["舟木本", "バーク本", "福岡本"],
  en: ["Funaki", "Burke", "Fukuoka"],
};

export const MOTIF_CATEGORY_LABELS = {
  power: { ja: "権力・城郭", en: "Power & Castles" },
  temple: { ja: "寺社", en: "Temples & Shrines" },
  town: { ja: "町並み・祭礼・河川", en: "Town, Festivals & Rivers" },
};

export const overlayCarouselBtnStyle = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: "none",
  background: "rgba(31, 26, 20, 0.5)",
  color: "#fff",
  fontSize: 13,
  cursor: "pointer",
  zIndex: 2,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
};