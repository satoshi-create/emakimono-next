import React, { useRef, useEffect, useLayoutEffect, useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import CardA from "../components/CardA";
import CardB from "../components/CardB";
import "lazysizes";
import Head from "../components/Meta";
import Attention from "../components/Attention";
import { useLocale, useLocaleData, genjieSlugItem } from "../libs/func";
import ExtractingListData from "../components/ExtractingListData";
import ChaptersTable from "../components/ChaptersTable";
import FlowEmaki from "../components/FlowEmaki";

// TODO:loading機能を追加する

const Genji = () => {
  const { t } = useLocale();
  const { t: data } = useLocaleData();
  const removeNestedArrayObj = ExtractingListData();

  const AllGenjiChapters = genjieSlugItem(removeNestedArrayObj);

  const genjiFlowDatas = data.filter((item) => item.title.includes("源氏"));

  return (
    <main>
      <Head />
      <Header fixed={false} />
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
      <ChaptersTable AllGenjiChapters={AllGenjiChapters} />
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
