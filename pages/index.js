import React, { useRef, useEffect, useLayoutEffect, useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import CardA from "../components/CardA";
import CardB from "../components/CardB";
import "lazysizes";
import Head from "../components/Meta";
import GridImages from "../components/GridImages";
import Attention from "../components/Attention";
import ToggleTag from "../components/ToggleTag";
import { useLocale, useLocaleData } from "../libs/func";
import FullscreenContents from "../components/FullscreenContents";
import dataEmakis from "../libs/data";

const Home = ({ cyouzyuuzinbutugiga, seiyoukaiga, suibokuga, mone }) => {
  // const scrollRef = useRef();
  // console.log(scrollRef);

  // useEffect(() => {
  //   const scrollToLatest = (behavior = "smooth") =>
  //     scrollRef.current.scrollIntoView({ behavior });
  //   scrollToLatest();
  // }, []);

  // useLayoutEffect(() => {
  //   const scrollToLatest = (behavior = "smooth") =>
  //     scrollRef.current.scrollIntoView({ behavior });
  //   scrollToLatest();
  // }, [])

  const { t } = useLocale();
  const { t: data } = useLocaleData();
  const favoriteEmakis = data.filter((emaki) => emaki.favorite === true);

  const setsuwaEmakis = data.filter((emaki) => emaki.subtype === "説話");
  const kousoudenEmakis = data.filter((emaki) => emaki.subtype === "高僧伝");
  const buttenEmakis = data.filter((emaki) => emaki.subtype === "仏典");
  const gyouziEmakis = data.filter((emaki) => emaki.subtype === "諸行事・祭礼");

  const variation = [
    ...setsuwaEmakis,
    ...kousoudenEmakis,
    ...buttenEmakis,
    ...gyouziEmakis,
  ];

  const typeByoubu = data.filter((emaki) => emaki.type === "屏風").splice(0, 1);
  const typeUkiyoe = data
    .filter((emaki) => emaki.type === "浮世絵")
    .splice(0, 1);
  const typeSuibokuga = data
    .filter((emaki) => emaki.type === "水墨画")
    .splice(0, 1);
  const typeSeiyoukaiga = data
    .filter((emaki) => emaki.type === "西洋絵画")
    .splice(0, 1);

  const alpha = [
    ...typeByoubu,
    ...typeUkiyoe,
    ...typeSuibokuga,
    ...typeSeiyoukaiga,
  ];

  const historyemakis = [
    {
      path: "/era/heiann",
      name: "平安",
      nameen: "Heian",
      src: "/cyoujyuu_yamazaki_kou_13-375.webp",
      eracolor: "orange",
    },
    {
      path: "/era/kamakura",
      name: "鎌倉",
      nameen: "Kamakura",
      src: "/naomoto_03-1080.webp",
      eracolor: "green",
    },
    {
      path: "/era/muromachi",
      name: "室町",
      nameen: "Muromachi",
      src: "/sessyu_sikisansuizu_07-1080.webp",
      eracolor: "purple",
    },
    {
      path: "/era/edo",
      name: "江戸",
      nameen: "Edo",
      src: "/tokugawagyouretsu_32-1080.webp",
      eracolor: "skyblue",
    },
  ];

  return (
    <>
      <Head />
      <Header />
      <Attention />
      <CardA
        emakis={favoriteEmakis}
        columns={t.favorite.columns}
        sectiontitle={t.favorite.title}
        sectiontitleen={t.favorite.titleen}
        sectiondesc={t.history.desc}
        sectionname={t.favorite.name}
        linktitle={"絵巻"}
        linktitleen={"EMAKIMONO"}
        linkpath={"emaki"}
      />
      <CardA
        emakis={variation}
        columns={t.variation.columns}
        sectiontitle={t.variation.title}
        sectiontitleen={t.variation.titleen}
        sectiondesc={t.variation.desc}
        sectionname={t.variation.name}
        linktitle={"絵巻"}
        linktitleen={"EMAKIMONO"}
        linkpath={"emaki"}
      />
      <FullscreenContents
        data={{ cyouzyuuzinbutugiga, seiyoukaiga, suibokuga, mone }}
        sectiontitle={"流れる巻物"}
        sectiontitleen={"flow"}
        linktitle={"ワイド美術"}
        linktitleen={"EMAKIMONO"}
        linkpath={"flow"}
        columns={t.favorite.columns}
      />
      <CardB
        emakis={historyemakis}
        columns={t.history.columns}
        sectiontitle={t.history.title}
        sectiontitleen={t.history.titleen}
        sectiondesc={t.history.desc}
        sectionname={t.history.name}
      />
      <ToggleTag
        sectiontitle={t.toggleTag.title}
        sectiontitleen={t.toggleTag.titleen}
      />
      <GridImages
        sectiontitle={t.famousscene.title}
        sectiontitleen={t.famousscene.titleen}
        sectiondesc={t.famousscene.desc}
        sectionname={t.famousscene.name}
      />
      <CardA
        emakis={alpha}
        columns={t.alpha.columns}
        sectiontitle={t.alpha.title}
        sectiontitleen={t.alpha.titleen}
        sectiondesc={t.alpha.desc}
        sectionname={t.alpha.name}
        linktitle={"ワイド美術"}
        linktitleen={"Side-scrolling art"}
      />
      {/* <div style={{ float: "left", clear: "both" }} ref={scrollRef}></div> */}
      <Footer />
    </>
  );
};

export const getStaticProps = async (context) => {
  const { locale, locales } = context;
  // const tEmakisData = locale === "en" ? enData : jaData;

  const cyouzyuuzinbutugiga = dataEmakis.find(
    (item, index) =>
      item.title === "鳥獣人物戯画絵巻" && item.edition === "甲巻"
  );

  const suibokuga = dataEmakis.find(
    (item, index) => item.title === "四季山水図巻（山水長巻）"
  );
  const mone = dataEmakis.find((item, index) => item.title === "睡蓮 連作");

  const seiyoukaiga = dataEmakis.find(
    (seiyoukaiga) => seiyoukaiga.title === "ブランカッチ礼拝堂 装飾画"
  );

  return {
    props: {
      cyouzyuuzinbutugiga: cyouzyuuzinbutugiga,
      seiyoukaiga: seiyoukaiga,
      suibokuga: suibokuga,
      mone: mone,
    },
  };
};

export default Home;
