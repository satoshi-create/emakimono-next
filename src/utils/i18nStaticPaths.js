import i18nConfig from "../../next-i18next.config";

const SUPPORTED_LOCALES = i18nConfig?.i18n?.locales || ["ja", "en"];

/**
 * Generates Next.js getStaticPaths `paths` across all configured i18n locales.
 *
 * @param {string[]} slugs
 * @param {string[]} [locales]
 * @returns {Array<{ params: { slug: string }, locale: string }>}
 */
export function buildI18nStaticPaths(slugs, locales = SUPPORTED_LOCALES) {
  const uniqueSlugs = Array.from(new Set((slugs || []).filter(Boolean)));
  const paths = [];
  for (const locale of locales) {
    for (const slug of uniqueSlugs) {
      paths.push({
        params: { slug },
        locale,
      });
    }
  }
  return paths;
}