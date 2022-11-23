import React from "react";
import siteMeta from "../libs/constants";
import Head from "next/head";
import { useRouter } from "next/router";
import Router from "next/dist/server/router";
import siteImg from "../public/ogp.jpg";

const Meta = ({
  pagetitle,
  pageDesc,
  pageImg,
  pageImgW,
  pageImgH,
  pageType,
  pageAuthor,
}) => {
  const {
    siteTitle,
    siteDesc,
    siteUrl,
    siteLang,
    siteLocale,
    siteType,
    siteIcon,
  } = siteMeta;

  const title = pagetitle ? `${pagetitle} | ${siteTitle}` : siteTitle;
  const pageDescTemp = pageDesc
    ? pageDesc
    : `${pagetitle} ${
        pageAuthor && `（${pageAuthor}）`
      }の全シーンを、縦書き、横スクロールで楽しむことができます。`;
  // const pageDescTemp = `${pagetitle} ${
  //   pageAuthor && `（${pageAuthor}）`
  // }の全シーンを、縦書き、横スクロールで楽しむことができます。`;
  const desc = pagetitle ? pageDescTemp : siteDesc;

  const router = useRouter();
  const url = `${siteUrl}${router.asPath}`;

  // ogp画像
  const img = pageImg || siteImg.src;
  const imgW = pageImgW || siteImg.width;
  const imgH = pageImgH || siteImg.height;
  const imgUrl = img.startsWith("https") ? img : `${siteUrl}${img}`;

  return (
    <Head>
      <title>{title}</title>
      <meta property="og:title" content={title} />

      <meta name="description" content={desc} />
      <meta property="og:description" content={desc} />

      <link rel="canonical" href={url} />
      <meta property="og:url" content={url} />

      <meta property="og:site_name" content={siteTitle} />
      <meta property="og:type" content={siteType} />
      <meta property="og:locale" content={siteLocale} />

      <link rel="icon" href={siteIcon} />
      <link rel="apple-touch-icon" href={siteIcon} />

      {/* <meta property="og:image" content={imgUrl} />
      <meta property="og:image:width" content={imgW} />
      <meta property="og:image:height" content={imgH} />
      <meta name="twitter:card" content="summary_large_image" /> */}
    </Head>
  );
};

export default Meta;
