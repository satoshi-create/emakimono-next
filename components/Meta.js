import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import siteImg from "../public/ogp.jpg";
import { useLocaleMeta } from "../libs/func";

const Meta = ({ pagetitle, pageDesc, pageImg, pageAuthor }) => {
  const { t } = useLocaleMeta();
  const { locale, locales, asPath, defaultLocale } = useRouter();
  console.log({ locales, asPath, defaultLocale });

  const title = pagetitle ? `${pagetitle} | ${t.siteTitle}` : t.siteTitle;
  const tPageDesc =
    locale === "en"
      ? `You can enjoy all the scenes of the${pagetitle} ${
          pageAuthor && `（${pageAuthor}）`
        }in vertical and right to left scrolling mode.`
      : `${pagetitle} ${
          pageAuthor && `（${pageAuthor}）`
        }の全シーンを、縦書き、横スクロールで楽しむことができます。`;
  const pageDescTemp = pageDesc ? pageDesc : tPageDesc;

  const desc = pagetitle ? pageDescTemp : t.siteDesc;

  const url = `${t.siteUrl}${asPath}`;


  return (
    <Head>
      <title>{title}</title>
      <meta property="og:title" content={title} />

      <meta name="description" content={desc} />
      <meta property="og:description" content={desc} />

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

      <link rel="icon" href={t.siteIcon} />
      <link rel="apple-touch-icon" href={t.siteIcon} />
    </Head>
  );
};

export default Meta;
