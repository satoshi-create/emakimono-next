import React, { useContext, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import EmakiConteiner from "../components/EmakiConteiner";
import Sidebar from "../components/Sidebar";
import Head from "../components/Meta";
import Controller from "../components/Controller";
import emakisData from "../libs/data";
import enData from "../libs/en/data";
import jaData from "../libs/data";
import Footer from "../components/Footer";
import FullScreenComp from "../components/FullScreenComp";
import Translate from "../components/Translate";
import EmakiInfo from "../components/EmakiInfo";
import AttentionEmakiPage from "../components/AttentionEmakiPage";
import styles from "../styles/viewport.module.css";
import { AppContext } from "../pages/_app";
import FullScreen from "../components/FullScreen";
import EmakiCursel from "../components/EmakiCursel";

const Emaki = ({ emakis, locale, locales, slug }) => {
  const router = useRouter();
  const itemsRef = useRef(null);

  const pagetitle = `${emakis.title} ${emakis.edition ? emakis.edition : ""}`;
  const tPageDesc =
    locale === "en"
      ? `You can enjoy all the scenes of the${pagetitle} ${
          emakis.author && `（${emakis.author}）`
        }in vertical and right to left scrolling mode.`
      : `${pagetitle} ${
          emakis.author && `（${emakis.author}）`
        }の全シーンを、縦書き、横スクロールで楽しむことができます。`;

  const jsonData = {
    "@context": "http://schema.org",
    "@type": "Article",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://${locale}/emakimono.com/${slug}`,
    },
    headline: pagetitle,
    description: tPageDesc,
    url: `https://${locale}/emakimono.com/${slug}`,
    image: {
      "@type": "ImageObject",
      url: emakis.thumb,
      width: "533px",
      height: "300px",
    },
    author: {
      "@type": "Person",
      name: "太郎",
    },
    publisher: {
      "@type": "Organization",
      name: "横スクロールで楽しむ絵巻",
      logo: {
        "@type": "ImageObject",
        url: "/favicon.png",
      },
    },
  };
  const jsonLd = JSON.stringify(jsonData, null, " ");

  //  anchor link with smooth scroll
  function scrollToId(itemId) {
    const map = getMap();
    const node = map.get(itemId);
    node.scrollIntoView({
      behavior: "smooth",
    });
  }
  function getMap() {
    if (!itemsRef.current) {
      // Initialize the Map on first usage.
      itemsRef.current = new Map();
    }
    return itemsRef.current;
  }

  return (
    <>
      <Head
        pagetitle={pagetitle}
        pageAuthor={emakis.author}
        pageDesc={emakis.metadesc}
        pageImg={emakis.thumb}
        pageImgW={emakis.thumb.width}
        pageImgH={emakis.thumb.height}
        pageType={emakis.type}
        jsonLd={jsonLd}
      />
      <AttentionEmakiPage />
      <FullScreen />
      <EmakiInfo value={emakis} />
      {/* <Controller value={emakis} /> */}
      <EmakiCursel data={emakis} scrollToId={scrollToId} />
      <Sidebar value={emakis} scrollToId={scrollToId} />
      <EmakiConteiner
        data={{ ...emakis }}
        height={"100vh"}
        scroll={true}
        getMap={getMap}
      />
    </>
  );
};

export const getStaticPaths = async () => {
  const paths = emakisData.map((item) => ({
    params: {
      slug: item.titleen,
    },
    locale: "ja",
  }));
  paths.push(...paths.map((item) => ({ ...item, locale: "en" })));
  return { paths, fallback: false };
};

export const getStaticProps = async (context) => {
  const { slug } = context.params;
  const { locale, locales } = context;
  const tEmakisData = locale === "en" ? enData : jaData;

  const filterdEmakisData = tEmakisData.find(
    (item, index) => item.titleen === slug
  );

  return {
    props: {
      emakis: filterdEmakisData,
      locales,
      locale,
      slug,
    },
  };
};

export default Emaki;
