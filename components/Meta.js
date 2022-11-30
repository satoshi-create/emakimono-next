import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import siteImg from "../public/ogp.jpg";
import { useLocaleMeta } from "../libs/func";

const Meta = ({
  pagetitle,
  pageDesc,
  pageImg,
  pageImgW,
  pageImgH,
  pageAuthor,
}) => {
  const { t } = useLocaleMeta();
  const { locale } = useRouter();


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

  const router = useRouter();
  const url = `${t.siteUrl}${router.asPath}`;

  // ogp画像
  const img = pageImg || siteImg.src;
  const imgW = pageImgW || siteImg.width;
  const imgH = pageImgH || siteImg.height;
  const imgUrl = img.startsWith("https") ? img : `${t.siteUrl}${img}`;

  return (
    <Head>
      <title>{title}</title>
      <meta property="og:title" content={title} />

      <meta name="description" content={desc} />
      <meta property="og:description" content={desc} />

      <link rel="canonical" href={url} />
      <meta property="og:url" content={url} />

      <meta property="og:site_name" content={t.siteTitle} />
      <meta property="og:type" content={t.siteType} />
      <meta property="og:locale" content={t.siteLocale} />

      <link rel="icon" href={t.siteIcon} />
      <link rel="apple-touch-icon" href={t.siteIcon} />

      {/* <meta property="og:image" content={imgUrl} />
      <meta property="og:image:width" content={imgW} />
      <meta property="og:image:height" content={imgH} />
      <meta name="twitter:card" content="summary_large_image" /> */}
    </Head>
  );
};

export default Meta;
