import { buildLocaleUrl, SITE_ORIGIN } from "@/libs/constants/dataSiteMeta";

function absoluteAssetUrl(path) {
  if (!path) return `${SITE_ORIGIN}/ogp.png`;
  return path.startsWith("https") ? path : `${SITE_ORIGIN}${path}`;
}

/**
 * Build VisualArtwork + BreadcrumbList JSON-LD for emaki viewer pages.
 */
export function buildEmakiJsonLd({
  locale,
  slug,
  defaultLocale = "en",
  name,
  description,
  image,
  imageWidth,
  imageHeight,
  creatorName,
  siteTitle,
  typeName,
  typeSlug,
}) {
  const pageUrl = buildLocaleUrl(locale, `/${slug}`, defaultLocale);
  const imageUrl = absoluteAssetUrl(image);

  const artwork = {
    "@type": "VisualArtwork",
    "@id": pageUrl,
    name,
    description,
    url: pageUrl,
    image: {
      "@type": "ImageObject",
      url: imageUrl,
      width: Number(imageWidth) || 533,
      height: Number(imageHeight) || 300,
    },
    publisher: {
      "@type": "Organization",
      name: siteTitle,
      url: SITE_ORIGIN,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_ORIGIN}/favicon.png`,
      },
    },
  };

  if (creatorName) {
    artwork.creator = {
      "@type": "Person",
      name: creatorName,
    };
  }

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
        name: typeName,
        item: buildLocaleUrl(locale, `/type/${typeSlug}`, defaultLocale),
      },
      {
        "@type": "ListItem",
        position: 3,
        name,
        item: pageUrl,
      },
    ],
  };

  return JSON.stringify(
    {
      "@context": "https://schema.org",
      "@graph": [artwork, breadcrumbList],
    },
    null,
    " "
  );
}
