/** Origin for canonical, hreflang, and absolute asset URLs (no locale prefix). */
const SITE_ORIGIN = "https://emakimono.com";

/**
 * Build the public URL for a locale + Next.js asPath.
 * Matches Next.js i18n routing: default locale (en) has no prefix; ja uses /ja.
 */
function buildLocaleUrl(locale, asPath, defaultLocale = "en") {
  const path = asPath.split("#")[0].split("?")[0];
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  return `${SITE_ORIGIN}${prefix}${path}`;
}

const jaMeta = {
  siteTitle: "絵巻物ビューアー",
  siteDesc:
    "平安〜鎌倉の絵巻物を横スクロールで鑑賞。鳥獣人物戯画・地獄草紙・餓鬼草紙・九相図など、テーマ別に作品を追加中の絵巻物ビューアーです。",
  siteUrl: SITE_ORIGIN,
  siteLang: "ja",
  siteLocale: "ja_JP",
  siteType: "website",
  siteIcon: "/favicon.png",
};
const enMeta = {
  siteTitle: "Emakimono Viewer",
  siteDesc:
    "View Heian–Kamakura picture scrolls with horizontal scrolling — Chōjū-jinbutsu-giga, Hell Scrolls, Hungry Ghosts Scrolls, Kusōzu, and more.",
  siteUrl: SITE_ORIGIN,
  siteLang: "en",
  siteLocale: "en_EN",
  siteType: "website",
  siteIcon: "/favicon.png",
};
const zhHansMeta = {
  siteTitle: "绘卷物浏览器",
  siteDesc:
    "横向滚动欣赏古代绘卷与长卷艺术——鸟兽人物戏画、地狱草纸、饿鬼草纸、九相图等经典长卷在线高清鉴赏。",
  siteUrl: SITE_ORIGIN,
  siteLang: "zh-Hans",
  siteLocale: "zh_CN",
  siteType: "website",
  siteIcon: "/favicon.png",
};
const zhHantMeta = {
  siteTitle: "繪卷物瀏覽器",
  siteDesc:
    "橫向滾動欣賞古代繪卷與長卷藝術——鳥獸人物戲畫、地獄草紙、餓鬼草紙、九相圖等經典長卷線上高清鑑賞。",
  siteUrl: SITE_ORIGIN,
  siteLang: "zh-Hant",
  siteLocale: "zh_TW",
  siteType: "website",
  siteIcon: "/favicon.png",
};

export { SITE_ORIGIN, buildLocaleUrl, jaMeta, enMeta, zhHansMeta, zhHantMeta };