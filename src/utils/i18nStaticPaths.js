import {
  default as enData,
  default as jaData,
} from "@/data/scroll-metadata";

const DEFAULT_LOCALES = ["ja", "en"];

/**
 * Generate Next.js getStaticPaths entries across all configured locales.
 */
export function buildI18nStaticPaths(slugs, locales = DEFAULT_LOCALES) {
  const activeLocales =
    Array.isArray(locales) && locales.length > 0 ? locales : DEFAULT_LOCALES;
  return (slugs || []).flatMap((slug) =>
    activeLocales.map((locale) => ({
      params: { slug },
      locale,
    }))
  );
}

/**
 * Resolve emaki catalog data for the current locale.
 * Returns jaData for "ja", and falls back to enData for all other locales.
 */
export function resolveEmakiCatalog(locale) {
  return locale === "ja" ? jaData : enData;
}