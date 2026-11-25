/**
 * Locale-aware display title for an emaki scroll.
 * URL / analytics id remains `titleen`; optional `title_en` is English UI/SEO only.
 *
 * @param {{ title?: string, titleen?: string, title_en?: string }} data
 * @param {string} [locale]
 * @returns {string}
 */
const LOCALE_SUFFIX_MAP = {
  en: ["_en", "en"],
};

/**
 * Resolve a localized field from an emaki metadata object without nested ternaries.
 * Example: getLocalizedField(item, "author", locale) -> checks authoren / author
 */
export function getLocalizedField(data, baseKey, locale, fallback = "") {
  if (!data) return fallback;
  if (locale === "ja") {
    return data[baseKey] ?? fallback;
  }
  const suffixes = LOCALE_SUFFIX_MAP[locale] || ["_en", "en"];
  for (const suffix of suffixes) {
    const val = data[`${baseKey}${suffix}`];
    if (val !== undefined && val !== null && val !== "") {
      return val;
    }
  }
  return data[baseKey] ?? fallback;
}

export function emakiDisplayTitle(data, locale) {
  if (!data) return "";
  return getLocalizedField(data, "title", locale, data.titleen || "");
}
