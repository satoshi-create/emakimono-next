import React, { useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import EmakiConteiner from "../components/EmakiConteiner";
import Sidebar from "../components/Sidebar";
import Head from "../components/Meta";
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
import EmakiNavigation from "../components/EmakiNavigation";
import { flushSync } from "react-dom";
import Header from "../components/Header";

// TODO:スマホ版横向きのページにタイトルと絵師名を追加する

const Emaki = ({ data, locale, locales, slug }) => {
  const router = useRouter();
  const selectedRef = useRef(null);
  const { navIndex, setnavIndex, setHash, orientation } =
    useContext(AppContext);
  const pagetitle = `${data.title} ${data.edition ? data.edition : ""}`;
  const tPageDesc =
    locale === "en"
      ? `You can enjoy all the scenes of the${pagetitle} ${
          data.author && `（${data.author}）`
        }in vertical and right to left scrolling mode.`
      : `${pagetitle} ${
          data.author && `（${data.author}）`
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
      url: data.thumb,
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

  function handleToId(id) {
    flushSync(() => {
      setnavIndex(id);
    });
  }

  useEffect(() => {
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        screen.orientation.unlock();
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      setnavIndex(0);
      setHash(0);
    };
  }, [setnavIndex, setHash]);

  const articleRef = useRef();
  const scrollNextRef = useRef(null);
  const scrollPrevRef = useRef(null);

  // イベントリスナーを使う方法で実装。
  // イベントハンドラーを使う方法は（scrollevent_eventhandler）内
  useEffect(() => {
    const con = articleRef.current;
    const btnPrev = scrollPrevRef.current;
    const btnNext = scrollNextRef.current;

    const scrollNextEvent = () => {
      con.scrollTo({
        left: con.scrollLeft - 1000,
        behavior: "smooth",
      });
    };

    const scrollPrevEvent = () => {
      con.scrollTo({
        left: con.scrollLeft + 1000,
        behavior: "smooth",
      });
    };

    if (btnNext) {
      btnNext.addEventListener("click", scrollNextEvent);
    }
    if (btnPrev) {
      btnPrev.addEventListener("click", scrollPrevEvent);
    }
    return () => {
      if (btnNext) {
        btnNext.removeEventListener("click", scrollNextEvent);
      }
      if (btnPrev) {
        btnNext.removeEventListener("click", scrollNextEvent);
      }
    };
  }, []);

  return (
    <>
      <Head
        pagetitle={pagetitle}
        pageAuthor={data.author}
        pageDesc={data.metadesc}
        pageImg={data.thumb}
        pageImgW={data.thumb.width}
        pageImgH={data.thumb.height}
        pageType={data.type}
        jsonLd={jsonLd}
      />
      {orientation === "portrait" && <Header emakipage={true} />}
      <FullScreen />
      {/* <AttentionEmakiPage /> */}
      {/* <EmakiInfo value={data} /> */}
      {/* <EmakiNavigation
        handleToId={handleToId}
        data={data}
        scrollNextRef={scrollNextRef}
        scrollPrevRef={scrollPrevRef}
      /> */}
      {/* <Sidebar value={data} handleToId={handleToId} /> */}
      <EmakiConteiner
        data={{ ...data }}
        scroll={true}
        selectedRef={selectedRef}
        navIndex={navIndex}
        articleRef={articleRef}
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
      data: filterdEmakisData,
      locales,
      locale,
      slug,
    },
  };
};

export default Emaki;
