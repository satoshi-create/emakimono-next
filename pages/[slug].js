import React, { useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import EmakiConteiner from "../components/EmakiConteiner";
import Sidebar from "../components/Sidebar";
import Head from "../components/Meta";
import emakisData from "../libs/data";
import enData from "../libs/data";
import jaData from "../libs/data";
import { AppContext } from "../pages/_app";
import FullScreen from "../components/FullScreen";
import EmakiBreadcrumbs from "../components/EmakiBreadcrumbs";
import EmakiHeader from "../components/EmakiHeader";
import EmakiPortraitContent from "../components/EmakiPortraitContent";
import EmakiLandscapContent from "../components/EmakiLandscapContent";
import { useLocaleMeta } from "../libs/func";

// TODO:スマホ版横向きのページにタイトルと絵師名を追加する

const Emaki = ({ data, locale, locales, slug, test }) => {
  const { t } = useLocaleMeta();
  const router = useRouter();
  const selectedRef = useRef(null);
  const {
    navIndex,
    setnavIndex,
    setHash,
    orientation,
    toggleFullscreen,
    setToggleFullscreen,
  } = useContext(AppContext);


  const pagetitle =
    locale === "en"
      ? data.titleen
      : `${data.title} ${data.edition ? data.edition : ""}`;

  const pageAuthor = locale === "en" ? data.authoren : data.author;

  const tPageDesc =
    locale === "en"
      ? `You can enjoy all the scenes of the ${pagetitle} ${
          pageAuthor && `（${pageAuthor}）`
        }in vertical and right to left scrolling mode.`
      : `${pagetitle}${
          pageAuthor && `（${pageAuthor}）`
        }の全シーンを、縦書き、横スクロールで楽しむことができます。`;

  const pageDesc = locale === "en" ? data.descen : data.desc;

  const pageDescTemp = pageDesc ? pageDesc : tPageDesc;

  const jsonData = {
    "@context": "http://schema.org",
    "@type": "NewsArticle",
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
      name: "横スクロールで楽しむ絵巻",
      url: "https://portfoliosite-next.vercel.app/",
    },
    publisher: {
      "@type": "Organization",
      name: "横スクロールで楽しむ絵巻",
      logo: {
        "@type": "ImageObject",
        url: "/favicon.png",
      },
      breadcrumbList: {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "横スクロールで楽しむ絵巻",
            item: "https://emakimono.com/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: data.type,
            item: `https://emakimono.com/type/${data.typeen}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: data.title,
          },
        ],
      },
      // breadcrumbList: {
      //   "@type": "BreadcrumbList",
      //   itemListElement: [
      //     {
      //       "@type": "ListItem",
      //       position: 1,
      //       name: "home",
      //       item: `${
      //         locale === "en"
      //           ? `https://emakimono.com/en`
      //           : `https://emakimono.com/${nameAen}`
      //       }`,
      //     },
      //     {
      //       "@type": "ListItem",
      //       position: 2,
      //       name: `${locale === "en" ? data.typeen : data.type}`,
      //       item: `${
      //         locale === "en"
      //           ? `https://emakimono.com/en/${nameAen}`
      //           : `https://emakimono.com/${nameAen}`
      //       }`,
      //     },
      //     {
      //       "@type": "ListItem",
      //       position: 3,
      //       name: `${locale === "en" ? data.titleen : data.title}`,
      //     },
      //   ],
      // },
    },
    // carousel: {
    //   "@context": "https://schema.org",
    //   "@type": "ItemList",
    //   itemListElement: [
    //     {
    //       "@type": "ListItem",
    //       position: 1,
    //       url: data.thumb,
    //     },
    //   ],
    // },
  };
  const jsonLd = JSON.stringify(jsonData, null, " ");

  useEffect(() => {
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        setToggleFullscreen(false);
        screen.orientation.unlock();
      }
    };
  }, [setToggleFullscreen]);

  useEffect(() => {
    // https: qiita.com/7280ayubihs/items/0d359c3a3b5bc8a4b6fd
    // 画面遷移した際に、スクロール位置をリセット
    window.scrollTo({ top: 0, behavior: "instant" });
    setnavIndex(0);
    setHash(0);
  }, [setnavIndex, setHash]);

  // const matchMediaContainer = (ori) => {
  //   switch (ori) {
  //     case "landscape":
  //       return (
  //         <EmakiPortraitContent
  //           data={data}
  //           scroll={true}
  //           selectedRef={selectedRef}
  //           navIndex={navIndex}
  //           height={"40vh"}
  //         />
  //       );
  //     case "portrait":
  //       return (
  //         <>
  //           <EmakiLandscapContent
  //             data={{ ...data }}
  //             scroll={true}
  //             selectedRef={selectedRef}
  //             navIndex={navIndex}
  //             height={"75vh"}
  //           />
  //         </>
  //       );
  //     default:
  //       break;
  //   }
  // };

  const matchMediaContainer = (full, ori) => {
    if (full && ori === "landscape") {
      return (
        <>
          <EmakiConteiner
            data={{ ...data }}
            scroll={true}
            selectedRef={selectedRef}
            navIndex={navIndex}
            height={"100vh"}
          />
        </>
      );
    } else if (ori === "landscape") {
      return (
        <>
          <EmakiHeader />
          <EmakiBreadcrumbs
            nameA={locale === "en" ? data.typeen : data.type}
            nameAen={`type/${data.typeen}`}
            nameB={locale === "en" ? data.titleen : data.title}
          />
          <EmakiLandscapContent
            data={{ ...data }}
            scroll={true}
            selectedRef={selectedRef}
            navIndex={navIndex}
          />
        </>
      );
    } else if (ori === "portrait") {
      return (
        <>
          <EmakiHeader />
          <EmakiBreadcrumbs
            orientation={orientation}
            nameA={locale === "en" ? data.typeen : data.type}
            nameAen={`type/${data.typeen}`}
            nameB={locale === "en" ? data.titleen : data.title}
          />
          <EmakiPortraitContent
            data={data}
            scroll={true}
            selectedRef={selectedRef}
            navIndex={navIndex}
            height={"40vh"}
          />
        </>
      );
    }
  };

  return (
    <>
      <Head
        pagetitle={pagetitle}
        pageAuthor={pageAuthor}
        pageDesc={pageDescTemp}
        pageImg={data.thumb}
        pageImgW={data.thumb.width}
        pageImgH={data.thumb.height}
        pageType={data.type}
        jsonLd={jsonLd}
      />

      {matchMediaContainer(toggleFullscreen, orientation)}
      {/* {matchMediaContainer(orientation)} */}
      {/* {toggleFullscreen && orientation === "landscape" ? (
        <>
          <EmakiConteiner
            data={{ ...data }}
            scroll={true}
            selectedRef={selectedRef}
            navIndex={navIndex}
            height={"100vh"}
          />
        </>
      ) : (
        <>
          <EmakiHeader />
          {orientation === "portrait" && (
            <EmakiPortraitContent
              data={data}
              scroll={true}
              selectedRef={selectedRef}
              navIndex={navIndex}
              height={"40vh"}
            />
          )}
          {orientation === "landscape" && (
            <EmakiLandscapContent
              data={{ ...data }}
              scroll={true}
              selectedRef={selectedRef}
              navIndex={navIndex}
              height={"75vh"}
            />
          )}
        </>
      )} */}
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

  const filterdEmakisData = tEmakisData.filter(
    (item, index) => item.titleen === slug
  );
  const addObjEmakis = filterdEmakisData
    .map((item, i) => {
      const addLinkIdtoEmakis = item.emakis.map((item, i) => {
        return { ...item, linkId: i };
      });

      const addEkotobaIdEmakis = addLinkIdtoEmakis
        .filter((item) => item.cat === "ekotoba")
        .map((item, i) => {
          return { ...item, ekotobaId: i };
        });

      const concatAddObjEmakis = Array.from(
        new Set(addLinkIdtoEmakis.concat(addEkotobaIdEmakis))
      );

      const filterAddObjEmakisA = concatAddObjEmakis.filter(
        (item) => item.cat === "image"
      );
      const filterAddObjEmakisB = concatAddObjEmakis.filter(
        (item) => item.cat === "ekotoba" && item.ekotobaId >= 0
      );
      const concatFilterAddObjEmakis =
        filterAddObjEmakisA.concat(filterAddObjEmakisB);

      const sortConcatFilterAddObjEmakis = concatFilterAddObjEmakis.sort(
        (a, b) => (a.linkId > b.linkId ? 1 : -1)
      );

      console.log(sortConcatFilterAddObjEmakis);

      return { ...item, emakis: sortConcatFilterAddObjEmakis };
    })
    .find((item) => item);

  // const emakis = filterdEmakisData.emakis
  // console.log(emakis);

  // const addObjEmakis = emakis.map((item, i) => {
  //   if (item.cat === "ekotoba") {
  //     return { ...item, ekotobaId: i, linkId: i };
  //   }
  //   return { ...item, linkId: i };
  // });

  // const test = filterdEmakisData
  //   .map((item, i) => {
  //     return { ...item, emakis: addObjEmakis };
  //   })
  //   .find((item) => item);

  return {
    props: {
      data: addObjEmakis,
      locales,
      locale,
      slug,
      test: addObjEmakis,
    },
  };
};

export default Emaki;
