/**
 * クローラー 404 対策の 301。next.config.js から require する（CJS）。
 * defaultLocale は `en` のため、Next.js i18n が自動的に locale ルーティングを処理する。
 * 手動の locale リダイレクト（/en → / など）は _next/static 等と衝突し無限ループの原因となるため記述しない。
 */
const fs = require("fs");
const path = require("path");

const profilesTsPath = path.join(__dirname, "../../data/persons/profiles.ts");
const profilesTsSource = fs.readFileSync(profilesTsPath, "utf8");
const personProfiles = Array.from(
  profilesTsSource.matchAll(/slug:\s*"([^"]+)"/g),
  (m) => ({ slug: m[1] })
);
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
      source: "/folklore",
      destination: "/ebiki",
      permanent: true,
    },
    {
      source: "/folklore/:path*",
      destination: "/ebiki",
      permanent: true,
    },
  ];
}

module.exports = { buildSeoRedirects };
