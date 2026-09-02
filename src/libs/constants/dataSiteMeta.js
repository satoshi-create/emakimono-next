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




export { SITE_ORIGIN, buildLocaleUrl, jaMeta, enMeta };