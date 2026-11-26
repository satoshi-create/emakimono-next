/**
 * Returns true when the active locale is Japanese.
 *
 * @param {string} [locale]
 * @returns {boolean}
 */
export function isJa(locale) {
  return locale === "ja";
}

/**
 * Resolves a localized field from an object with English fallback for non-Japanese locales.
 *
 * @param {Record<string, any>} item
 * @param {string} baseKey
 * @param {string} [locale]
 * @returns {string}
 */
export function getLocalizedField(item, baseKey, locale) {
  if (!item) return "";
  if (locale === "ja") {
    return item[baseKey] || item[`${baseKey}_en`] || item[`${baseKey}en`] || "";
  }
  if (locale === "zh-Hans") {
    return (
      item[`${baseKey}_zhHans`] ||
      item[`${baseKey}_zh`] ||
      item[`${baseKey}zh`] ||
      item[`${baseKey}_en`] ||
      item[`${baseKey}en`] ||
      item[baseKey] ||
      ""
    );
  }
  return item[`${baseKey}_en`] || item[`${baseKey}en`] || item[baseKey] || "";
}

/**
 * Locale-aware display title for an emaki scroll.
 * URL / analytics id remains `titleen`; optional `title_en` is English UI/SEO only.
 *
 * @param {{ title?: string, titleen?: string, title_en?: string, title_zh?: string, title_zhHans?: string }} data
 * @param {string} [locale]
 * @returns {string}
 */
export function emakiDisplayTitle(data, locale) {
  if (!data) return "";
  if (locale === "ja") {
    return data.title || "";
  }
  if (locale === "zh-Hans") {
    return (
      data.title_zhHans ||
      data.title_zh ||
      data.titlezh ||
      data.title_en ||
      data.titleen ||
      data.title ||
      ""
    );
  }
  return data.title_en || data.titleen || data.title || "";
}
