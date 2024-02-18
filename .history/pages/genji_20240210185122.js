import React, { useRef, useEffect, useLayoutEffect, useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import CardA from "../components/CardA";
import CardB from "../components/CardB";
import "lazysizes";
import Head from "../components/Meta";
import GridImageList from "../components/GridImageList";
import Attention from "../components/Attention";
import ToggleTag from "../components/ToggleTag";
import { useLocale, useLocaleData } from "../libs/func";
import FullscreenContents from "../components/FullscreenContents";
import dataEmakis from "../libs/data";
import { gridImages } from "../libs/gridImages";
import SocialLinks from "../components/SocialLinks";

// TODO:loading機能を追加する

const Home = () => {
  const { t } = useLocale();
  const { t: data } = useLocaleData();

  const genjiEmakis = data.filter((emaki) => emaki.title.includes("源氏"));
  console.log(genjiEmakis);

  return (
    <main>
      <Head />
      <Header fixed={true} />
      <Attention />
      <CardA
        emakis={genjiEmakis}
        columns={t.genji.columns}
        sectiontitle={t.genji.title}
        sectiontitleen={t.genji.titleen}
        sectiondesc={t.history.desc}
        sectionname={t.genji.name}
        linktitle={"絵巻"}
        linktitleen={"EMAKIMONO"}
        linkpath={"emaki"}
      />
      <Footer />
    </main>
  );
};

export default Home;
