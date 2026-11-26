/** Origin for canonical, hreflang, and absolute asset URLs (no locale prefix). */
const SITE_ORIGIN = "https://emakimono.com";

/**
 * Build the public URL for a locale + Next.js asPath.
 * Matches Next.js i18n routing: default locale (en) has no prefix; ja uses /ja.
 */
export type SiteMeta = {
  siteTitle: string;
  siteDesc: string;
  siteUrl: string;
  siteLang: string;
  siteLocale: string;
  siteType: string;
  siteIcon: string;
};

function buildLocaleUrl(
  locale: string,
  asPath: string,
  defaultLocale = "en"
): string {
  const path = asPath.split("#")[0].split("?")[0];
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  return `${SITE_ORIGIN}${prefix}${path}`;
}

export { SITE_ORIGIN, buildLocaleUrl };