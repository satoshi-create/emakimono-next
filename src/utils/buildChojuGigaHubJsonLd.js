import { buildLocaleUrl, SITE_ORIGIN } from "@/libs/constants/dataSiteMeta";

/**
 * CollectionPage + ItemList + BreadcrumbList for /chouju-giga/chapters.
 */
export function buildChojuGigaHubJsonLd({
  locale,
  defaultLocale = "en",
  pageName,
  pageDescription,
  siteTitle,
  hubData,
}) {
  const pageUrl = buildLocaleUrl(
    locale,
    "/chouju-giga/chapters",
    defaultLocale
  );

  const scrollItems = hubData.scrolls.map((scroll, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: scroll.titleen,
    url: buildLocaleUrl(locale, `/${scroll.titleen}`, defaultLocale),
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
      numberOfItems: scrollItems.length,
      itemListElement: scrollItems,
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
