import React from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import "lazysizes";
import Head from "../components/Meta";
// import styles from "../styles/Flow.css.module.css";
import Title from "../components/Title";
import FullscreenContents from "../components/FullscreenContents";
import dataEmakis from "../libs/data";
import { useLocale, useLocaleData } from "../libs/func";
import { useRouter } from "next/router";
import Breadcrumbs from "../components/Breadcrumbs";

const Flow = ({ cyouzyuuzinbutugiga, seiyoukaiga, suibokuga, mone }) => {
  const { t } = useLocale();
  const { t: data } = useLocaleData();
    const { locale } = useRouter();
  return (
    <>
      <Head />
      <Header />
      <Breadcrumbs name={locale === "en" ? "flow" : "流れる巻物"} />
      <FullscreenContents
        data={{ cyouzyuuzinbutugiga, seiyoukaiga, suibokuga, mone }}
        sectiontitle={"流れる巻物"}
        sectiontitleen={"flow"}
      />
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

export default Flow;
