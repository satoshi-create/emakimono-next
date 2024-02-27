import React, { useContext, useEffect, useRef, useState } from "react";
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
import EmakiNavigation from "../components/EmakiNavigation";
import { flushSync } from "react-dom";

const Emaki = ({ data, locale, locales, slug }) => {
  const router = useRouter();
  const selectedRef = useRef(null);
  const [navIndex, setnavIndex] = useState(0);

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
    selectedRef.current.scrollIntoView({
      behavior: "smooth",
    });
  }
  const endIndex = data.emakis.length - 1;

  function handleCurselNext() {
    flushSync(() => {
      if (navIndex < endIndex) {
        setnavIndex(navIndex + 1);
      } else {
        setnavIndex(endIndex);
      }
    });
    selectedRef.current.scrollIntoView({
      behavior: "smooth",
    });
  }

  function handleCurselPrev() {
    flushSync(() => {
      if (navIndex <= 0) {
        setnavIndex(0);
      } else {
        setnavIndex(navIndex - 1);
      }
    });

    selectedRef.current.scrollIntoView({
      behavior: "smooth",
    });
  }

  useEffect(() => {
    // let de = document.documentElement;

    // function fullscreenchanged() {
    //   if (!document.fullscreenElement) {
    //     de.requestFullscreen()
    //       .then(() => {
    //         console.log("enter fullscreen");
    //         // screen.orientation.lock("orientation");
    //       })
    //       .catch((err) => {
    //         console.log(`Error attempting to enable fullscreen mode ${err})`);
    //       });
    //   }
    // }

    // fullscreenchanged();

    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        screen.orientation.unlock();
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
      <AttentionEmakiPage />
      <FullScreen />
      <EmakiInfo value={data} />
      {/* <Controller value={data} /> */}
      <EmakiNavigation
        handleCurselNext={handleCurselNext}
        handleCurselPrev={handleCurselPrev}
        endIndex={endIndex}
        handleToId={handleToId}
        data={data}
      />
      <Sidebar value={data} handleToId={handleToId} />
      <EmakiConteiner
        data={{ ...data }}
        height={"100vh"}
        scroll={true}
        selectedRef={selectedRef}
        navIndex={navIndex}
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
