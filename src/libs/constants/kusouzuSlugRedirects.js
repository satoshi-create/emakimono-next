/**
 * 301 redirects: legacy kusouzu URLs (titleen with spaces) → kebab-case slug.
 * Used by next.config.js — keep in sync with chapters-of-kusouzu.json.
 */
const chapters = require("../../data/emaki-text-data/chapters-of-kusouzu.json");

/** Spaces in legacy titleen URLs are percent-encoded in requests. */
function legacyKusouzuPath(titleen) {
  return `/kusouzu/${titleen.replace(/ /g, "%20")}`;
}

function buildKusouzuSlugRedirects() {
  const redirects = [];
  chapters.forEach(({ titleen, slug }) => {
    if (!slug || slug === titleen) return;
    redirects.push({
      source: legacyKusouzuPath(titleen),
      destination: `/kusouzu/${slug}`,
      permanent: true,
    });
  });
  return redirects;
}

module.exports = { buildKusouzuSlugRedirects };
