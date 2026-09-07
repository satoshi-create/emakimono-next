import { buildLocaleUrl, SITE_ORIGIN } from "@/libs/constants/dataSiteMeta";
import { GENJI_HUB_PATH } from "@/libs/constants/genjiSources";

/**
 * CollectionPage + ItemList + BreadcrumbList for /genji/chapters-genji.
 */
export function buildGenjiHubJsonLd({
  locale,
  defaultLocale = "en",
  pageName,
  pageDescription,
  siteTitle,
  hubData,
}) {
  const pageUrl = buildLocaleUrl(locale, GENJI_HUB_PATH, defaultLocale);

  const chapterItems = hubData.chapters.map((chapter, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: chapter.titleen,
    url: buildLocaleUrl(locale, `/genji/${chapter.path}`, defaultLocale),
  }));

  const scrollItems = hubData.scrollEmakis.map((scroll, index) => ({
    "@type": "ListItem",
    position: hubData.chapters.length + index + 1,
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
      numberOfItems: chapterItems.length + scrollItems.length,
      itemListElement: [...chapterItems, ...scrollItems],
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
