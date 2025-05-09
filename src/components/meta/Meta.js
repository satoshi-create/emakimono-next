import Head from "next/head";
import { useRouter } from "next/router";
// import siteImg from "/ogp.jpg";
import { useLocaleMeta } from "@/utils/func";

const Meta = ({
  pagetitle,
  pageDesc,
  pageImg,
  pageImgW,
  pageImgH,
  pageAuthor,
  jsonLd,
}) => {
  const { t } = useLocaleMeta();
  const { locale, locales, asPath, defaultLocale } = useRouter();

  const title = pagetitle ? `${pagetitle} | ${t.siteTitle}` : t.siteTitle;

  const pageDescAll = pageDesc ? pageDesc : t.siteDesc;

  const url = `${t.siteUrl}${asPath}`;

  const img = pageImg ? pageImg : "/ogp.png";
  const imgUrl = img.startsWith("https") ? img : `${t.siteUrl}${img}`;
  const imgW = pageImgW ? pageImgW : "533";
  const imgH = pageImgH ? pageImgH : "300";

  return (
    <Head>
      <title>{title}</title>
      <meta property="og:title" content={title} />
      <meta name="description" content={pageDescAll} />
      <meta property="og:description" content={pageDescAll} />
      <link rel="canonical" href={url} />
      <meta property="og:url" content={url} />
      {locales.map((locale) => {
        return (
          <link
            key={`hreflang-${locale}`}
            rel="alternate"
            hrefLang={locale}
            href={`https://emakimono.com${
              locale === defaultLocale ? "" : "/" + locale
            }${asPath}`}
          />
        );
      })}
      <link
        key="hreflang-default"
        rel="alternate"
        hrefLang="x-default"
        href={`https://emakimono.com${asPath}`}
      />

      <meta property="og:site_name" content={t.siteTitle} />
      <meta property="og:type" content={t.siteType} />
      <meta property="og:locale" content={t.siteLocale} />

      <meta property="og:image" content={imgUrl} />
      <meta property="og:image:width" content={imgW} />
      <meta property="og:image:height" content={imgH} />
      <meta name="twitter:card" content="summary_large_image" />

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
