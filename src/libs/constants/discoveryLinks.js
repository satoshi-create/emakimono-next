/**
 * 入口ページ（/type/emaki・/ranking）から個別作品へ落とすキュレーション。
 * Analytics 2026-09 調査: ハブはあるが個別 GSC/回遊が弱い作品群。
 */

/** 百鬼夜行・付喪神クラスタ（ハブ /hyakki/chapters と同集合） */
export const HYAKKI_CLUSTER_TITLEEN = [
  "hyakki_utokyo",
  "hyakki_kokkai_a",
  "hyakki_no_zu_nichibun",
  "tsukumogami",
];

export const RAKUCHU_RAKUGAI_CLUSTER_TITLEEN = [
  "rakuchu_rakugai_funaki",
  "rakuchu_rakugai_met",
  "rakuchu_rakugai_fukuoka",
];

/** /type/emaki・/ranking の「注目」ブロック用グループ */
export const DISCOVERY_SPOTLIGHT_GROUPS = [
  {
    id: "yokai",
    titleKey: "discovery.groupYokai",
    ctaHref: "/hub/hyakki",
    ctaKey: "discovery.ctaHyakkiHub",
    titleens: HYAKKI_CLUSTER_TITLEEN,
  },
  {
    id: "rokudo",
    titleKey: "discovery.groupRokudo",
    ctaHref: "/hub/kusouzu",
    ctaKey: "discovery.ctaKusouzuHub",
    titleens: [
      "jigokusoushi_anzyuin",
      "gakisoushi_kawamoto",
      "kusouzumaki",
    ],
  },
  {
    id: "monogatari",
    titleKey: "discovery.groupMonogatari",
    ctaHref: "/hub/genji-world",
    ctaKey: "discovery.ctaGenjiHub",
    titleens: [
      "genjimonogatari-emaki-tokugawa",
      "naomoto_moushibumi_ekotoba",
    ],
  },
];
