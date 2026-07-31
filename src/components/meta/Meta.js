import Head from "next/head";
import { useRouter } from "next/router";
// import siteImg from "/ogp.jpg";
import { buildLocaleUrl, SITE_ORIGIN } from "@/libs/constants/dataSiteMeta";
import { useLocaleMeta } from "@/utils/func";

const Meta = ({
  pagetitle,
  pageDesc,
  pageImg,
  pageImgW,
  pageImgH,
  pageAuthor,
  jsonLd,
  noindex,
}) => {
  const { t } = useLocaleMeta();
  const { locale, locales, asPath, defaultLocale } = useRouter();

  const title = pagetitle ? `${pagetitle} | ${t.siteTitle}` : t.siteTitle;

  const pageDescAll = pageDesc ? pageDesc : t.siteDesc;

  const url = buildLocaleUrl(locale, asPath, defaultLocale);

  const img = pageImg ? pageImg : "/ogp.png";
  const imgUrl = img.startsWith("https") ? img : `${SITE_ORIGIN}${img}`;
  const imgW = pageImgW ? pageImgW : "1200";
  const imgH = pageImgH ? pageImgH : "630";

  return (
    <Head>
      <title>{title}</title>
      <meta property="og:title" content={title} />
      <meta name="description" content={pageDescAll} />
      <meta property="og:description" content={pageDescAll} />
      <link rel="canonical" href={url} />
      <meta property="og:url" content={url} />
      {locales.map((loc) => (
        <link
          key={`hreflang-${loc}`}
          rel="alternate"
          hrefLang={loc}
          href={buildLocaleUrl(loc, asPath, defaultLocale)}
        />
      ))}
      <link
        key="hreflang-default"
        rel="alternate"
        hrefLang="x-default"
        href={buildLocaleUrl(defaultLocale, asPath, defaultLocale)}
      />

      <meta property="og:site_name" content={t.siteTitle} />
      <meta property="og:type" content={t.siteType} />
      <meta property="og:locale" content={t.siteLocale} />

      <meta property="og:image" content={imgUrl} />
      <meta property="og:image:width" content={imgW} />
      <meta property="og:image:height" content={imgH} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={pageDescAll} />
      <meta name="twitter:image" content={imgUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <link rel="icon" href="/favicon.png" />
      <link rel="apple-touch-icon" href={t.siteIcon} />
      {jsonLd && (
        <script
          key="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      )}
    </Head>
  );
};

export default Meta;
