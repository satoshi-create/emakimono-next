import { buildLocaleUrl, SITE_ORIGIN } from "@/libs/constants/dataSiteMeta";

/** WebPage + ItemList + BreadcrumbList for /manga-roots */
export function buildMangaRootsJsonLd({
  locale,
  defaultLocale = "en",
  pageName,
  pageDescription,
  siteTitle,
  themes,
}) {
  const pageUrl = buildLocaleUrl(locale, "/manga-roots", defaultLocale);
  const scrollItems = themes
    .flatMap((theme) => theme.scrolls)
    .filter(
      (scroll, index, list) =>
        list.findIndex((s) => s.titleen === scroll.titleen) === index
    )
    .map((scroll, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: scroll.title,
      url: buildLocaleUrl(locale, `/${scroll.titleen}`, defaultLocale),
    }));

  return JSON.stringify(
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
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
        },
        {
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
        },
      ],
    },
    null,
    " "
  );
}
