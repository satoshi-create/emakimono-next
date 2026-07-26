import { buildLocaleUrl, SITE_ORIGIN } from "@/libs/constants/dataSiteMeta";

/**
 * CollectionPage + ItemList + BreadcrumbList for /kusouzu/chapters-kusouzu.
 */
export function buildKusouzuHubJsonLd({
  locale,
  defaultLocale = "en",
  pageName,
  pageDescription,
  siteTitle,
  hubData,
}) {
  const pageUrl = buildLocaleUrl(
    locale,
    "/kusouzu/chapters-kusouzu",
    defaultLocale
  );

  const stageItems = hubData.stages.map((stage, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: stage.titleen,
    url: buildLocaleUrl(locale, `/kusouzu/${stage.slug}`, defaultLocale),
  }));

  const scrollItems = hubData.scrollEmakis.map((scroll, index) => ({
    "@type": "ListItem",
    position: hubData.stages.length + index + 1,
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
      numberOfItems: stageItems.length + scrollItems.length,
      itemListElement: [...stageItems, ...scrollItems],
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
