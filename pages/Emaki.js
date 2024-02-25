import React, { useRef } from "react";
import { useRouter } from "next/router";
import EmakiConteiner from "../components/EmakiConteiner";
import Sidebar from "../components/Sidebar";
import Head from "../components/Meta";
import Controller from "../components/Controller";
import EmakiInfo from "../components/EmakiInfo";
import AttentionEmakiPage from "../components/AttentionEmakiPage";
import FullScreen from "../components/FullScreen";

export const Emaki = ({ emakis, locale, locales, slug }) => {
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

  // useEffect(() => {
  //   const pathAndSlug = router.asPath.split("#")[0];
  //   const newPath = `${pathAndSlug}#s5`;
  //   window.location.replace(newPath);
  // }, []);
  function scrollToId(itemId) {
    const map = getMap();
    const node = map.get(itemId);
    node.scrollIntoView({
      behavior: "smooth",
      // // vertical
      // block: "nearest",
      // // horizontal
      // inline: "center",
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
      <Controller value={emakis} />
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
