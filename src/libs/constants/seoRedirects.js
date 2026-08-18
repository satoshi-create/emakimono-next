/**
 * クローラー 404 対策の 301。next.config.js から require する（CJS）。
 * defaultLocale は `en` のため `/en/...` は正規 URL ではない。
 */
const personProfiles = require("../../data/personname-data/personprofiles.json");
const { DISPLAY_PERSON_SLUGS } = require("./displayPersonSlugs");

function buildUnpublishedPersonRedirects() {
  return personProfiles
    .filter((p) => p.slug && !DISPLAY_PERSON_SLUGS.includes(p.slug))
    .map((p) => ({
      source: `/personname/${p.slug}`,
      destination: "/personname/personnamelist",
      permanent: true,
    }));
}

function buildSeoRedirects() {
  return [
    {
      source: "/era/heian",
      destination: "/era/heiann",
      permanent: true,
    },
    {
      source: "/keyword/dragon",
      destination: "/keyword/keywordlist",
      permanent: true,
    },
    ...buildUnpublishedPersonRedirects(),
    {
      source: "/sitemap-index.xml",
      destination: "/sitemap.xml",
      permanent: true,
      locale: false,
    },
    {
      source: "/sitemap_index.xml",
      destination: "/sitemap.xml",
      permanent: true,
      locale: false,
    },
    {
      source: "/news_sitemap.xml",
      destination: "/sitemap.xml",
      permanent: true,
      locale: false,
    },
    {
      source: "/sitemap.html",
      destination: "/sitemap.xml",
      permanent: true,
      locale: false,
    },
    {
      source: "/en",
      destination: "/",
      permanent: true,
      locale: false,
    },
    {
      source: "/en/:path*",
      destination: "/:path*",
      permanent: true,
      locale: false,
    },
  ];
}

module.exports = { buildSeoRedirects };
