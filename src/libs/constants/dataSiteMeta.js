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
    "縦書き、横スクロールで、絵巻物本来の見方を楽しむことを追求しているサイトです。平安時代にはじまり鎌倉、室町、安土・桃山、江戸、そして明治まで、時代を超えて受け継がれてきた絵巻物を、ウェブの世界に一覧＆横スクロールで見えるようにし、現在によみがえらせることを目指しています。",
  siteUrl: SITE_ORIGIN,
  siteLang: "ja",
  siteLocale: "ja_JP",
  siteType: "website",
  siteIcon: "/favicon.png",
};
const enMeta = {
  siteTitle: "Emakimono Viewer",
  siteDesc:
    "This site pursues the enjoyment of picture scrolls by scrolling from right to left!",
  siteUrl: SITE_ORIGIN,
  siteLang: "en",
  siteLocale: "en_EN",
  siteType: "website",
  siteIcon: "/favicon.png",
};




export { SITE_ORIGIN, buildLocaleUrl, jaMeta, enMeta };