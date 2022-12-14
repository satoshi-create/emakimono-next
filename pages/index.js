import React from "react";
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
import FullScreenComp from "../components/FullScreenComp";
import EmakiConteiner from "../components/EmakiConteiner";
import dataEmakis from "../libs/data";

const Home = ({ cyouzyuuzinbutugiga,seiyoukaiga }) => {
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
      <FullScreenComp right={"1rem"} padding={"4rem 0"}>
        <EmakiConteiner
          data={{ ...cyouzyuuzinbutugiga }}
          height={"50vh"}
          scroll={false}
        />
      </FullScreenComp>
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
      <FullScreenComp left={"1rem"} padding={"4rem 0"}>
        <EmakiConteiner
          data={{ ...seiyoukaiga }}
          height={"50vh"}
          scroll={false}
        />
      </FullScreenComp>
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

  const seiyoukaiga = dataEmakis.find(
    (seiyoukaiga) => seiyoukaiga.title === "ブランカッチ礼拝堂 装飾画"
  );

  return {
    props: {
      cyouzyuuzinbutugiga: cyouzyuuzinbutugiga,
      seiyoukaiga: seiyoukaiga,
    },
  };
};

export default Home;
