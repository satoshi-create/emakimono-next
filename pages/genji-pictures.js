import React, { useRef, useEffect, useLayoutEffect, useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import CardA from "../components/CardA";
import CardB from "../components/CardB";
import "lazysizes";
import Head from "../components/Meta";
import Attention from "../components/Attention";
import { useLocale, useLocaleData } from "../libs/func";
import ExtractingListData from "../components/ExtractingListData";
import ChaptersTable from "../components/ChaptersTable";
import FlowEmaki from "../components/FlowEmaki";

// TODO:loading機能を追加する

const Genji = () => {
  const { t } = useLocale();
  const { t: data } = useLocaleData();
  const removeNestedArrayObj = ExtractingListData();

  const genjiPictures = removeNestedArrayObj.filter((emaki) =>
    emaki.title.includes("源氏")
  );

  const genjiFlowDatas = data
    .filter((item) => item.title.includes("源氏"))
    .filter((item) => item.type !== "古典文学");

  return (
    <main>
      <Head />
      <Header fixed={true} />
      {/* <CardA
        emakis={genjiPictures.slice(0, 4)}
        columns={"four"}
        sectiontitle={t.genji.title}
        sectiontitleen={t.genji.titleen}
        sectiondesc={t.history.desc}
        sectionname={t.genji.name}
        // linktitle={"絵巻"}
        // linktitleen={"EMAKIMONO"}
        // linkpath={"emaki"}
      /> */}
      {/* <ChaptersTable
        sectiontitle={"源氏物語54帖"}
        sectiontitleen={"The Tale of Genji 54 chapters"}
      /> */}
      <FlowEmaki
        flowEmakis={genjiFlowDatas}
        // sectiontitle={t.flow.title}
        // sectiontitleen={t.flow.titleen}
      />
      <Footer />
    </main>
  );
};

export default Genji;
