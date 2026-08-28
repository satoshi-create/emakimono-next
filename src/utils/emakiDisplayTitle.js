/**
 * Locale-aware display title for an emaki scroll.
 * URL / analytics id remains `titleen`; optional `title_en` is English UI/SEO only.
 *
 * @param {{ title?: string, titleen?: string, title_en?: string }} data
 * @param {string} [locale]
 * @returns {string}
 */
export function emakiDisplayTitle(data, locale) {
  if (!data) return "";
  if (locale === "en") {
    return data.title_en || data.titleen || data.title || "";
  }
  return data.title || "";
}
