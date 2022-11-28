import React from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import CardA from "../components/CardA";
import CardB from "../components/CardB";
import emakisData from "../libs/data";
import "lazysizes";
import Head from "../components/Meta";
import GridImages from "../components/GridImages";
import Attention from "../components/Attention";
import ToggleTag from "../components/ToggleTag";
import { useLocale } from "../libs/func";

const Home = () => {
  const { t } = useLocale();
  const favoriteEmakis = emakisData.filter((emaki) => emaki.favorite === true);

  const setsuwaEmakis = emakisData.filter((emaki) => emaki.subtype === "説話");
  const kousoudenEmakis = emakisData.filter(
    (emaki) => emaki.subtype === "高僧伝"
  );
  const buttenEmakis = emakisData.filter((emaki) => emaki.subtype === "仏典");
  const gyouziEmakis = emakisData.filter(
    (emaki) => emaki.subtype === "諸行事・祭礼"
  );

  const variation = [
    ...setsuwaEmakis,
    ...kousoudenEmakis,
    ...buttenEmakis,
    ...gyouziEmakis,
  ];

  const typeByoubu = emakisData
    .filter((emaki) => emaki.type === "屏風")
    .splice(0, 1);
  const typeUkiyoe = emakisData
    .filter((emaki) => emaki.type === "浮世絵")
    .splice(0, 1);
  const typeSuibokuga = emakisData
    .filter((emaki) => emaki.type === "水墨画")
    .splice(0, 1);
  const typeSeiyoukaiga = emakisData
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
      src: "/cyoujyuu_yamazaki_kou_13-375.webp",
      eracolor: "orange",
    },
    {
      path: "/era/kamakura",
      name: "鎌倉",
      src: "/naomoto_03-1080.webp",
      eracolor: "green",
    },
    {
      path: "/era/muromachi",
      name: "室町",
      src: "/sessyu_sikisansuizu_07-1080.webp",
      eracolor: "purple",
    },
    {
      path: "/era/edo",
      name: "江戸",
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
        sectionname={"recommend"}
      />
      <CardA
        emakis={variation}
        columns={t.variation.columns}
        sectiontitle={t.variation.title}
        sectiontitleen={t.variation.titleen}
        sectiondesc={t.variation.desc}
        sectionname={t.variation.name}
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
      />
      <Footer />
    </>
  );
};

export default Home;
