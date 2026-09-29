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

/** /type/emaki・/ranking の「注目」ブロック用グループ */
export const DISCOVERY_SPOTLIGHT_GROUPS = [
  {
    id: "yokai",
    titleKey: "discovery.groupYokai",
    ctaHref: "/hyakki/chapters",
    ctaKey: "discovery.ctaHyakkiHub",
    titleens: HYAKKI_CLUSTER_TITLEEN,
  },
  {
    id: "rokudo",
    titleKey: "discovery.groupRokudo",
    ctaHref: "/kusouzu/chapters-kusouzu",
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
    ctaHref: "/genji/chapters-genji",
    ctaKey: "discovery.ctaGenjiHub",
    titleens: [
      "genjimonogatari-emaki-tokugawa",
      "naomoto_moushibumi_ekotoba",
    ],
  },
];
