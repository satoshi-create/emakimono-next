import { buildLocaleUrl, SITE_ORIGIN } from "@/libs/constants/dataSiteMeta";

/**
 * CollectionPage + ItemList + BreadcrumbList for /timeline.
 * 年表エントリを ItemList として構造化し、絵巻物×日本史ページの SEO を補強する。
 */
export function buildTimelineJsonLd({
  locale,
  defaultLocale = "en",
  pageName,
  pageDescription,
  siteTitle,
  rows,
}) {
  const pageUrl = buildLocaleUrl(locale, "/timeline", defaultLocale);

  const itemList = rows.map((row, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: row.arts || String(row.yearText || row.year),
  }));

  const collectionPage = {
    "@type": "CollectionPage",
    "@id": pageUrl,
    name: pageName,
    description: pageDescription,
    url: pageUrl,
    isPartOf: {
      "@type": "WebSite",
      name: siteTitle,
      url: SITE_ORIGIN,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: itemList.length,
      itemListElement: itemList,
    },
  };

  const breadcrumbList = {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: siteTitle,
        item: buildLocaleUrl(locale, "/", defaultLocale),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: pageName,
        item: pageUrl,
      },
    ],
  };

  return JSON.stringify(
    {
      "@context": "https://schema.org",
      "@graph": [collectionPage, breadcrumbList],
    },
    null,
    " "
  );
}
